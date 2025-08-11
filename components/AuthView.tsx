
import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { User, Binder } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { ICONS } from '../constants';

const AuthView: React.FC = () => {
    const { dispatch } = useAppContext();
    const [isLoginView, setIsLoginView] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');

            if (isLoginView) {
                // Handle Login
                const user = users.find(u => u.email === email);
                if (user && user.password === password) {
                    const bindersStr = localStorage.getItem(`binders_${user.id}`);
                    const binders: Binder[] = bindersStr ? JSON.parse(bindersStr) : [];
                    localStorage.setItem('loggedInUser', JSON.stringify(user));
                    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, binders } });
                } else {
                    setError('Invalid email or password.');
                }
            } else {
                // Handle Signup
                if (users.some(u => u.email === email)) {
                    setError('An account with this email already exists.');
                    return;
                }
                if (password.length < 6) {
                    setError('Password must be at least 6 characters long.');
                    return;
                }

                const newUser: User = {
                    id: uuidv4(),
                    name,
                    email,
                    password,
                    role: 'user' // New users are always 'user' role
                };

                const newUsers = [...users, newUser];
                localStorage.setItem('users', JSON.stringify(newUsers));
                localStorage.setItem(`binders_${newUser.id}`, JSON.stringify([]));
                localStorage.setItem('loggedInUser', JSON.stringify(newUser));
                dispatch({ type: 'LOGIN_SUCCESS', payload: { user: newUser, binders: [] } });
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            console.error(err);
        }
    };

    const toggleView = () => {
        setIsLoginView(!isLoginView);
        setError('');
        setName('');
        setEmail('');
        setPassword('');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
                <div className="text-center">
                    <div className="flex justify-center items-center mb-4">
                        <span className="bg-blue-600 p-3 rounded-xl mr-4">{ICONS.binders}</span>
                        <h1 className="text-3xl font-bold text-white">Digital Binder Pro</h1>
                    </div>
                    <h2 className="text-2xl font-bold text-white">{isLoginView ? 'Welcome Back' : 'Create an Account'}</h2>
                    <p className="mt-2 text-sm text-gray-400">
                        {isLoginView ? 'Sign in to continue' : 'to get started'}
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {!isLoginView && (
                         <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Alex Doe"
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="alex.doe@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors"
                        >
                            {isLoginView ? 'Sign In' : 'Sign Up'}
                        </button>
                    </div>
                </form>
                <div className="text-sm text-center">
                    <button onClick={toggleView} className="font-medium text-blue-400 hover:text-blue-300">
                        {isLoginView ? 'Don\'t have an account? Sign Up' : 'Already have an account? Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthView;
