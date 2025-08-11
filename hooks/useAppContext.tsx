
import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { AppState, AppAction, View, Binder, Bundle, ReminderFrequency, NotificationStyle, User } from '../types';
import { MOCK_USER, MOCK_DEVICES, MOCK_BINDERS, BINDER_BUNDLES } from '../constants';
import { v4 as uuidv4 } from 'uuid';

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  devices: MOCK_DEVICES,
  binders: [],
  bundles: BINDER_BUNDLES,
  purchasedBundles: [],
  currentView: View.DASHBOARD,
  selectedBinderId: null,
  selectedPageId: null,
  isNewPageModalOpen: false,
  notificationStyle: NotificationStyle.STANDARD,
  activeNotification: null,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

/**
 * Helper to sync a binder's state to its corresponding bundle in the shop.
 * This is used when a published binder's pages are modified.
 */
const syncBinderToBundles = (binder: Binder, bundles: Bundle[]): Bundle[] => {
    if (!binder.isPublished || !binder.bundleId) {
        return bundles;
    }
    
    const bundleIndex = bundles.findIndex(b => b.bundleId === binder.bundleId);
    if (bundleIndex === -1) {
        return bundles;
    }

    const newBundles = [...bundles];
    newBundles[bundleIndex] = {
        ...newBundles[bundleIndex],
        name: binder.name,
        description: binder.description,
        price: binder.price ?? 0,
        imageUrl: binder.imageUrl ?? '',
        presetPages: binder.pages.map(({ id, ...restOfPage }) => restOfPage),
        stripePriceId: binder.stripePriceId,
    };
    return newBundles;
};


const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      const { user, binders } = action.payload;
      return {
        ...state,
        isAuthenticated: true,
        user,
        binders,
        selectedBinderId: binders.length > 0 ? binders[0].id : null,
        selectedPageId: binders.length > 0 && binders[0].pages.length > 0 ? binders[0].pages[0].id : null,
      };
    case 'LOGOUT':
      localStorage.removeItem('loggedInUser');
      return {
          ...initialState,
          // Keep bundles loaded even when logged out
          bundles: state.bundles,
      };
    case 'UPDATE_PASSWORD':
      if (!state.user) return state;
      const updatedUser = { ...state.user, password: action.payload };
      // Also update in simulated DB
      try {
        const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === state.user?.id);
        if (userIndex !== -1) {
            users[userIndex] = updatedUser;
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
        }
      } catch (e) { console.error(e); }
      return { ...state, user: updatedUser };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'SELECT_BINDER':
      const newSelectedBinder = state.binders.find(b => b.id === action.payload);
      return { 
        ...state, 
        selectedBinderId: action.payload,
        selectedPageId: newSelectedBinder?.pages[0]?.id || null
      };
    case 'SELECT_PAGE':
      return {
        ...state,
        selectedBinderId: action.payload.binderId,
        selectedPageId: action.payload.pageId
      };
    case 'ADD_BINDER':
      return { ...state, binders: [...state.binders, action.payload] };
    case 'UPDATE_BINDER': {
        const updatedBinder = action.payload;
        const newBinders = state.binders.map(b => b.id === updatedBinder.id ? updatedBinder : b);
    
        let newBundles = state.bundles;
        if (updatedBinder.isPublished && updatedBinder.bundleId) {
            const bundleFromBinder: Bundle = {
                bundleId: updatedBinder.bundleId,
                name: updatedBinder.name,
                description: updatedBinder.description,
                price: updatedBinder.price || 0,
                imageUrl: updatedBinder.imageUrl || '',
                presetPages: updatedBinder.pages.map(({ id, ...restOfPage }) => restOfPage),
                stripePriceId: updatedBinder.stripePriceId,
            };
    
            const bundleIndex = state.bundles.findIndex(b => b.bundleId === updatedBinder.bundleId);
    
            if (bundleIndex > -1) {
                newBundles = [...state.bundles];
                newBundles[bundleIndex] = bundleFromBinder;
            } else {
                newBundles = [...state.bundles, bundleFromBinder];
            }
        }
        return { ...state, binders: newBinders, bundles: newBundles };
    }
    case 'DELETE_BINDER': {
      const binderToDelete = state.binders.find(b => b.id === action.payload);
      const remainingBinders = state.binders.filter(b => b.id !== action.payload);
      
      let newBundles = state.bundles;
      if (binderToDelete && binderToDelete.isPublished && binderToDelete.bundleId) {
          newBundles = state.bundles.filter(bundle => bundle.bundleId !== binderToDelete.bundleId);
      }
      
      const isSelectedBinderDeleted = state.selectedBinderId === action.payload;
      
      return { 
          ...state, 
          binders: remainingBinders,
          bundles: newBundles,
          selectedBinderId: isSelectedBinderDeleted ? (remainingBinders[0]?.id || null) : state.selectedBinderId,
          selectedPageId: isSelectedBinderDeleted ? (remainingBinders[0]?.pages[0]?.id || null) : state.selectedPageId,
      };
    }
    case 'UPDATE_PAGE': {
        let updatedBinder: Binder | undefined;
        const newBinders = state.binders.map(binder => {
            if (binder.id === action.payload.binderId) {
                updatedBinder = {
                    ...binder,
                    pages: binder.pages.map(p => p.id === action.payload.page.id ? action.payload.page : p)
                };
                return updatedBinder;
            }
            return binder;
        });

        if (!updatedBinder) return state;
        const newBundles = syncBinderToBundles(updatedBinder, state.bundles);
        return { ...state, binders: newBinders, bundles: newBundles };
    }
    case 'ADD_PAGE': {
        const { binderId, page } = action.payload;
        let updatedBinder: Binder | undefined;
        const pageWithDefaultReminder = {
            ...page,
            reminder: page.reminder || { title: '', frequency: ReminderFrequency.NONE, isActive: false }
        };
        const newBinders = state.binders.map(binder => {
            if (binder.id === binderId) {
                updatedBinder = { ...binder, pages: [...binder.pages, pageWithDefaultReminder] };
                return updatedBinder;
            }
            return binder;
        });
    
        if (!updatedBinder) return state;
        
        const newBundles = syncBinderToBundles(updatedBinder, state.bundles);
        
        return {
            ...state,
            binders: newBinders,
            bundles: newBundles,
            selectedPageId: page.id,
        };
    }
    case 'DELETE_PAGE': {
        const { binderId, pageId } = action.payload;
        let newSelectedPageId = state.selectedPageId;
        let updatedBinder: Binder | undefined;
        const newBinders = state.binders.map(binder => {
            if (binder.id === binderId) {
                const pageIndex = binder.pages.findIndex(p => p.id === pageId);
                if (pageIndex === -1) return binder;

                const newPages = binder.pages.filter(p => p.id !== pageId);
                if (state.selectedPageId === pageId) {
                    newSelectedPageId = newPages[pageIndex]?.id || newPages[pageIndex - 1]?.id || newPages[0]?.id || null;
                }
                updatedBinder = { ...binder, pages: newPages };
                return updatedBinder;
            }
            return binder;
        });

        if (!updatedBinder) return { ...state, binders: newBinders, selectedPageId: newSelectedPageId };
    
        const newBundles = syncBinderToBundles(updatedBinder, state.bundles);
        return { ...state, binders: newBinders, bundles: newBundles, selectedPageId: newSelectedPageId };
    }
    case 'PURCHASE_BUNDLE':
      return { ...state, purchasedBundles: [...state.purchasedBundles, action.payload] };
    case 'ADD_BUNDLE':
        return { ...state, bundles: [...state.bundles, action.payload] };
    case 'SET_NEW_PAGE_MODAL_OPEN':
        return { ...state, isNewPageModalOpen: action.payload };
    case 'SET_USER_ROLE':
        if (!state.user) return state;
        return {
            ...state,
            user: { ...state.user, role: action.payload }
        };
    case 'SET_NOTIFICATION_STYLE':
        return { ...state, notificationStyle: action.payload };
    case 'TRIGGER_NOTIFICATION':
        if (state.activeNotification) return state;
        return { ...state, activeNotification: action.payload };
    case 'DISMISS_NOTIFICATION': {
        if (!state.activeNotification) return state;
        const { binderId, pageId, sourceId, sourceType } = state.activeNotification;
        
        const newBinders = state.binders.map(binder => {
            if (binder.id === binderId) {
                const newPages = binder.pages.map(page => {
                    if (page.id === pageId) {
                        let updatedPage = { ...page };
                        if (sourceType === 'reminder' && page.id === sourceId) {
                            updatedPage.reminder = { ...page.reminder, isActive: false };
                        } else if (sourceType === 'task') {
                            updatedPage.tasks = page.tasks.map(task => {
                                if (task.id === sourceId) {
                                    return { ...task, startTime: undefined };
                                }
                                return task;
                            });
                        }
                        return updatedPage;
                    }
                    return page;
                });
                return { ...binder, pages: newPages };
            }
            return binder;
        });

        return { ...state, binders: newBinders, activeNotification: null };
    }
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Effect to initialize state from localStorage
  useEffect(() => {
      // Seed users DB if it doesn't exist
      const usersExist = localStorage.getItem('users');
      if (!usersExist) {
          localStorage.setItem('users', JSON.stringify([MOCK_USER]));
          localStorage.setItem(`binders_${MOCK_USER.id}`, JSON.stringify(MOCK_BINDERS));
      }

      // Check for a logged-in user session
      const loggedInUserStr = localStorage.getItem('loggedInUser');
      if (loggedInUserStr) {
          try {
              const user: User = JSON.parse(loggedInUserStr);
              const bindersStr = localStorage.getItem(`binders_${user.id}`);
              const binders: Binder[] = bindersStr ? JSON.parse(bindersStr) : [];
              dispatch({ type: 'LOGIN_SUCCESS', payload: { user, binders } });
          } catch (e) {
              console.error("Failed to parse user session", e);
              localStorage.removeItem('loggedInUser');
          }
      }
  }, []);

  // Effect to save state changes to localStorage
  useEffect(() => {
      if (state.isAuthenticated && state.user) {
          localStorage.setItem(`binders_${state.user.id}`, JSON.stringify(state.binders));
      }
  }, [state.binders, state.isAuthenticated, state.user]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);