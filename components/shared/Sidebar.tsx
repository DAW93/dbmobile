

import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { View, Binder, UserRole } from '../../types';
import { ICONS } from '../../constants';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick, isCollapsed }) => (
  <button
    onClick={onClick}
    title={label}
    className={`flex items-center w-full text-sm font-medium text-left rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    } ${isCollapsed ? 'justify-center p-3' : 'px-4 py-2.5'}`}
  >
    <span className={isCollapsed ? '' : 'mr-3'}>{icon}</span>
    {!isCollapsed && label}
  </button>
);

const BinderItem: React.FC<{ binder: Binder; isActive: boolean; onClick: () => void; }> = ({ binder, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full text-left text-sm px-4 py-2 rounded-md truncate transition-colors duration-200 ${
          isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {binder.name}
    </button>
);


const Sidebar: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { user, simulatedRole } = state;

  if (!user) return null;

  const effectiveRole = simulatedRole || user.role;
  const isCorporate = effectiveRole === UserRole.CORPORATE_ADMIN || effectiveRole === UserRole.CORPORATE_USER;
  
  return (
    <aside className={`bg-gray-900 border-r border-gray-700 flex flex-col p-4 transition-all duration-300 ease-in-out ${state.isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center mb-6 h-10 ${state.isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!state.isSidebarCollapsed && (
            <div className="flex items-center min-w-0">
                <span className="bg-blue-600 p-2 rounded-lg flex-shrink-0">{ICONS.binders}</span>
                <h1 className="text-xl font-bold text-white ml-3 truncate">Digital Binder Pro</h1>
            </div>
        )}
        <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white"
            title={state.isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
            {state.isSidebarCollapsed ? ICONS.expand : ICONS.collapse}
        </button>
      </div>
      
      <nav className="flex-1 space-y-2">
        <div>
          {!state.isSidebarCollapsed && <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Main</h2>}
          <NavItem
            icon={ICONS.dashboard}
            label="Dashboard"
            isActive={state.currentView === View.DASHBOARD}
            isCollapsed={state.isSidebarCollapsed}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: View.DASHBOARD })}
          />
          <NavItem
            icon={ICONS.binders}
            label="Binders"
            isActive={state.currentView === View.BINDERS && state.selectedBinderId === null}
            isCollapsed={state.isSidebarCollapsed}
            onClick={() => {
              dispatch({ type: 'SET_VIEW', payload: View.BINDERS });
              dispatch({ type: 'SELECT_BINDER', payload: null });
            }}
          />
          {!isCorporate && (
            <NavItem
                icon={ICONS.shop}
                label="Shop"
                isActive={state.currentView === View.SHOP}
                isCollapsed={state.isSidebarCollapsed}
                onClick={() => dispatch({ type: 'SET_VIEW', payload: View.SHOP })}
            />
          )}
          <NavItem
            icon={ICONS.settings}
            label="Settings"
            isActive={state.currentView === View.SETTINGS}
            isCollapsed={state.isSidebarCollapsed}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: View.SETTINGS })}
          />
        </div>

        {!state.isSidebarCollapsed && (
            <div className="pt-4">
                <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Binders</h2>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {state.binders.map(binder => (
                    <BinderItem
                      key={binder.id}
                      binder={binder}
                      isActive={state.selectedBinderId === binder.id && state.currentView === View.BINDERS}
                      onClick={() => {
                        dispatch({ type: 'SELECT_BINDER', payload: binder.id });
                        dispatch({ type: 'SET_VIEW', payload: View.BINDERS });
                      }}
                    />
                  ))}
                </div>
            </div>
        )}
      </nav>

    </aside>
  );
};

export default Sidebar;