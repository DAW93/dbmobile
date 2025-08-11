
import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { View, Binder } from '../../types';
import { ICONS } from '../../constants';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-2.5 text-sm font-medium text-left rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}
  >
    <span className="mr-3">{icon}</span>
    {label}
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
  
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col p-4">
      <div className="flex items-center mb-6">
        <span className="bg-blue-600 p-2 rounded-lg mr-3">{ICONS.binders}</span>
        <h1 className="text-xl font-bold text-white">Digital Binder Pro</h1>
      </div>
      
      <nav className="flex-1 space-y-2">
        <div>
          <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Main</h2>
          <NavItem
            icon={ICONS.dashboard}
            label="Dashboard"
            isActive={state.currentView === View.DASHBOARD}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: View.DASHBOARD })}
          />
          <NavItem
            icon={ICONS.binders}
            label="Binders"
            isActive={state.currentView === View.BINDERS}
            onClick={() => {
              dispatch({ type: 'SET_VIEW', payload: View.BINDERS });
              dispatch({ type: 'SELECT_BINDER', payload: null });
            }}
          />
          <NavItem
            icon={ICONS.shop}
            label="Shop"
            isActive={state.currentView === View.SHOP}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: View.SHOP })}
          />
          <NavItem
            icon={ICONS.settings}
            label="Settings"
            isActive={state.currentView === View.SETTINGS}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: View.SETTINGS })}
          />
        </div>

        <div className="pt-4">
            <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Binders</h2>
            <div className="space-y-1">
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
      </nav>

      <div className="mt-auto">
        {/* Can add footer items here later */}
      </div>
    </aside>
  );
};

export default Sidebar;
