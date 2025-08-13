

import React from 'react';
import { User, Device, Bundle, Binder, Page, Task, FileRef, Reminder, TaskStatus, ReminderFrequency, FileCategory, UserRole, SubscriptionPlan } from './types';
import { LayoutDashboard, BookCopy, ShoppingCart, Settings, FileText, Plus, Trash2, Shield, Lock, X, Check, Copy, UploadCloud, FilePlus2, Users, FileUp, FileVideo, FileAudio, FileImage, Mic, Square, CreditCard, ChevronLeft, ChevronRight, UsersRound, UserPlus } from 'lucide-react';

export const ICONS = {
    dashboard: <LayoutDashboard size={20} />,
    binders: <BookCopy size={20} />,
    shop: <ShoppingCart size={20} />,
    settings: <Settings size={20} />,
    page: <FileText size={16} className="text-gray-400" />,
    add: <Plus size={16} />,
    newPage: <FilePlus2 size={16} />,
    delete: <Trash2 size={16} />,
    shield: <Shield size={16} className="text-blue-400" />,
    lock: <Lock size={14} />,
    close: <X size={20} />,
    check: <Check size={16} />,
    copy: <Copy size={16} />,
    upload: <UploadCloud size={16} />,
    userSwitch: <Users size={16} />,
    manageUsers: <UsersRound size={20} />,
    userPlus: <UserPlus size={16} />,
    fileUpload: <FileUp size={16} />,
    video: <FileVideo size={64} className="text-purple-400" />,
    audio: <FileAudio size={64} className="text-pink-400" />,
    image: <FileImage size={64} className="text-teal-400" />,
    document: <FileText size={64} className="text-sky-400" />,
    mic: <Mic size={16} />,
    stop: <Square size={16} />,
    creditCard: <CreditCard size={20} />,
    collapse: <ChevronLeft size={20} />,
    expand: <ChevronRight size={20} />,
};

export const MOCK_USER: User = {
  id: 'user-1',
  name: 'Alex Doe',
  email: 'alex.doe@example.com',
  password: 'password123',
  role: UserRole.OWNER,
};

export const MOCK_CORPORATE_USERS: User[] = [
    {
        id: 'user-corp-admin-acme',
        name: 'Catherine Admin',
        email: 'c.admin@acme.corp',
        password: 'password123',
        role: UserRole.CORPORATE_ADMIN,
        corporateId: 'corp-acme-inc',
    },
    {
        id: 'user-corp-user-bob',
        name: 'Bob Builder',
        email: 'bob.b@acme.corp',
        password: 'password123',
        role: UserRole.CORPORATE_USER,
        corporateId: 'corp-acme-inc',
    },
    {
        id: 'user-corp-user-sally',
        name: 'Sally Seashells',
        email: 'sally.s@acme.corp',
        password: 'password123',
        role: UserRole.CORPORATE_USER,
        corporateId: 'corp-acme-inc',
    }
];

export const MOCK_DEVICES: Device[] = [
  { id: 'dev-1', name: 'iPhone 15 Pro', platform: 'iOS', registeredAt: '2023-10-26T10:00:00Z', lastSeen: '2024-07-30T12:00:00Z' },
  { id: 'dev-2', name: 'YubiKey 5C NFC', platform: 'Hardware', registeredAt: '2023-10-26T10:05:00Z', lastSeen: '2024-07-29T09:00:00Z' },
  { id: 'dev-3', name: 'Pixel 8 Pro', platform: 'Android', registeredAt: '2024-01-15T14:00:00Z', lastSeen: '2024-05-20T18:00:00Z', revoked: true },
];

export const MOCK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: UserRole.VIP,
        name: 'VIP',
        description: 'For power users who want to publish content and use advanced features.',
        price: 19.99,
        priceYearly: 199.99,
        features: ['Publish & Sell Binders', 'Advanced AI Assistant', 'VIP Support', 'Unlimited Private Binders'],
        stripePriceId: 'price_vip_subscription_monthly_placeholder',
        stripePriceIdYearly: 'price_vip_subscription_yearly_placeholder',
    },
    {
        id: UserRole.CORPORATE_ADMIN,
        name: 'Corporate',
        description: 'For teams and organizations requiring collaboration and administration.',
        price: 49.99,
        priceYearly: 499.99,
        features: ['All VIP Features', 'User Management', 'Team Collaboration', 'Centralized Billing'],
        stripePriceId: 'price_corporate_subscription_monthly_placeholder',
        stripePriceIdYearly: 'price_corporate_subscription_yearly_placeholder',
    },
];

export const MOCK_REMINDER: Reminder = { title: '', frequency: ReminderFrequency.NONE, isActive: false };

export const MOCK_FILES: FileRef[] = [];

export const MOCK_TASKS: Task[] = [
    { id: 'task-1', text: 'Draft initial proposal', status: TaskStatus.COMPLETED },
    { id: 'task-2', text: 'Review feedback from team', status: TaskStatus.IN_PROGRESS },
    { id: 'task-3', text: 'Finalize presentation deck', status: TaskStatus.INCOMPLETE },
];

export const MOCK_PAGE_1: Page = {
    id: 'page-1',
    title: 'Project Phoenix - Kick-off',
    notes: 'This document outlines the initial scope, goals, and timeline for Project Phoenix. Key stakeholders need to review by EOD Friday.',
    files: [],
    tasks: MOCK_TASKS,
    reminder: { title: 'Project Review', frequency: ReminderFrequency.WEEKLY, isActive: false },
};

export const MOCK_PAGE_2: Page = {
    id: 'page-2',
    title: 'Q3 Marketing Strategy',
    notes: 'Awaiting input from the sales team on performance metrics from Q2.',
    files: [],
    tasks: [{ id: 'task-4', text: 'Sync with sales team', status: TaskStatus.PENDING }],
    reminder: { title: '', frequency: ReminderFrequency.NONE, isActive: false },
};

export const BINDER_BUNDLES: Bundle[] = [
    {
        bundleId: 'bundle-starter-pack',
        ownerId: MOCK_USER.id,
        name: 'Productivity Starter Pack',
        description: 'A collection of essential templates for managing projects and personal tasks.',
        price: 9.99,
        imageUrl: 'https://picsum.photos/seed/productivity/400/300',
        presetPages: [
            { 
                title: 'Daily Standup Notes', 
                notes: '## Agenda\n- What did you do yesterday?\n- What will you do today?\n- Any blockers?',
                files: [],
                tasks: [
                    { id: 'preset-task-1', text: 'Update project board', status: TaskStatus.INCOMPLETE },
                    { id: 'preset-task-2', text: 'Review PRs', status: TaskStatus.INCOMPLETE },
                ],
                reminder: { title: '', frequency: ReminderFrequency.NONE, isActive: false },
            },
            { 
                title: 'Meeting Minutes', 
                notes: '## Meeting Details\n**Date:**\n**Attendees:**\n\n## Action Items',
                files: [],
                tasks: [],
                reminder: { title: '', frequency: ReminderFrequency.NONE, isActive: false },
            },
            { 
                title: 'Goal Tracker', 
                notes: '## Q3 Goals\n1. \n2. \n3. ',
                files: [],
                tasks: [
                    { id: 'preset-task-3', text: 'Define Q3 Goal 1', status: TaskStatus.INCOMPLETE },
                    { id: 'preset-task-4', text: 'Define Q3 Goal 2', status: TaskStatus.INCOMPLETE },
                ],
                reminder: { title: 'Q3 Goal Review', frequency: ReminderFrequency.MONTHLY, dateTime: '2024-08-01T09:00', isActive: false },
            },
        ],
        stripePriceId: 'price_1PabcdeFGHIJKLMNOPQRS',
    },
    {
        bundleId: 'bundle-finance-kit',
        ownerId: MOCK_USER.id,
        name: 'Personal Finance Kit',
        description: 'Track your income, expenses, and investments with these easy-to-use templates.',
        price: 14.99,
        imageUrl: 'https://picsum.photos/seed/finance/400/300',
        presetPages: [
            { 
                title: 'Monthly Budget', 
                notes: 'Track your income vs. expenses.',
                files: [],
                tasks: [
                    { id: 'preset-task-5', text: 'Categorize last month\'s spending', status: TaskStatus.INCOMPLETE },
                ],
                reminder: { title: 'Pay credit card bill', frequency: ReminderFrequency.MONTHLY, isActive: false },
            },
            { 
                title: 'Investment Portfolio', 
                notes: 'Log your assets and their performance.',
                files: [],
                tasks: [],
                reminder: { title: 'Review portfolio performance', frequency: ReminderFrequency.QUARTERLY, isActive: false },
            },
        ],
        stripePriceId: 'price_2PabcdeFGHIJKLMNOPQRS',
    },
];

const publishedBindersFromBundles: Binder[] = BINDER_BUNDLES.map(bundle => ({
    id: `binder-${bundle.bundleId}`,
    ownerId: bundle.ownerId,
    name: bundle.name,
    description: bundle.description,
    pages: bundle.presetPages.map((p, index) => ({
        id: `page-${bundle.bundleId}-${index}`,
        ...p,
    })),
    bundleId: bundle.bundleId,
    isPublished: true,
    price: bundle.price,
    imageUrl: bundle.imageUrl,
    stripePriceId: bundle.stripePriceId,
}));

export const MOCK_BOB_BINDER: Binder = {
    id: 'binder-bob-1',
    ownerId: 'user-corp-user-bob',
    name: 'ACME Corp Onboarding',
    description: 'Tasks and docs for new hires at ACME Inc.',
    pages: [{
        id: 'page-bob-1',
        title: 'First Week Checklist',
        notes: 'Complete all items by Friday.',
        files: [],
        tasks: [
            { id: 'task-bob-1', text: 'Sign NDA', status: TaskStatus.INCOMPLETE },
            { id: 'task-bob-2', text: 'Setup development environment', status: TaskStatus.INCOMPLETE },
        ],
        reminder: { title: 'Submit paperwork', frequency: ReminderFrequency.ONE_TIME, dateTime: '2024-08-10T17:00', isActive: false }
    }],
};

export const MOCK_BINDERS: Binder[] = [
  {
    id: 'binder-1',
    ownerId: MOCK_USER.id,
    name: 'Work Projects',
    description: 'All active and upcoming work projects.',
    pages: [MOCK_PAGE_1, MOCK_PAGE_2],
  },
  {
    id: 'binder-2',
    ownerId: MOCK_USER.id,
    name: 'Personal Finance',
    description: 'Budgets, investments, and financial planning.',
    pages: [{
        id: 'page-3',
        title: '2024 Budget',
        notes: 'Monthly and yearly budget tracking.',
        files: [],
        tasks: [],
        reminder: { title: 'Review Investments', frequency: ReminderFrequency.MONTHLY, isActive: false }
    }],
  },
  ...publishedBindersFromBundles,
];
