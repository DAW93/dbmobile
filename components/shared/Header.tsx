

import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Settings, LogOut } from 'lucide-react';
import { View, UserRole } from '../../types';
import { ICONS } from '../../constants';

const Header: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { user, simulatedRole } = state;

  if (!user) return null;

  // The button should only ever be visible for the true OWNER
  const isTrueOwner = user.role === UserRole.OWNER;
  
  // The role displayed and used for logic should be the simulated one if it exists
  const effectiveRole = simulatedRole || user.role;

  const handleSwitchView = () => {
      if (!isTrueOwner) return;

      const roleCycle: UserRole[] = [
          UserRole.OWNER,
          UserRole.VIP,
          UserRole.FREE,
          UserRole.CORPORATE_ADMIN,
          UserRole.CORPORATE_USER,
      ];

      const currentRoleIndex = roleCycle.indexOf(effectiveRole);
      // Move to the next role in the cycle, wrapping around
      const nextRole = roleCycle[(currentRoleIndex + 1) % roleCycle.length];

      // If we've cycled back to the OWNER role, stop simulating by setting payload to null.
      // Otherwise, set the simulation to the next role.
      dispatch({
          type: 'SET_SIMULATED_ROLE',
          payload: nextRole === UserRole.OWNER ? null : nextRole,
      });
  };


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
          
          {isTrueOwner && (
            <button
                onClick={handleSwitchView}
                className="flex items-center px-3 py-2 text-sm font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                title={`Simulating: ${effectiveRole}. Click to cycle.`}
            >
                {ICONS.userSwitch}
                <span className="ml-2">Switch View</span>
            </button>
          )}

          <div className="w-px h-6 bg-gray-700"></div>

          <span className="text-sm font-medium text-gray-300 capitalize">{user.name} <span className="text-yellow-400">({effectiveRole})</span></span>
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