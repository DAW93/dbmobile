
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ICONS } from '../constants';
import { Page, Task, TaskStatus, View } from '../types';
import { Clock, CheckCircle, ListTodo, Circle, PlayCircle } from 'lucide-react';

const TaskStatusIcon = ({ status }: { status: TaskStatus }) => {
  switch (status) {
    case TaskStatus.COMPLETED:
      return <CheckCircle className="text-green-500" size={20} />;
    case TaskStatus.IN_PROGRESS:
      return <PlayCircle className="text-yellow-500" size={20} />;
    case TaskStatus.PENDING:
      return <Clock className="text-blue-500" size={20} />;
    case TaskStatus.INCOMPLETE:
      return <Circle className="text-gray-500" size={20} />;
    default:
      return null;
  }
};

const Dashboard: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { binders } = state;

  const allPages = binders.flatMap(b => b.pages.map(p => ({ ...p, binderId: b.id, binderName: b.name })));
  const recentPages = allPages.slice(0, 5);

  const allTasks = binders.flatMap(b => b.pages.flatMap(p => p.tasks));
  const taskSummary = allTasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<TaskStatus, number>);

  const upcomingReminders = allPages
    .filter(p => p.reminder && p.reminder.frequency !== 'None')
    .slice(0, 5);

  const handlePageClick = (binderId: string, pageId: string) => {
    dispatch({ type: 'SELECT_PAGE', payload: { binderId, pageId } });
    dispatch({ type: 'SET_VIEW', payload: View.BINDERS });
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome back, {state.user.name}. Here's your summary.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recent Pages */}
        <div className="bg-gray-900 rounded-xl p-6 shadow-lg col-span-1 md:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-4">Recently Opened</h2>
          <div className="space-y-3">
            {recentPages.length > 0 ? recentPages.map(page => (
              <button
                key={page.id}
                onClick={() => handlePageClick(page.binderId, page.id)}
                className="flex items-center w-full p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-200"
              >
                <div className="mr-4 text-blue-400">{ICONS.page}</div>
                <div>
                    <p className="font-medium text-white text-left">{page.title}</p>
                    <p className="text-sm text-gray-400 text-left">{page.binderName}</p>
                </div>
              </button>
            )) : <p className="text-gray-400">No recent pages.</p>}
          </div>
        </div>

        {/* Task Summary */}
        <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Task Summary</h2>
          <div className="space-y-4">
            {Object.values(TaskStatus).map(status => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <TaskStatusIcon status={status} />
                  <span className="ml-3 text-gray-300">{status}</span>
                </div>
                <span className="font-bold text-white bg-gray-700 rounded-full px-3 py-1 text-sm">
                  {taskSummary[status] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Upcoming Reminders</h2>
        <div className="space-y-3">
          {upcomingReminders.length > 0 ? upcomingReminders.map(page => (
            <div key={page.id} className="flex items-center p-3 rounded-lg bg-gray-800">
              <Clock className="mr-4 text-purple-400" size={20} />
              <div>
                <p className="font-medium text-white">{page.title}</p>
                <p className="text-sm text-gray-400">
                  {page.reminder.frequency} reminder
                </p>
              </div>
            </div>
          )) : <p className="text-gray-400">No upcoming reminders.</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
