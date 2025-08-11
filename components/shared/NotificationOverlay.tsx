

import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { audioService } from '../../services/audioService';
import { Phone, PhoneOff, AlarmClock, BellOff } from 'lucide-react';

const NotificationOverlay: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { activeNotification } = state;
  const vibrationIntervalRef = useRef<number | null>(null);

  const stopVibration = () => {
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    if (navigator.vibrate) {
      navigator.vibrate(0); // Stop any ongoing vibration
    }
  };

  useEffect(() => {
    if (activeNotification) {
      if (activeNotification.type === 'call') {
        audioService.play('ringtone');
        if (navigator.vibrate) {
          vibrationIntervalRef.current = window.setInterval(() => navigator.vibrate([1000, 500]), 1500);
        }
      } else if (activeNotification.type === 'alarm') {
        audioService.play('alarm');
         if (navigator.vibrate) {
          vibrationIntervalRef.current = window.setInterval(() => navigator.vibrate(200), 500);
        }
      }
    } else {
      audioService.stop();
      stopVibration();
    }
    
    // Cleanup on unmount
    return () => {
      audioService.stop();
      stopVibration();
    };
  }, [activeNotification]);
  
  const handleDismiss = () => {
    dispatch({ type: 'DISMISS_NOTIFICATION' });
  };

  if (!activeNotification) {
    return null;
  }

  const isCall = activeNotification.type === 'call';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex flex-col items-center justify-center text-white animate-fade-in">
        {isCall ? (
            // Fake Call UI
            <div className="text-center w-full h-full flex flex-col justify-between p-12">
                <div>
                    <h2 className="text-2xl text-gray-400">Incoming Call...</h2>
                </div>
                <div className="flex flex-col items-center">
                    <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center mb-6">
                        <Phone size={64} />
                    </div>
                    <h1 className="text-4xl font-bold">{activeNotification.title}</h1>
                    <p className="text-lg text-gray-300">Digital Binder Pro</p>
                </div>
                <div className="flex justify-around w-full max-w-sm mx-auto">
                    <button onClick={handleDismiss} className="flex flex-col items-center space-y-2 text-red-400">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                            <PhoneOff size={32}/>
                        </div>
                        <span>Decline</span>
                    </button>
                    <button onClick={handleDismiss} className="flex flex-col items-center space-y-2 text-green-400">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                             <Phone size={32}/>
                        </div>
                        <span>Accept</span>
                    </button>
                </div>
            </div>
        ) : (
            // Alarm UI
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl text-center w-full max-w-sm">
                <div className="text-yellow-400 mb-6">
                    <AlarmClock size={64} className="mx-auto animate-pulse" />
                </div>
                <h1 className="text-3xl font-bold mb-2">{activeNotification.title}</h1>
                <p className="text-gray-400 mb-8">Your reminder is going off!</p>
                <button
                    onClick={handleDismiss}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-4 rounded-xl transition-colors text-lg flex items-center justify-center space-x-2"
                >
                    <BellOff size={24} />
                    <span>Dismiss</span>
                </button>
            </div>
        )}
    </div>
  );
};

export default NotificationOverlay;
