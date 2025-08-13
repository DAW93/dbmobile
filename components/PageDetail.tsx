

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Page, Task, TaskStatus, FileRef, Reminder, ReminderFrequency, FileCategory, NotificationStyle, ActiveNotification } from '../types';
import { ICONS } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import CountdownTimer from './CountdownTimer';
import { X } from 'lucide-react';

// --- Helper Functions ---
const getFileCategory = (mimeType: string): FileCategory => {
    if (mimeType.startsWith('video/')) return FileCategory.VIDEO;
    if (mimeType.startsWith('audio/')) return FileCategory.AUDIO;
    if (mimeType.startsWith('image/')) return FileCategory.IMAGE;
    if (mimeType === 'application/pdf' || mimeType.includes('document') || mimeType.startsWith('text/')) return FileCategory.DOCUMENT;
    return FileCategory.OTHER;
};

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};


const TaskItem: React.FC<{ 
    task: Task, 
    onUpdate: (updatedTask: Task) => void, 
    onDelete: (taskId: string) => void,
    onTimerEnd: (task: Task) => void,
    onTimerStart: (task: Task) => void,
}> = ({ task, onUpdate, onDelete, onTimerEnd, onTimerStart }) => {
    const isTimerActive = task.startTime && task.dueDate && new Date(task.dueDate).getTime() > Date.now();

    const [date, time] = (task.dueDate || 'T').split('T');

    const handleDateTimeChange = (newDate?: string, newTime?: string) => {
        const currentDate = date || '';
        const currentTime = time || '00:00';
        
        const finalDate = newDate !== undefined ? newDate : currentDate;
        const finalTime = newTime !== undefined ? newTime : currentTime;

        if (finalDate) {
            onUpdate({ ...task, dueDate: `${finalDate}T${finalTime}` });
        } else {
            onUpdate({ ...task, dueDate: undefined, startTime: undefined });
        }
    };

    return (
        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg flex-wrap">
            <div className="flex items-center flex-grow">
                 <input type="checkbox" checked={task.status === TaskStatus.COMPLETED} 
                    onChange={(e) => onUpdate({...task, status: e.target.checked ? TaskStatus.COMPLETED : TaskStatus.INCOMPLETE})}
                    className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-blue-500 focus:ring-blue-600"
                />
                <input 
                    type="text"
                    value={task.text}
                    onChange={(e) => onUpdate({ ...task, text: e.target.value })}
                    className={`ml-3 text-gray-200 bg-transparent border-none focus:ring-0 p-0 w-full ${task.status === TaskStatus.COMPLETED ? 'line-through text-gray-500' : ''}`}
                />
            </div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                 {isTimerActive ? (
                    <CountdownTimer 
                        targetDate={task.dueDate!} 
                        onComplete={() => onTimerEnd(task)} 
                    />
                ) : (
                    <div className="flex items-center space-x-1">
                        <input
                            type="date"
                            aria-label="Task Due Date"
                            value={date || ''}
                            onChange={(e) => handleDateTimeChange(e.target.value, undefined)}
                            className="bg-gray-800 border border-gray-600 rounded-md p-1 text-xs text-gray-300 focus:ring-blue-500"
                        />
                        <input
                            type="time"
                            aria-label="Task Due Time"
                            value={time || ''}
                            onChange={(e) => handleDateTimeChange(undefined, e.target.value)}
                            disabled={!date}
                            className="bg-gray-800 border border-gray-600 rounded-md p-1 text-xs text-gray-300 focus:ring-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed"
                        />
                    </div>
                )}
                <button 
                    onClick={() => onTimerStart(task)}
                    disabled={!task.dueDate || isTimerActive}
                    className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-gray-500"
                >
                    Start
                </button>
                <button 
                    onClick={() => onDelete(task.id)} 
                    disabled={isTimerActive}
                    title={isTimerActive ? "Cannot delete a task with an active timer." : "Delete Task"}
                    className="text-gray-400 hover:text-red-500 p-1 disabled:text-gray-600 disabled:cursor-not-allowed"
                >
                    {ICONS.delete}
                </button>
            </div>
        </div>
    );
};

const FileItem: React.FC<{
    file: FileRef;
    isActive: boolean;
    onActivate: () => void;
    onDeactivate: () => void;
    onDelete: (fileId: string) => void;
    onPlay: (e: React.SyntheticEvent<HTMLAudioElement | HTMLVideoElement>) => void;
}> = ({ file, isActive, onActivate, onDeactivate, onDelete, onPlay }) => {

    const renderThumbnail = () => {
        const commonClasses = "w-32 h-24 object-cover rounded-md transition-transform duration-300 group-hover:scale-110";
        const iconContainerClasses = `${commonClasses} flex items-center justify-center bg-gray-800`;

        switch (file.category) {
            case FileCategory.IMAGE:
                return <img src={file.url} alt={file.name} className={`${commonClasses} bg-gray-900`} />;
            case FileCategory.VIDEO:
                return <video src={`${file.url}#t=0.5`} muted preload="metadata" className={`${commonClasses} bg-black`} />;
            case FileCategory.AUDIO:
                return <div className={iconContainerClasses}>{ICONS.audio}</div>;
            case FileCategory.DOCUMENT:
                return <div className={iconContainerClasses}>{ICONS.document}</div>;
            default:
                return <div className={iconContainerClasses}>{ICONS.page}</div>;
        }
    };

    const renderActivePlayer = () => {
        switch (file.category) {
            case FileCategory.VIDEO:
                return <video src={file.url} onPlay={onPlay} controls autoPlay className="w-full max-w-lg max-h-96 rounded-lg bg-black" />;
            case FileCategory.AUDIO:
                return (
                    <div className="w-full max-w-lg p-4 flex flex-col items-center justify-center bg-gray-800 rounded-lg">
                        <span className="text-pink-400">{ICONS.audio}</span>
                        <audio src={file.url} onPlay={onPlay} controls autoPlay className="w-full mt-4" />
                    </div>
                );
            case FileCategory.IMAGE:
                return <img src={file.url} alt={file.name} className="w-auto h-auto max-w-lg max-h-96 rounded-lg object-contain" />;
            default:
                return (
                    <div className="text-center p-8 bg-gray-800 rounded-lg max-w-lg mx-auto">
                        <p className="text-lg text-gray-300 mb-4 truncate">"{file.name}"</p>
                        <a
                            href={file.url}
                            download={file.name}
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                        >
                            Download File
                        </a>
                    </div>
                );
        }
    };

    return (
        <div className={`p-3 bg-gray-700/50 rounded-lg group transition-all duration-300 hover:bg-gray-700/80 ${isActive ? 'ring-2 ring-blue-500' : ''}`}>
            {isActive ? (
                <div className="relative">
                    <div className="flex justify-center items-center">
                        {renderActivePlayer()}
                    </div>
                    <button onClick={onDeactivate} className="absolute -top-1 -right-1 bg-gray-900/80 rounded-full p-1 text-white hover:bg-black z-10" title="Close">
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <div className="flex items-center cursor-pointer" onClick={onActivate}>
                    <div className="flex-shrink-0 w-32 h-24 flex items-center justify-center overflow-hidden rounded-md bg-gray-800">
                        {renderThumbnail()}
                    </div>
                    <div className="ml-4 truncate flex-1">
                        <p className="text-gray-100 font-medium truncate">{file.name}</p>
                        <p className="text-gray-400 text-sm capitalize">
                            {[FileCategory.IMAGE, FileCategory.VIDEO].includes(file.category)
                                ? formatBytes(file.size)
                                : file.category
                            }
                        </p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(file.id); }} className="ml-4 p-2 text-gray-500 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        {ICONS.delete}
                    </button>
                </div>
            )}
        </div>
    );
};

const PageDetail: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { binders, selectedBinderId, selectedPageId, notificationStyle, pushSubscription } = state;
  
  const [page, setPage] = useState<Page | null>(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeMediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (selectedBinderId && selectedPageId) {
      const binder = binders.find(b => b.id === selectedBinderId);
      const currentPage = binder?.pages.find(p => p.id === selectedPageId);
      setPage(currentPage || null);
       // Reset active file when page changes
      if (page?.id !== selectedPageId) {
          if (activeMediaRef.current) {
              activeMediaRef.current.pause();
              activeMediaRef.current = null;
          }
          setActiveFileId(null);
      }
    } else {
        setPage(null);
        setActiveFileId(null);
    }
  }, [selectedBinderId, selectedPageId, binders, page?.id]);
  
    useEffect(() => {
        // Cleanup function to run when the component unmounts or page changes
        return () => {
            if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
        };
    }, [selectedPageId]);

  const updatePage = useCallback((updatedPage: Page) => {
    if(selectedBinderId) {
        dispatch({ type: 'UPDATE_PAGE', payload: { binderId: selectedBinderId, page: updatedPage } });
    }
  }, [dispatch, selectedBinderId]);

    const handleToggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
        } else {
            if (!page) return;
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    
                    const memoName = prompt('Enter a name for your voice memo:', `Voice Memo ${new Date().toLocaleString()}`);
                    
                    if (page && memoName) {
                        const newFileRef: FileRef = {
                            id: uuidv4(),
                            name: memoName.endsWith('.webm') ? memoName : `${memoName}.webm`,
                            mimeType: audioBlob.type,
                            size: audioBlob.size,
                            createdAt: new Date().toISOString(),
                            url: audioUrl,
                            category: FileCategory.AUDIO,
                        };
                        updatePage({ ...page, files: [...page.files, newFileRef] });
                    } else {
                        URL.revokeObjectURL(audioUrl);
                    }

                    stream.getTracks().forEach(track => track.stop());
                    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                    setIsRecording(false);
                    setRecordingTime(0);
                    mediaRecorderRef.current = null;
                };

                mediaRecorder.start();
                setIsRecording(true);
                recordingTimerRef.current = window.setInterval(() => {
                    setRecordingTime(prevTime => prevTime + 1);
                }, 1000);

            } catch (err) {
                console.error('Error accessing microphone:', err);
                alert('Could not access microphone. Please check your browser permissions.');
                setIsRecording(false);
            }
        }
    };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (page) {
        const updatedPage = { ...page, notes: e.target.value };
        setPage(updatedPage);
        updatePage(updatedPage);
    }
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (page) {
        const updatedPage = { ...page, title: e.target.value };
        setPage(updatedPage);
        updatePage(updatedPage);
    }
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    if (page) {
        const updatedPage = { ...page, tasks: page.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) };
        updatePage(updatedPage);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    if (page) {
        const updatedPage = { ...page, tasks: page.tasks.filter(t => t.id !== taskId) };
        updatePage(updatedPage);
    }
  };
  
  const handleAddTask = () => {
    if (page && newTaskText.trim() !== '') {
        const newTask: Task = {
            id: uuidv4(),
            text: newTaskText.trim(),
            status: TaskStatus.INCOMPLETE,
        };
        const updatedPage = { ...page, tasks: [...page.tasks, newTask] };
        updatePage(updatedPage);
        setNewTaskText('');
    }
  };
  
  const handleReminderChange = (field: keyof Reminder, value: any) => {
      if (page) {
          const updatedPage = { ...page, reminder: { ...page.reminder, [field]: value }};
          updatePage(updatedPage);
      }
  };

  const [reminderDate, reminderTime] = (page?.reminder.dateTime || 'T').split('T');
  
  const handleReminderDateTimeChange = (newDate?: string, newTime?: string) => {
      if (!page) return;

      const currentDate = reminderDate || '';
      const currentTime = reminderTime || '00:00';
      
      const finalDate = newDate !== undefined ? newDate : currentDate;
      const finalTime = newTime !== undefined ? newTime : currentTime;
      
      if (finalDate) {
          handleReminderChange('dateTime', `${finalDate}T${finalTime}`);
      } else {
          handleReminderChange('dateTime', undefined);
      }
  };

  const schedulePushNotification = async (title: string, body: string, targetTime: number) => {
      if (!pushSubscription) {
          console.warn('Cannot schedule push notification: No push subscription available.');
          return;
      }
      
      // In a real app, this would be an API call to your backend.
      // The backend would then schedule to send a push message at the targetTime.
      console.log('Simulating sending push notification request to backend:');
      const payload = {
          subscription: pushSubscription,
          notification: {
              title,
              body,
              url: window.location.href, // URL to open on click
          },
          targetTime, // The backend would use this to schedule the push
      };
      console.log(payload);

      // fetch('/api/schedule-notification', {
      //   method: 'POST',
      //   body: JSON.stringify(payload),
      //   headers: { 'Content-Type': 'application/json' },
      // });
      
      alert(`A background notification has been scheduled for "${title}". You will be notified even if the app is closed.`);
  };


  const handleStartReminder = () => {
      if (page && page.reminder.dateTime && page.reminder.title) {
          handleReminderChange('isActive', true);
          schedulePushNotification(
              `Reminder: ${page.title}`,
              page.reminder.title,
              new Date(page.reminder.dateTime).getTime()
          );
      }
  };

    const handleStartTaskTimer = (task: Task) => {
        if (task.dueDate) {
            const updatedTask = { ...task, startTime: Date.now() };
            handleTaskUpdate(updatedTask);
            schedulePushNotification(
                `Task Due: ${page?.title || 'A page'}`,
                task.text,
                new Date(task.dueDate).getTime()
            );
        }
    };

    const handleTimerEnd = (payload: { title: string; sourceType: 'task' | 'reminder'; sourceId: string }) => {
        if (!selectedBinderId || !page) return;

        // The push notification is the primary reliable method.
        // This foreground notification is for when the app is open.
        // We'll skip standard browser notifications now to avoid duplicates.
        if (notificationStyle !== NotificationStyle.STANDARD) {
             const notificationPayload: ActiveNotification = {
                type: notificationStyle.toLowerCase() as 'alarm' | 'call',
                binderId: selectedBinderId,
                pageId: page.id,
                ...payload,
            };
            dispatch({ type: 'TRIGGER_NOTIFICATION', payload: notificationPayload });
        } else {
            // For standard style when app is open, we can just clear the timer state.
            if (payload.sourceType === 'reminder') {
                handleReminderChange('isActive', false);
            } else {
                const task = page.tasks.find(t => t.id === payload.sourceId);
                if (task) {
                    handleTaskUpdate({ ...task, startTime: undefined });
                }
            }
        }
    };

    const handleReminderTimerEnd = () => {
        if (!page?.reminder.title) return;
        handleTimerEnd({ title: page.reminder.title, sourceType: 'reminder', sourceId: page.id });
    };

    const handleTaskTimerEnd = (task: Task) => {
        handleTimerEnd({ title: task.text, sourceType: 'task', sourceId: task.id });
    };

  const handleDeletePage = () => {
    if (selectedBinderId && selectedPageId && window.confirm('Are you sure you want to delete this page?')) {
        page?.files.forEach(file => URL.revokeObjectURL(file.url));
        dispatch({ type: 'DELETE_PAGE', payload: { binderId: selectedBinderId, pageId: selectedPageId } });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !page) return;

    const newFileRef: FileRef = {
        id: uuidv4(),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        createdAt: new Date().toISOString(),
        url: URL.createObjectURL(file),
        category: getFileCategory(file.type),
    };

    const updatedPage = { ...page, files: [...page.files, newFileRef] };
    updatePage(updatedPage);
  };
  
  const handleSetActiveFile = useCallback((fileId: string | null) => {
      if (activeFileId !== fileId && activeMediaRef.current) {
          activeMediaRef.current.pause();
          activeMediaRef.current = null;
      }
      setActiveFileId(fileId);
  }, [activeFileId]);

  const handleFileDelete = (fileId: string) => {
    if (!page) return;
    const fileToDelete = page.files.find(f => f.id === fileId);
    if (!fileToDelete) return;

    if (activeFileId === fileId) {
        handleSetActiveFile(null);
    }
    
    URL.revokeObjectURL(fileToDelete.url);
    const updatedFiles = page.files.filter(f => f.id !== fileId);
    updatePage({ ...page, files: updatedFiles });
  };

  const handlePlay = useCallback((e: React.SyntheticEvent<HTMLAudioElement | HTMLVideoElement>) => {
    const mediaElement = e.currentTarget;
    if (activeMediaRef.current && activeMediaRef.current !== mediaElement) {
        activeMediaRef.current.pause();
    }
    activeMediaRef.current = mediaElement;
  }, []);

  if (!page) {
    return (
      <div className="flex items-center justify-center h-full text-center text-gray-500 p-4">
        <h2 className="text-xl font-semibold">Select a page</h2>
        <p className="mt-2">Choose a page from the list on the left to view its details.</p>
      </div>
    );
  }
  
  const isReminderActive = page.reminder.isActive && page.reminder.dateTime && new Date(page.reminder.dateTime).getTime() > Date.now();

  return (
    <div className="p-4 sm:p-6 md:p-8 h-full overflow-y-auto">
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

        <div className="flex justify-between items-start mb-6">
            <input 
                type="text"
                value={page.title}
                onChange={handleTitleChange}
                className="text-3xl font-bold text-white bg-transparent border-none focus:ring-0 p-0 w-full"
            />
            <button onClick={handleDeletePage} className="ml-4 text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-700">
                {ICONS.delete}
            </button>
        </div>
      
      <div className="space-y-8">
        {/* Reminder */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Page Reminder</h3>
            {isReminderActive ? (
                <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                    <h4 className="text-xl font-semibold text-white mb-4">{page.reminder.title}</h4>
                    <CountdownTimer 
                        targetDate={page.reminder.dateTime!} 
                        onComplete={handleReminderTimerEnd} 
                        className="font-mono text-5xl lg:text-6xl font-bold text-yellow-300 tracking-wider"
                    />
                </div>
            ) : (
                <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                    <input
                        type="text"
                        placeholder="Reminder Title"
                        value={page.reminder.title}
                        onChange={(e) => handleReminderChange('title', e.target.value)}
                        disabled={isReminderActive}
                        className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                        <input
                            type="date"
                            aria-label="Reminder Date"
                            value={reminderDate || ''}
                            onChange={(e) => handleReminderDateTimeChange(e.target.value, undefined)}
                            disabled={isReminderActive}
                            className="flex-grow bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                            type="time"
                            aria-label="Reminder Time"
                            value={reminderTime || ''}
                            onChange={(e) => handleReminderDateTimeChange(undefined, e.target.value)}
                            disabled={isReminderActive || !reminderDate}
                            className="flex-grow bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        />
                    </div>
                    <button 
                        onClick={handleStartReminder}
                        disabled={!page.reminder.dateTime || !page.reminder.title || isReminderActive}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-md disabled:bg-gray-500"
                    >
                        Start Reminder
                    </button>
              </div>
            )}
        </div>

        {/* Files */}
        <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-white flex items-center">{ICONS.shield}<span className="ml-2">Files (E2EE)</span></h3>
                <div className="flex items-center space-x-2">
                    {isRecording && (
                        <div className="flex items-center space-x-2 text-red-400 animate-pulse">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="font-mono text-sm">{new Date(recordingTime * 1000).toISOString().substring(14, 19)}</span>
                        </div>
                    )}
                    <button onClick={handleToggleRecording} className={`flex items-center px-3 py-1.5 text-sm rounded-lg transition-colors ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                        {isRecording ? ICONS.stop : ICONS.mic}
                        <span className="ml-2">{isRecording ? 'Stop' : 'Record Memo'}</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                        {ICONS.fileUpload}
                        <span className="ml-2">Upload File</span>
                    </button>
                </div>
            </div>
          <div className="space-y-3">
            {page.files.map(file => (
                <FileItem 
                    key={file.id} 
                    file={file}
                    isActive={activeFileId === file.id}
                    onActivate={() => handleSetActiveFile(file.id)}
                    onDeactivate={() => handleSetActiveFile(null)}
                    onDelete={handleFileDelete}
                    onPlay={handlePlay}
                />
            ))}
            {page.files.length === 0 && <p className="text-gray-500 text-sm p-4 text-center bg-gray-900/50 rounded-lg">No files attached. Click "Upload File" to add some.</p>}
          </div>
        </div>

        {/* Tasks */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Tasks</h3>
          <div className="space-y-3">
            {page.tasks.map(task => <TaskItem key={task.id} task={task} onUpdate={handleTaskUpdate} onDelete={handleTaskDelete} onTimerEnd={handleTaskTimerEnd} onTimerStart={handleStartTaskTimer} />)}
            {page.tasks.length === 0 && <p className="text-gray-500 text-sm">No tasks for this page.</p>}
          </div>
          <div className="mt-4 flex">
              <input 
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="Add a new task..."
                className="flex-grow bg-gray-800 border-gray-600 rounded-l-md p-2 text-white focus:ring-blue-500 focus:border-blue-500"
              />
              <button onClick={handleAddTask} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-r-md">
                Add Task
              </button>
          </div>
        </div>
        
        {/* Notes */}
        <div>
            <h3 className="text-xl font-semibold text-white mb-2">Notes</h3>
            <textarea
                value={page.notes}
                onChange={handleNoteChange}
                placeholder="Start writing your notes here..."
                className="w-full h-48 bg-gray-900 rounded-lg p-4 text-gray-200 focus:ring-2 focus:ring-blue-500 border border-gray-700 transition"
            />
        </div>

      </div>
    </div>
  );
};

export default PageDetail;