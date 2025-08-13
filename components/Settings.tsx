
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ICONS } from '../constants';
import Modal from './shared/Modal';
import { NotificationStyle, UserRole, SubscriptionPlan, User } from '../types';
import { Bell, KeyRound, DollarSign, Trash2, CreditCard, Star, Building, Lock, Check } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { v4 as uuidv4 } from 'uuid';

const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_51PabcdeFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const SettingsCard: React.FC<{ title: string; description: string; children: React.ReactNode, icon?: React.ReactNode, actions?: React.ReactNode }> = ({ title, description, children, icon, actions }) => (
    <div className="bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-700 flex justify-between items-start">
            <div className="flex items-start">
                 {icon && <span className="mr-4 text-gray-400 mt-1">{icon}</span>}
                <div>
                    <h3 className="text-lg font-semibold text-white">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">{description}</p>
                </div>
            </div>
            {actions && <div className="flex-shrink-0 ml-4">{actions}</div>}
        </div>
        <div className="p-6 space-y-4">
            {children}
        </div>
    </div>
);

const SubscriptionUpgradeForm: React.FC<{
  plan: SubscriptionPlan;
  billingCycle: 'monthly' | 'yearly';
  onSuccess: () => void;
  onBack: () => void;
}> = ({ plan, billingCycle, onSuccess, onBack }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const price = billingCycle === 'monthly' ? plan.price : plan.priceYearly;
    const periodText = billingCycle === 'monthly' ? 'Billed monthly.' : 'Billed yearly.';

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsLoading(true);
        setError(null);
        
        console.log("Simulating subscription creation API call for demo.");
        setTimeout(() => {
            onSuccess();
            setIsLoading(false);
        }, 1500);
    };

    const cardElementOptions = {
        style: {
            base: { color: "#ffffff", fontFamily: 'inherit', fontSize: '16px', '::placeholder': { color: '#999999' }},
            invalid: { color: '#ef4444', iconColor: '#ef4444' }
        }
    };

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="text-sm text-blue-400 hover:text-blue-300 mb-4">&larr; Back to plans</button>
            <h3 className="text-xl font-bold text-center text-white mb-4">Upgrade to {plan.name}</h3>
             <div className="flex justify-between items-start p-4 bg-gray-900/50 rounded-lg mb-6">
                <div>
                    <p className="font-bold text-white">{plan.name} Plan</p>
                    <p className="text-sm text-gray-400">{periodText}</p>
                </div>
                <p className="text-2xl font-bold text-white">${price.toFixed(2)}</p>
            </div>
            <form onSubmit={handlePay} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">Card Information</label>
                    <div className="p-3 bg-gray-700 border border-gray-600 rounded-md">
                       <CardElement options={cardElementOptions} />
                    </div>
                </div>
                {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                <button type="submit" disabled={isLoading || !stripe || !elements} className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-md transition-colors">
                    {isLoading ? "Processing..." : `Upgrade & Pay $${price.toFixed(2)}`}
                </button>
            </form>
             <div className="text-center text-xs text-gray-500 flex items-center justify-center mt-4">
                <Lock size={12} className="mr-1.5"/>
                Secure payment powered by Stripe.
            </div>
        </div>
    );
};


const Settings: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { user, users, devices, notificationStyle, subscriptionPlans, simulatedRole } = state;
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Owner subscription management state
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [subToEdit, setSubToEdit] = useState<SubscriptionPlan | null>(null);
    const [subName, setSubName] = useState('');
    const [subDesc, setSubDesc] = useState('');
    const [subPrice, setSubPrice] = useState(0);
    const [subPriceYearly, setSubPriceYearly] = useState(0);
    const [isSubSaving, setIsSubSaving] = useState(false);

    // User subscription upgrade state
    const [upgradeStep, setUpgradeStep] = useState<'plans' | 'checkout'>('plans');
    const [planToUpgradeTo, setPlanToUpgradeTo] = useState<SubscriptionPlan | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    // Corporate admin user management state
    const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    
    const effectiveRole = simulatedRole || user?.role;
    const isOwnerView = effectiveRole === UserRole.OWNER;
    const isCorporateAdminView = effectiveRole === UserRole.CORPORATE_ADMIN;
    const isFreeOrVipView = effectiveRole === UserRole.FREE || effectiveRole === UserRole.VIP;
    
    let adminContextUser = user;
    if (user?.role === UserRole.OWNER && simulatedRole === UserRole.CORPORATE_ADMIN) {
        const mockAdmin = users.find(u => u.role === UserRole.CORPORATE_ADMIN);
        if (mockAdmin) {
            adminContextUser = mockAdmin;
        }
    }

    const handleRequestNotificationPermission = async () => {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
    };
    
    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        if (newPassword !== confirmPassword) { setPasswordError("New passwords don't match."); return; }
        if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters long.'); return; }
        if (currentPassword === user?.password) {
            dispatch({ type: 'UPDATE_PASSWORD', payload: newPassword });
            setPasswordSuccess('Password updated successfully!');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } else {
            setPasswordError('Current password is incorrect.');
        }
    };

    const handleEditSubClick = (plan: SubscriptionPlan) => {
        setSubToEdit(plan); setSubName(plan.name); setSubDesc(plan.description); setSubPrice(plan.price); setSubPriceYearly(plan.priceYearly);
        setIsSubModalOpen(true);
    };

    const handleSaveSubscription = async () => {
        if (!subToEdit) return;
        setIsSubSaving(true);
    
        const payload = {
            planId: subToEdit.id,
            name: subName,
            description: subDesc,
            monthlyPrice: subPrice,
            yearlyPrice: subPriceYearly,
            existingMonthlyPriceId: subToEdit.stripePriceId,
            existingYearlyPriceId: subToEdit.stripePriceIdYearly,
        };
    
        try {
            // This is where you would call your backend endpoint
            const response = await fetch('/api/update-subscription-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
    
            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error || 'Failed to sync with Stripe.');
            }
    
            const updatedPlanFromServer = await response.json();
    
            dispatch({
                type: 'UPDATE_SUBSCRIPTION_PLAN',
                payload: updatedPlanFromServer
            });
            
            alert(`Subscription plan "${subName}" has been updated and synced with Stripe.`);
            setIsSubModalOpen(false);
            setSubToEdit(null);
    
        } catch (error: any) {
            console.warn("API call to '/api/update-subscription-plan' failed. Simulating successful sync for demo purposes.", error.message);
            
            // In a demo/offline environment, we proceed with a local-only update
            // and simulate what the server would have returned.
            const updatedPlanForDemo: SubscriptionPlan = {
                ...subToEdit,
                name: subName,
                description: subDesc,
                price: subPrice,
                priceYearly: subPriceYearly,
                stripePriceId: subToEdit.stripePriceId || `price_monthly_${subToEdit.id}_${uuidv4().slice(0, 8)}`,
                stripePriceIdYearly: subToEdit.stripePriceIdYearly || `price_yearly_${subToEdit.id}_${uuidv4().slice(0, 8)}`,
            };
    
            dispatch({
                type: 'UPDATE_SUBSCRIPTION_PLAN',
                payload: updatedPlanForDemo,
            });
    
            alert(`Subscription plan "${subName}" has been updated (Simulated).`);
            setIsSubModalOpen(false);
            setSubToEdit(null);
        } finally {
            setIsSubSaving(false);
        }
    };
    
    const handleDeleteUser = (userId: string, userName: string) => {
        if (window.confirm(`Are you sure you want to permanently delete "${userName}" and all their data? This action cannot be undone.`)) {
            dispatch({ type: 'DELETE_USER', payload: userId });
        }
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserName || !newUserEmail || !newUserPassword) {
            alert("All fields are required.");
            return;
        }
        dispatch({ type: 'CREATE_CORPORATE_USER', payload: { name: newUserName, email: newUserEmail, password: newUserPassword } as Omit<User, 'id' | 'role' | 'corporateId'> });
        setNewUserName(''); setNewUserEmail(''); setNewUserPassword('');
        setIsCreateUserModalOpen(false);
    };

    const handleUpgradeClick = (plan: SubscriptionPlan) => {
        setPlanToUpgradeTo(plan);
        setUpgradeStep('checkout');
    };

    const handleUpgradeSuccess = () => {
        if (!planToUpgradeTo) return;
        dispatch({ type: 'UPGRADE_SUBSCRIPTION', payload: planToUpgradeTo.id });
        setUpgradeStep('plans');
        setPlanToUpgradeTo(null);
        alert(`Successfully upgraded to the ${planToUpgradeTo.name} plan!`);
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

            <div className="space-y-8">
                {/* Profile */}
                <SettingsCard title="Profile" description="Manage your personal information.">
                    <div className="flex items-center justify-between">
                        <div><p className="text-gray-400">Name</p><p className="text-white">{user.name}</p></div>
                    </div>
                    <div><p className="text-gray-400">Email</p><p className="text-white">{user.email}</p></div>
                </SettingsCard>

                {/* My Subscription (for Free/VIP) */}
                {isFreeOrVipView && (
                    <SettingsCard title="My Subscription" description={`You are currently on the ${user.role.toUpperCase()} plan.`} icon={<CreditCard size={20}/>}>
                        {upgradeStep === 'plans' ? (
                            <>
                                <div className="flex justify-center items-center my-4">
                                    <div className="bg-gray-700 p-1 rounded-lg flex space-x-1">
                                        <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${billingCycle === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>Monthly</button>
                                        <button onClick={() => setBillingCycle('yearly')} className={`relative px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${billingCycle === 'yearly' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>Yearly
                                            <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">Save 2 months</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {subscriptionPlans
                                        .filter(p => user.role === UserRole.FREE ? (p.id === UserRole.VIP || p.id === UserRole.CORPORATE_ADMIN) : p.id === UserRole.CORPORATE_ADMIN)
                                        .map(plan => (
                                        <div key={plan.id} className="bg-gray-900/50 rounded-lg p-6 flex flex-col border border-gray-600">
                                            <div className="flex items-center text-xl font-bold mb-2">{plan.id === UserRole.VIP ? <Star className="text-yellow-400"/> : <Building className="text-purple-400"/>}<span className="ml-2">{plan.name}</span></div>
                                            <p className="text-gray-400 text-sm mb-4 flex-grow">{plan.description}</p>
                                            <p className="text-3xl font-bold mb-4">${billingCycle === 'monthly' ? plan.price.toFixed(2) : plan.priceYearly.toFixed(2)}<span className="text-base font-normal text-gray-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span></p>
                                            <ul className="space-y-2 text-sm mb-6">
                                                {plan.features.map(f => <li key={f} className="flex items-center"><Check size={16} className="text-green-500 mr-2"/> {f}</li>)}
                                            </ul>
                                            <button onClick={() => handleUpgradeClick(plan)} className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">Upgrade</button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <Elements stripe={stripePromise}>
                                <SubscriptionUpgradeForm plan={planToUpgradeTo!} billingCycle={billingCycle} onSuccess={handleUpgradeSuccess} onBack={() => setUpgradeStep('plans')} />
                            </Elements>
                        )}
                    </SettingsCard>
                )}

                {/* Subscription Management (Owner only) */}
                {isOwnerView && (
                    <SettingsCard title="Subscription Management" description="Manage pricing and details for user subscription tiers." icon={<DollarSign size={20}/>}>
                        {subscriptionPlans.map(plan => (
                            <div key={plan.id} className="flex items-center justify-between pb-2 border-b border-gray-700 last:border-b-0">
                                <div><p className="text-white font-medium">{plan.name} Plan</p><p className="text-sm text-gray-400">${plan.price.toFixed(2)}/mo &bull; ${plan.priceYearly.toFixed(2)}/yr</p></div>
                                <button onClick={() => handleEditSubClick(plan)} className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 rounded-lg">Edit Plan</button>
                            </div>
                        ))}
                    </SettingsCard>
                )}
                
                {/* Corporate User Management (Corp Admin only) */}
                {isCorporateAdminView && (
                    <SettingsCard title="User Management" description="Manage user accounts within your organization." icon={ICONS.manageUsers} actions={
                        <button onClick={() => setIsCreateUserModalOpen(true)} className="flex items-center px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                            {ICONS.userPlus}<span className="ml-2">Create User</span>
                        </button>
                    }>
                        {users.filter(u => u.corporateId === adminContextUser?.corporateId && u.role === UserRole.CORPORATE_USER).length === 0
                            ? <p className="text-center text-gray-500 py-4">No corporate users found.</p>
                            : users.filter(u => u.corporateId === adminContextUser?.corporateId && u.role === UserRole.CORPORATE_USER).map(corpUser => (
                                <div key={corpUser.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                                    <div><p className="text-white font-medium">{corpUser.name}</p><p className="text-sm text-gray-400">{corpUser.email}</p></div>
                                    <button onClick={() => handleDeleteUser(corpUser.id, corpUser.name)} className="flex items-center px-3 py-1.5 text-sm font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors" title={`Delete ${corpUser.name}`}>
                                        <Trash2 size={14} className="mr-2" />Delete
                                    </button>
                                </div>
                            ))
                        }
                    </SettingsCard>
                )}
                
                {/* Notifications */}
                <SettingsCard title="Notifications" description="Choose how you want to be notified when a timer ends." icon={<Bell size={20}/>}>
                    <div className="flex space-x-4">
                        {Object.values(NotificationStyle).map(style => (
                            <button key={style} onClick={() => dispatch({ type: 'SET_NOTIFICATION_STYLE', payload: style })} className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${notificationStyle === style ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                                {style}
                            </button>
                        ))}
                    </div>
                </SettingsCard>

                {/* Security */}
                <SettingsCard title="Security" description="Manage passwords, passkeys, and active sessions." icon={<KeyRound size={20}/>}>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <h4 className="text-base font-semibold text-white">Change Password</h4>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current Password" className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white" required />
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white" required />
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white" required />
                        <div className="flex justify-end items-center">
                            {passwordError && <p className="text-sm text-red-500 mr-4">{passwordError}</p>}
                            {passwordSuccess && <p className="text-sm text-green-500 mr-4">{passwordSuccess}</p>}
                            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg">Update Password</button>
                        </div>
                    </form>
                </SettingsCard>
            </div>
            
            <Modal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} title={`Edit ${subToEdit?.name} Plan`}>
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-300">Plan Name</label><input type="text" value={subName} onChange={e => setSubName(e.target.value)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white" /></div>
                    <div><label className="block text-sm font-medium text-gray-300">Description</label><textarea value={subDesc} onChange={e => setSubDesc(e.target.value)} rows={3} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white" /></div>
                    <div><label className="block text-sm font-medium text-gray-300">Price ($ / month)</label><input type="number" step="0.01" value={subPrice} onChange={e => setSubPrice(parseFloat(e.target.value) || 0)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white" /></div>
                    <div><label className="block text-sm font-medium text-gray-300">Price ($ / year)</label><input type="number" step="0.01" value={subPriceYearly} onChange={e => setSubPriceYearly(parseFloat(e.target.value) || 0)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white" /></div>
                    <button onClick={handleSaveSubscription} disabled={isSubSaving} className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        {isSubSaving ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving & Syncing...
                            </>
                        ) : (
                            <>
                                <DollarSign size={16} className="mr-2" />
                                Save & Sync to Stripe
                            </>
                        )}
                    </button>
                </div>
            </Modal>

            <Modal isOpen={isCreateUserModalOpen} onClose={() => setIsCreateUserModalOpen(false)} title="Create New Corporate User">
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-300">Full Name</label><input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white" required /></div>
                    <div><label className="block text-sm font-medium text-gray-300">Email Address</label><input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white" required /></div>
                    <div><label className="block text-sm font-medium text-gray-300">Temporary Password</label><input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white" required /></div>
                    <button type="submit" className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">{ICONS.userPlus}<span className="ml-2">Create Account</span></button>
                </form>
            </Modal>
        </div>
    );
};

export default Settings;
