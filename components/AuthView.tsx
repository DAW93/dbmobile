import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { User, Binder, UserRole, SubscriptionPlan } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { ICONS } from '../constants';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Check, Star, Building, Lock } from 'lucide-react';

const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_51PabcdeFGHIJKLMNOPQRS";
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const SubscriptionCheckoutForm: React.FC<{
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
        
        try {
            console.log("Simulating subscription creation API call for demo.");
            // In a real app, you would make an API call to your backend here
            // to create a Stripe Subscription and get a clientSecret.
            // For now, we simulate a successful payment.
            setTimeout(() => {
                onSuccess();
                setIsLoading(false);
            }, 1500);
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                color: "#ffffff",
                fontFamily: 'inherit',
                fontSize: '16px',
                '::placeholder': { color: '#999999' }
            },
            invalid: { color: '#ef4444', iconColor: '#ef4444' }
        }
    };

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="text-sm text-blue-400 hover:text-blue-300 mb-4">&larr; Back to plans</button>
            <h3 className="text-xl font-bold text-center text-white mb-4">Subscribe to {plan.name}</h3>
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
                    {isLoading ? "Processing..." : `Subscribe & Pay $${price.toFixed(2)}`}
                </button>
            </form>
             <div className="text-center text-xs text-gray-500 flex items-center justify-center mt-4">
                <Lock size={12} className="mr-1.5"/>
                Secure payment powered by Stripe.
            </div>
        </div>
    );
};


const AuthView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { subscriptionPlans } = state;

    const [view, setView] = useState<'login' | 'signup'>('login');
    const [step, setStep] = useState<'details' | 'plans' | 'checkout'>('details');
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setError('');
        setStep('details');
        setSelectedPlan(null);
        setBillingCycle('monthly');
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email);
            if (user && user.password === password) {
                const bindersStr = localStorage.getItem(`binders_${user.id}`);
                const binders: Binder[] = bindersStr ? JSON.parse(bindersStr) : [];
                localStorage.setItem('loggedInUser', JSON.stringify(user));
                dispatch({ type: 'LOGIN_SUCCESS', payload: { user, binders } });
            } else {
                setError('Invalid email or password.');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
            console.error(err);
        }
    };
    
    const handleDetailsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.some(u => u.email === email)) {
            setError('An account with this email already exists.');
            return;
        }
        setStep('plans');
    };

    const handleSelectPlan = (plan: SubscriptionPlan) => {
        setSelectedPlan(plan);
        setStep('checkout');
    };

    const handleFinalizeSignup = (role: UserRole) => {
        const newUser: User = {
            id: uuidv4(),
            name,
            email,
            password,
            role,
        };
        const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
        const newUsers = [...users, newUser];
        localStorage.setItem('users', JSON.stringify(newUsers));
        localStorage.setItem(`binders_${newUser.id}`, JSON.stringify([]));
        localStorage.setItem('loggedInUser', JSON.stringify(newUser));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: newUser, binders: [] } });
    };

    const renderPlanCard = (title: string, description: string, price: string, period: string, features: string[], icon: React.ReactNode, action: () => void, buttonText: string) => (
        <div className="bg-gray-700/50 rounded-lg p-6 flex flex-col border border-gray-600 hover:border-blue-500 transition-colors">
            <div className="flex items-center text-xl font-bold mb-2">{icon}<span className="ml-2">{title}</span></div>
            <p className="text-gray-400 text-sm mb-4 flex-grow">{description}</p>
            <p className="text-3xl font-bold mb-4">{price}<span className="text-base font-normal text-gray-400">{period}</span></p>
            <ul className="space-y-2 text-sm mb-6">
                {features.map(f => <li key={f} className="flex items-center"><Check size={16} className="text-green-500 mr-2"/> {f}</li>)}
            </ul>
            <button onClick={action} className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">{buttonText}</button>
        </div>
    );
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className={`w-full ${view === 'signup' && step === 'plans' ? 'max-w-4xl' : 'max-w-md'} p-8 space-y-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 transition-all duration-300`}>
                <div className="text-center mb-4">
                    <div className="flex justify-center items-center mb-4">
                        <span className="bg-blue-600 p-3 rounded-xl mr-4">{ICONS.binders}</span>
                        <h1 className="text-3xl font-bold text-white">Digital Binder Pro</h1>
                    </div>
                </div>

                {view === 'login' ? (
                    <>
                        <h2 className="text-2xl font-bold text-white text-center">Welcome Back</h2>
                        <form className="space-y-6" onSubmit={handleLogin}>
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email address</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="alex.doe@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
                            </div>
                            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                            <button type="submit" className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500">Sign In</button>
                        </form>
                    </>
                ) : ( // Signup View
                    <>
                    {step === 'details' && (
                         <>
                            <h2 className="text-2xl font-bold text-white text-center">Create an Account</h2>
                            <form className="space-y-6" onSubmit={handleDetailsSubmit}>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Alex Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Email address</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="alex.doe@example.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="6+ characters" />
                                </div>
                                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                                <button type="submit" className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500">Continue</button>
                            </form>
                        </>
                    )}
                    {step === 'plans' && (
                        <div className="animate-fade-in">
                             <h2 className="text-2xl font-bold text-white text-center mb-2">Choose Your Plan</h2>
                             <div className="flex justify-center items-center my-6">
                                <div className="bg-gray-700 p-1 rounded-lg flex space-x-1">
                                    <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${billingCycle === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>Monthly</button>
                                    <button onClick={() => setBillingCycle('yearly')} className={`relative px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${billingCycle === 'yearly' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>
                                        Yearly
                                        <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">Save 2 months</span>
                                    </button>
                                </div>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {renderPlanCard(
                                    'Free', 
                                    'Get started with the basics for personal use.', 
                                    '$0',
                                    '',
                                    ['Up to 3 Binders', 'Basic Note-taking', 'Task Management'],
                                    <Star className="text-gray-400" />,
                                    () => handleFinalizeSignup(UserRole.FREE),
                                    'Get Started'
                                )}
                                {subscriptionPlans.map(plan => renderPlanCard(
                                    plan.name,
                                    plan.description,
                                    billingCycle === 'monthly' ? `$${plan.price.toFixed(2)}` : `$${plan.priceYearly.toFixed(2)}`,
                                    billingCycle === 'monthly' ? '/ month' : '/ year',
                                    plan.features,
                                    plan.id === UserRole.VIP ? <Star className="text-yellow-400"/> : <Building className="text-purple-400"/>,
                                    () => handleSelectPlan(plan),
                                    `Choose ${plan.name}`
                                ))}
                             </div>
                        </div>
                    )}
                    {step === 'checkout' && selectedPlan && (
                        <Elements stripe={stripePromise}>
                            <SubscriptionCheckoutForm 
                                plan={selectedPlan} 
                                billingCycle={billingCycle}
                                onSuccess={() => handleFinalizeSignup(selectedPlan.id)} 
                                onBack={() => setStep('plans')}
                            />
                        </Elements>
                    )}
                    </>
                )}
                 <div className="text-sm text-center">
                    <button onClick={() => { setView(view === 'login' ? 'signup' : 'login'); resetForm(); }} className="font-medium text-blue-400 hover:text-blue-300">
                        {view === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthView;