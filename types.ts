export enum View {
  DASHBOARD = 'DASHBOARD',
  BINDERS = 'BINDERS',
  SHOP = 'SHOP',
  SETTINGS = 'SETTINGS',
}

export enum TaskStatus {
  INCOMPLETE = 'Incomplete',
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

export enum ReminderFrequency {
  NONE = 'None',
  ONE_TIME = 'One-Time',
  HOURLY = 'Hourly',
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  YEARLY = 'Yearly',
}

export enum NotificationStyle {
  STANDARD = 'Standard',
  ALARM = 'Alarm',
  CALL = 'Call',
}

export enum UserRole {
  OWNER = 'owner',
  FREE = 'free',
  VIP = 'vip',
  CORPORATE_ADMIN = 'corporate_admin',
  CORPORATE_USER = 'corporate_user',
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // Made optional for mock data, but required for new users
  role: UserRole;
  corporateId?: string; // For linking corporate users to their organization
}

export interface Device {
  id: string;
  name: string;
  platform: string;
  registeredAt: string;
  lastSeen: string;
  revoked?: boolean;
}

export interface Reminder {
  title: string;
  frequency: ReminderFrequency;
  oneTimeAt?: string;
  dateTime?: string;
  isActive: boolean;
  startTime?: number;
}

export interface Task {
  id: string;
  text: string;
  status: TaskStatus;
  dueDate?: string;
  startTime?: number;
}

export enum FileCategory {
  VIDEO = 'video',
  AUDIO = 'audio',
  IMAGE = 'image',
  DOCUMENT = 'document',
  OTHER = 'other',
}

export interface FileRef {
  id:string;
  name:string;
  mimeType: string;
  size: number;
  createdAt: string;
  url: string;
  category: FileCategory;
}

export interface Page {
  id: string;
  title: string;
  notes: string;
  files: FileRef[];
  tasks: Task[];
  reminder: Reminder;
}

export interface Binder {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  pages: Page[];
  bundleId?: string;
  isPublished?: boolean;
  price?: number;
  imageUrl?: string;
  stripePriceId?: string;
  assignedUsers?: string[];
}

export interface Bundle {
  bundleId: string;
  ownerId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  presetPages: Omit<Page, 'id'>[];
  stripePriceId?: string;
}

export interface SubscriptionPlan {
  id: UserRole;
  name: string;
  description: string;
  price: number; // per month
  priceYearly: number; // per year
  features: string[];
  stripePriceId?: string;
  stripePriceIdYearly?: string;
}

export interface ActiveNotification {
  type: 'alarm' | 'call';
  binderId: string;
  pageId: string;
  sourceId: string; // page.id or task.id
  sourceType: 'reminder' | 'task';
  title: string;
}

export interface AppState {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  devices: Device[];
  binders: Binder[];
  originalBinders?: Binder[] | null;
  bundles: Bundle[];
  subscriptionPlans: SubscriptionPlan[];
  purchasedBundles: string[];
  currentView: View;
  selectedBinderId: string | null;
  selectedPageId: string | null;
  isNewPageModalOpen: boolean;
  notificationStyle: NotificationStyle;
  activeNotification: ActiveNotification | null;
  isSidebarCollapsed: boolean;
  pushSubscription: PushSubscription | null;
  simulatedRole?: UserRole | null;
}

export type AppAction =
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; binders: Binder[] } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PASSWORD'; payload: string }
  | { type: 'SET_VIEW'; payload: View }
  | { type: 'SELECT_BINDER'; payload: string | null }
  | { type: 'SELECT_PAGE'; payload: { binderId: string; pageId: string | null } }
  | { type: 'ADD_BINDER'; payload: Binder }
  | { type: 'UPDATE_BINDER'; payload: Binder }
  | { type: 'DELETE_BINDER'; payload: string }
  | { type: 'UPDATE_PAGE'; payload: { binderId: string; page: Page } }
  | { type: 'ADD_PAGE'; payload: { binderId: string, page: Page } }
  | { type: 'DELETE_PAGE'; payload: { binderId: string, pageId: string } }
  | { type: 'PURCHASE_BUNDLE'; payload: string }
  | { type: 'ADD_BUNDLE'; payload: Bundle }
  | { type: 'SET_NEW_PAGE_MODAL_OPEN', payload: boolean }
  | { type: 'SET_SIMULATED_ROLE'; payload: UserRole | null }
  | { type: 'SET_NOTIFICATION_STYLE'; payload: NotificationStyle }
  | { type: 'TRIGGER_NOTIFICATION'; payload: ActiveNotification }
  | { type: 'DISMISS_NOTIFICATION' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_PUSH_SUBSCRIPTION'; payload: PushSubscription | null }
  | { type: 'UPDATE_SUBSCRIPTION_PLAN'; payload: SubscriptionPlan }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'UPGRADE_SUBSCRIPTION'; payload: UserRole }
  | { type: 'ASSIGN_BINDER'; payload: { binderId: string; userIds: string[] } }
  | { type: 'CREATE_CORPORATE_USER'; payload: Omit<User, 'id' | 'role' | 'corporateId'> };