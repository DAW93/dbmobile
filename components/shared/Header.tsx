
import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Settings, LogOut } from 'lucide-react';
import { View } from '../../types';
import { ICONS } from '../../constants';

const Header: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { user } = state;

  // This component will not render if user is null due to App.tsx logic
  if (!user) return null;

  return (
    <header className="flex-shrink-0 bg-gray-900 border-b border-gray-700 px-4 sm:px-6 md:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center">
            {/* Can add breadcrumbs or search here later */}
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => dispatch({ type: 'SET_NEW_PAGE_MODAL_OPEN', payload: true })} 
            className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            {ICONS.newPage}
            <span className="ml-2">New Page</span>
          </button>
          
          <button
            onClick={() => dispatch({ type: 'SET_USER_ROLE', payload: user.role === 'owner' ? 'user' : 'owner' })}
            className="flex items-center px-3 py-2 text-sm font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            title={`Switch to ${user.role === 'owner' ? 'User' : 'Owner'} View`}
          >
            {ICONS.userSwitch}
            <span className="ml-2">Switch View</span>
          </button>

          <div className="w-px h-6 bg-gray-700"></div>

          <span className="text-sm font-medium text-gray-300">{user.name} <span className="text-yellow-400">({user.role.charAt(0).toUpperCase() + user.role.slice(1)})</span></span>
          <div className="relative">
            <button className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500">
              {user.name.charAt(0).toUpperCase()}
            </button>
          </div>
          <button onClick={() => dispatch({type: 'SET_VIEW', payload: View.SETTINGS})} className="text-gray-400 hover:text-white transition-colors">
            <Settings size={20} />
          </button>
          <button onClick={() => dispatch({type: 'LOGOUT'})} className="text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
