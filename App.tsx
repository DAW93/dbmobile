import React, { useEffect } from 'react';
import { useAppContext } from './hooks/useAppContext';
import { View } from './types';
import Sidebar from './components/shared/Sidebar';
import Header from './components/shared/Header';
import Dashboard from './components/Dashboard';
import BindersView from './components/BindersView';
import Shop from './components/Shop';
import Settings from './components/Settings';
import NewPageModal from './components/NewPageModal';
import NotificationOverlay from './components/shared/NotificationOverlay';
import AuthView from './components/AuthView';

const App: React.FC = () => {
  const { state, dispatch } = useAppContext();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window && state.isAuthenticated) {
      // Function to ask for permission and subscribe
      const subscribeUser = async () => {
        try {
          const swRegistration = await navigator.serviceWorker.ready;
          let subscription = await swRegistration.pushManager.getSubscription();

          if (subscription === null) {
            // The public key is needed for the browser to authenticate with your push service.
            // This should be loaded securely from your backend/environment variables.
            const vapidPublicKey = 'YOUR_PUBLIC_VAPID_KEY'; // This needs to be generated on your backend
            
            // This is a placeholder as we don't have a real VAPID key.
            // In a real app, without a valid key, this will fail.
            // For now, we proceed to illustrate the flow.
            if (!vapidPublicKey.startsWith('B')) {
                console.warn("VAPID key not set. Push subscription will likely fail. This is for demonstration only.");
            }

            subscription = await swRegistration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: vapidPublicKey,
            });
          }
          
          console.log('User is subscribed:', subscription);
          dispatch({ type: 'SET_PUSH_SUBSCRIPTION', payload: subscription });

          // Here, you would send the subscription to your backend
          // await fetch('/api/save-subscription', {
          //   method: 'POST',
          //   body: JSON.stringify(subscription),
          //   headers: { 'Content-Type': 'application/json' }
          // });

        } catch (error) {
          console.error('Failed to subscribe the user: ', error);
          if (Notification.permission === 'denied') {
            console.warn('Permission for notifications was denied');
          }
        }
      };

      if (Notification.permission === 'granted') {
          subscribeUser();
      }
      // We don't ask for permission automatically here, 
      // it's better handled by a user action (e.g., in Settings).
    }
  }, [state.isAuthenticated, dispatch]);


  const renderView = () => {
    switch (state.currentView) {
      case View.DASHBOARD:
        return <Dashboard />;
      case View.BINDERS:
        return <BindersView />;
      case View.SHOP:
        return <Shop />;
      case View.SETTINGS:
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (!state.isAuthenticated) {
    return <AuthView />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-800 p-4 sm:p-6 md:p-8">
          {renderView()}
        </main>
      </div>
      <NewPageModal />
      <NotificationOverlay />
    </div>
  );
};

export default App;