
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
  const { state } = useAppContext();

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
