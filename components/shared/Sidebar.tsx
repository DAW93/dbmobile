import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { View, Binder } from '../../types';
import { ICONS } from '../../constants';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  collapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick, collapsed }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
      isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
    }`}
    title={collapsed ? label : undefined}
    aria-label={collapsed ? label : undefined}
  >
    <span className="shrink-0">{icon}</span>
    {!collapsed && <span className="ml-3 truncate">{label}</span>}
  </button>
);

const Sidebar: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { currentView, binders, selectedBinderId } = state;

  // Local collapse state for the MAIN MENU sidebar
  const [collapsed, setCollapsed] = useState(false);

  const go = (view: View) => dispatch({ type: 'SET_VIEW', payload: view });
  const selectBinder = (id: string) => {
    dispatch({ type: 'SELECT_BINDER', payload: id });
    dispatch({ type: 'SET_VIEW', payload: View.BINDERS });
  };

  return (
    <aside
      className={`flex flex-col bg-gray-900/50 border-r border-gray-700 h-full transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-64 sm:w-72'
      }`}
    >
      {/* Header with title + collapse button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed ? (
          <h1 className="text-xl font-bold text-white truncate">Digital Binder Pro</h1>
        ) : (
          <div className="text-white font-bold" aria-hidden>DB</div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-gray-400 hover:text-white transition-colors"
          title={collapsed ? 'Expand menu' : 'Collapse menu'}
          aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>

      {/* Primary nav */}
      <nav className="p-3 space-y-2">
        <div className={`text-xs font-semibold text-gray-500 uppercase tracking-wider ${collapsed ? 'text-center' : 'pl-1'}`}>
          {!collapsed ? 'Main' : '•'}
        </div>
        <NavItem
          icon={ICONS.dashboard}
          label="Dashboard"
          isActive={currentView === View.DASHBOARD}
          onClick={() => go(View.DASHBOARD)}
          collapsed={collapsed}
        />
        <NavItem
          icon={ICONS.binders}
          label="Binders"
          isActive={currentView === View.BINDERS}
          onClick={() => go(View.BINDERS)}
          collapsed={collapsed}
        />
        <NavItem
          icon={ICONS.shop}
          label="Shop"
          isActive={currentView === View.SHOP}
          onClick={() => go(View.SHOP)}
          collapsed={collapsed}
        />
        <NavItem
          icon={ICONS.settings}
          label="Settings"
          isActive={currentView === View.SETTINGS}
          onClick={() => go(View.SETTINGS)}
          collapsed={collapsed}
        />
      </nav>

      {/* Binders list */}
      <div className="px-3 mt-2">
        <div className={`text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ${collapsed ? 'text-center' : 'pl-1'}`}>
          {!collapsed ? 'My Binders' : '•'}
        </div>
        <div className="space-y-1">
          {binders.length === 0 && !collapsed && (
            <div className="text-gray-500 text-sm px-2 py-2 rounded-md bg-gray-800/50">
              No binders yet
            </div>
          )}
          {binders.map((b: Binder) => {
            const active = selectedBinderId === b.id && state.currentView === View.BINDERS;
            return (
              <button
                key={b.id}
                onClick={() => selectBinder(b.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                  active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`}
                title={collapsed ? b.name : undefined}
                aria-label={collapsed ? b.name : undefined}
              >
                <span className="shrink-0">{ICONS.page}</span>
                {!collapsed && <span className="ml-3 truncate">{b.name}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer placeholder */}
      <div className="mt-auto p-3 text-xs text-gray-600">
        {!collapsed && <span>&nbsp;</span>}
      </div>
    </aside>
  );
};

export default Sidebar;
