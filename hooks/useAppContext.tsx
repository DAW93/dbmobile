

import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { AppState, AppAction, View, Binder, Bundle, ReminderFrequency, NotificationStyle, User, UserRole, SubscriptionPlan } from '../types';
import { MOCK_USER, MOCK_DEVICES, MOCK_BINDERS, BINDER_BUNDLES, MOCK_SUBSCRIPTION_PLANS, MOCK_CORPORATE_USERS, MOCK_BOB_BINDER } from '../constants';
import { v4 as uuidv4 } from 'uuid';

const initialState: AppState = {
  user: null,
  users: [],
  isAuthenticated: false,
  devices: MOCK_DEVICES,
  binders: [],
  bundles: BINDER_BUNDLES,
  subscriptionPlans: MOCK_SUBSCRIPTION_PLANS,
  purchasedBundles: [],
  currentView: View.DASHBOARD,
  selectedBinderId: null,
  selectedPageId: null,
  isNewPageModalOpen: false,
  notificationStyle: NotificationStyle.STANDARD,
  activeNotification: null,
  isSidebarCollapsed: false,
  pushSubscription: null,
  simulatedRole: null,
  originalBinders: null,
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
        ownerId: binder.ownerId,
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
    case 'LOGIN_SUCCESS': {
      const { user, binders: initialBinders } = action.payload;
      let finalBinders = [...initialBinders];
      const allUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');

      // If corporate user, load the admin's binders that have been assigned to them.
      if (user.role === UserRole.CORPORATE_USER && user.corporateId) {
        const admin = allUsers.find(u => u.corporateId === user.corporateId && u.role === UserRole.CORPORATE_ADMIN);
        if (admin) {
          const adminBindersStr = localStorage.getItem(`binders_${admin.id}`);
          const adminBinders: Binder[] = adminBindersStr ? JSON.parse(adminBindersStr) : [];
          
          // Filter admin binders to only include those assigned to the current user.
          const assignedBinders = adminBinders.filter(b => b.assignedUsers?.includes(user.id));
          
          // Prevent duplicates by checking IDs
          const userBinderIds = new Set(finalBinders.map(b => b.id));
          const sharedBinders = assignedBinders.filter(b => !userBinderIds.has(b.id));
          
          finalBinders.push(...sharedBinders);
        }
      }

      // If owner, ensure all published bundles are visible as binders.
      if (user.role === UserRole.OWNER) {
          const allKnownBundles = state.bundles;
          const ownerBinderBundleIds = new Set(finalBinders.map(b => b.bundleId).filter(Boolean));

          allKnownBundles.forEach(bundle => {
              if (!ownerBinderBundleIds.has(bundle.bundleId)) {
                  const binderFromBundle: Binder = {
                      id: `binder-${bundle.bundleId}`,
                      ownerId: bundle.ownerId,
                      name: bundle.name,
                      description: bundle.description,
                      pages: bundle.presetPages.map((p, index) => ({ id: `page-${bundle.bundleId}-${index}`, ...p })),
                      bundleId: bundle.bundleId,
                      isPublished: true,
                      price: bundle.price,
                      imageUrl: bundle.imageUrl,
                      stripePriceId: bundle.stripePriceId,
                  };
                  finalBinders.push(binderFromBundle);
              }
          });
      }

      return {
        ...state,
        isAuthenticated: true,
        user,
        users: allUsers, // Make sure users list is fresh on login
        binders: finalBinders,
        selectedBinderId: finalBinders.length > 0 ? finalBinders[0].id : null,
        selectedPageId: finalBinders.length > 0 && finalBinders[0].pages.length > 0 ? finalBinders[0].pages[0].id : null,
        simulatedRole: null,
      };
    }
    case 'LOGOUT':
      localStorage.removeItem('loggedInUser');
      return {
          ...initialState,
          // Keep static data loaded
          users: state.users,
          bundles: state.bundles,
          subscriptionPlans: state.subscriptionPlans,
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
    case 'ADD_BINDER': {
        const newBinder = action.payload;
        
        // Persist to owner's storage
        const ownerBindersStr = localStorage.getItem(`binders_${newBinder.ownerId}`);
        const ownerBinders: Binder[] = ownerBindersStr ? JSON.parse(ownerBindersStr) : [];
        const updatedOwnerBinders = [...ownerBinders, newBinder];
        localStorage.setItem(`binders_${newBinder.ownerId}`, JSON.stringify(updatedOwnerBinders));

        // Update UI state
        return { ...state, binders: [...state.binders, newBinder] };
    }
    case 'UPDATE_BINDER': {
        const updatedBinder = action.payload;

        // Persist change to owner's storage
        const ownerBindersStr = localStorage.getItem(`binders_${updatedBinder.ownerId}`);
        const ownerBinders: Binder[] = ownerBindersStr ? JSON.parse(ownerBindersStr) : [];
        const binderExistsInOwnerStorage = ownerBinders.some(b => b.id === updatedBinder.id);
        let updatedOwnerBinders;
        if(binderExistsInOwnerStorage) {
            updatedOwnerBinders = ownerBinders.map(b => b.id === updatedBinder.id ? updatedBinder : b);
        } else {
            updatedOwnerBinders = [...ownerBinders, updatedBinder];
        }
        localStorage.setItem(`binders_${updatedBinder.ownerId}`, JSON.stringify(updatedOwnerBinders));

        // Update current UI state
        const newBinders = state.binders.map(b => (b.id === updatedBinder.id ? updatedBinder : b));
        
        let newBundles = state.bundles;
        if (updatedBinder.isPublished && updatedBinder.bundleId) {
            const bundleFromBinder: Bundle = {
                bundleId: updatedBinder.bundleId,
                ownerId: updatedBinder.ownerId,
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
      if (!binderToDelete) return state;

      // Persist change to owner's storage
      const ownerBindersStr = localStorage.getItem(`binders_${binderToDelete.ownerId}`);
      if(ownerBindersStr) {
          const ownerBinders: Binder[] = JSON.parse(ownerBindersStr);
          const updatedOwnerBinders = ownerBinders.filter(b => b.id !== action.payload);
          localStorage.setItem(`binders_${binderToDelete.ownerId}`, JSON.stringify(updatedOwnerBinders));
      }
      
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
        const binderToUpdate = state.binders.find(b => b.id === action.payload.binderId);
        if (!binderToUpdate) return state;

        const updatedBinder = {
            ...binderToUpdate,
            pages: binderToUpdate.pages.map(p => p.id === action.payload.page.id ? action.payload.page : p)
        };

        // Persist change to owner's storage
        const ownerBindersStr = localStorage.getItem(`binders_${updatedBinder.ownerId}`);
        if(ownerBindersStr) {
            const ownerBinders: Binder[] = JSON.parse(ownerBindersStr);
            const updatedOwnerBinders = ownerBinders.map(b => b.id === updatedBinder.id ? updatedBinder : b);
            localStorage.setItem(`binders_${updatedBinder.ownerId}`, JSON.stringify(updatedOwnerBinders));
        }

        // Update UI state
        const newBindersForState = state.binders.map(b => b.id === updatedBinder.id ? updatedBinder : b);
        const newBundles = syncBinderToBundles(updatedBinder, state.bundles);
        return { ...state, binders: newBindersForState, bundles: newBundles };
    }
    case 'ADD_PAGE': {
        const { binderId, page } = action.payload;
        const binderToUpdate = state.binders.find(b => b.id === binderId);
        if (!binderToUpdate) return state;

        const pageWithDefaultReminder = {
            ...page,
            reminder: page.reminder || { title: '', frequency: ReminderFrequency.NONE, isActive: false }
        };

        const updatedBinder = { ...binderToUpdate, pages: [...binderToUpdate.pages, pageWithDefaultReminder] };

        // Persist change to owner's storage
        const ownerBindersStr = localStorage.getItem(`binders_${updatedBinder.ownerId}`);
        if(ownerBindersStr) {
            const ownerBinders: Binder[] = JSON.parse(ownerBindersStr);
            const updatedOwnerBinders = ownerBinders.map(b => b.id === updatedBinder.id ? updatedBinder : b);
            localStorage.setItem(`binders_${updatedBinder.ownerId}`, JSON.stringify(updatedOwnerBinders));
        }
        
        const newBundles = syncBinderToBundles(updatedBinder, state.bundles);
        
        return {
            ...state,
            binders: state.binders.map(b => b.id === updatedBinder.id ? updatedBinder : b),
            bundles: newBundles,
            selectedPageId: page.id,
        };
    }
    case 'DELETE_PAGE': {
        const { binderId, pageId } = action.payload;
        let newSelectedPageId = state.selectedPageId;
        
        const binderToUpdate = state.binders.find(b => b.id === binderId);
        if (!binderToUpdate) return state;

        const pageIndex = binderToUpdate.pages.findIndex(p => p.id === pageId);
        if (pageIndex === -1) return state;

        const newPages = binderToUpdate.pages.filter(p => p.id !== pageId);
        if (state.selectedPageId === pageId) {
            newSelectedPageId = newPages[pageIndex]?.id || newPages[pageIndex - 1]?.id || newPages[0]?.id || null;
        }
        const updatedBinder = { ...binderToUpdate, pages: newPages };

        // Persist change to owner's storage
        const ownerBindersStr = localStorage.getItem(`binders_${updatedBinder.ownerId}`);
        if(ownerBindersStr) {
            const ownerBinders: Binder[] = JSON.parse(ownerBindersStr);
            const updatedOwnerBinders = ownerBinders.map(b => b.id === updatedBinder.id ? updatedBinder : b);
            localStorage.setItem(`binders_${updatedBinder.ownerId}`, JSON.stringify(updatedOwnerBinders));
        }

        const newBundles = syncBinderToBundles(updatedBinder, state.bundles);
        return { 
            ...state, 
            binders: state.binders.map(b => b.id === updatedBinder.id ? updatedBinder : b), 
            bundles: newBundles, 
            selectedPageId: newSelectedPageId 
        };
    }
    case 'PURCHASE_BUNDLE':
      return { ...state, purchasedBundles: [...state.purchasedBundles, action.payload] };
    case 'ADD_BUNDLE':
        return { ...state, bundles: [...state.bundles, action.payload] };
    case 'SET_NEW_PAGE_MODAL_OPEN':
        return { ...state, isNewPageModalOpen: action.payload };
    case 'SET_SIMULATED_ROLE': {
        const newSimulatedRole = action.payload;
        const wasSimulating = !!state.simulatedRole;
        const isNowSimulating = !!newSimulatedRole;

        if (state.user?.role !== UserRole.OWNER) {
            return state; // This action is only for the owner
        }

        // Case 1: STARTING simulation (from Owner view to any simulated role)
        if (!wasSimulating && isNowSimulating) {
            return {
                ...state,
                simulatedRole: newSimulatedRole,
                originalBinders: state.binders, // Save the owner's binders
                binders: [], // A new simulated user has no binders
                selectedBinderId: null,
                selectedPageId: null,
            };
        } 
        
        // Case 2: ENDING simulation (from any simulated role back to Owner view)
        else if (wasSimulating && !isNowSimulating) {
            const restoredBinders = state.originalBinders || [];
            return {
                ...state,
                simulatedRole: null,
                binders: restoredBinders,
                originalBinders: null, // Clear the saved state
                selectedBinderId: restoredBinders[0]?.id || null,
                selectedPageId: restoredBinders[0]?.pages[0]?.id || null,
            };
        }

        // Case 3: SWITCHING between simulation roles (e.g., VIP -> Free)
        else if (wasSimulating && isNowSimulating) {
             return {
                ...state,
                simulatedRole: newSimulatedRole,
                binders: [], // WIPE binders for the new simulation
                selectedBinderId: null,
                selectedPageId: null,
                // originalBinders remains the same, no change needed
             };
        }

        return state; // No change (e.g., owner -> owner or other edge cases)
    }
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
    case 'TOGGLE_SIDEBAR':
        return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    case 'SET_PUSH_SUBSCRIPTION':
        return { ...state, pushSubscription: action.payload };
    case 'UPDATE_SUBSCRIPTION_PLAN': {
        const updatedPlan = action.payload;
        return {
            ...state,
            subscriptionPlans: state.subscriptionPlans.map(plan => 
                plan.id === updatedPlan.id ? updatedPlan : plan
            ),
        };
    }
    case 'SET_USERS': {
        return { ...state, users: action.payload };
    }
    case 'DELETE_USER': {
        const { user, users, simulatedRole } = state;
        const userIdToDelete = action.payload;

        const isRealAdmin = user?.role === UserRole.CORPORATE_ADMIN && !simulatedRole;
        const isSimulatingAdmin = user?.role === UserRole.OWNER && simulatedRole === UserRole.CORPORATE_ADMIN;

        if (!isRealAdmin && !isSimulatingAdmin) {
            console.warn("Unauthorized attempt to delete user: invalid role.");
            return state;
        }

        let adminContext = user;
        if (isSimulatingAdmin) {
            const mockAdmin = users.find(u => u.role === UserRole.CORPORATE_ADMIN);
            if (!mockAdmin) return state; // Should not happen if data is seeded
            adminContext = mockAdmin;
        }

        const userToDelete = users.find(u => u.id === userIdToDelete);

        if (!userToDelete || userToDelete.corporateId !== adminContext.corporateId || userToDelete.role !== UserRole.CORPORATE_USER) {
            console.warn("Unauthorized attempt to delete user: mismatch corporateId or role.");
            return state;
        }

        const updatedUsers = users.filter(u => u.id !== userIdToDelete);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        localStorage.removeItem(`binders_${userIdToDelete}`);

        return { ...state, users: updatedUsers };
    }
    case 'UPGRADE_SUBSCRIPTION': {
        if (!state.user) return state;
        const updatedUser: User = { ...state.user, role: action.payload };
        
        const updatedUsers = state.users.map(u => u.id === state.user!.id ? updatedUser : u);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
        
        return { ...state, user: updatedUser, users: updatedUsers };
    }
    case 'CREATE_CORPORATE_USER': {
        const { user, users, simulatedRole } = state;
        const newUserData = action.payload;

        const isRealAdmin = user?.role === UserRole.CORPORATE_ADMIN && !simulatedRole;
        const isSimulatingAdmin = user?.role === UserRole.OWNER && simulatedRole === UserRole.CORPORATE_ADMIN;

        if (!isRealAdmin && !isSimulatingAdmin) {
            console.warn("Unauthorized: User without admin privileges attempting to create a corporate user.");
            return state;
        }

        let corporateIdForNewUser: string | undefined;
        if (isRealAdmin) {
            corporateIdForNewUser = user.corporateId;
        } else { // isSimulatingAdmin
            const mockAdmin = users.find(u => u.role === UserRole.CORPORATE_ADMIN);
            corporateIdForNewUser = mockAdmin?.corporateId;
        }

        if (!corporateIdForNewUser) {
            console.error("Critical error: Could not determine a corporateId for the new user.");
            return state;
        }

        if (users.some(u => u.email === newUserData.email)) {
            alert("Error: A user with this email already exists.");
            return state;
        }

        const newUser: User = {
            id: uuidv4(),
            ...newUserData,
            role: UserRole.CORPORATE_USER,
            corporateId: corporateIdForNewUser,
        };
        
        const updatedUsers = [...users, newUser];
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        // A new corporate user starts with an empty set of their own binders.
        // They will see assigned binders on login via the LOGIN_SUCCESS action.
        localStorage.setItem(`binders_${newUser.id}`, JSON.stringify([]));
        
        return { ...state, users: updatedUsers };
    }
    case 'ASSIGN_BINDER': {
        const { binderId, userIds } = action.payload;
        const binderToUpdate = state.binders.find(b => b.id === binderId);

        if (!binderToUpdate || !state.user) {
            return state;
        }

        const updatedBinder: Binder = {
            ...binderToUpdate,
            assignedUsers: userIds,
        };

        // Persist change to owner's storage (the admin's storage)
        const ownerBindersStr = localStorage.getItem(`binders_${updatedBinder.ownerId}`);
        if(ownerBindersStr) {
            const ownerBinders: Binder[] = JSON.parse(ownerBindersStr);
            const updatedOwnerBinders = ownerBinders.map(b => b.id === updatedBinder.id ? updatedBinder : b);
            localStorage.setItem(`binders_${updatedBinder.ownerId}`, JSON.stringify(updatedOwnerBinders));
        }

        // Update UI state
        const newBindersForState = state.binders.map(b => b.id === updatedBinder.id ? updatedBinder : b);
        return { ...state, binders: newBindersForState };
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
      let allUsers: User[];
      const usersStr = localStorage.getItem('users');
      if (!usersStr) {
          allUsers = [MOCK_USER, ...MOCK_CORPORATE_USERS];
          localStorage.setItem('users', JSON.stringify(allUsers));
          localStorage.setItem(`binders_${MOCK_USER.id}`, JSON.stringify(MOCK_BINDERS));
          // Seed mock data for corporate users
          localStorage.setItem(`binders_${MOCK_CORPORATE_USERS[0].id}`, JSON.stringify([MOCK_BOB_BINDER])); // Admin has one binder
          localStorage.setItem(`binders_${MOCK_CORPORATE_USERS[1].id}`, JSON.stringify([])); // Bob has none initially
          localStorage.setItem(`binders_${MOCK_CORPORATE_USERS[2].id}`, JSON.stringify([])); // Sally has none
      } else {
          allUsers = JSON.parse(usersStr);
      }
      dispatch({ type: 'SET_USERS', payload: allUsers });

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

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);