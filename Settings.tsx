
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ICONS } from '../constants';
import Modal from './shared/Modal';
import { NotificationStyle } from '../types';
import { Bell, KeyRound } from 'lucide-react';

const SettingsCard: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        <div className="p-6 space-y-4">
            {children}
        </div>
    </div>
);

const Settings: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { user, devices, notificationStyle } = state;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', body: ''});
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        if (Notification.permission === 'default') {
            handleRequestNotificationPermission();
        }
    }, []);

    const showStepUpModal = (title: string, body: string) => {
        setModalContent({ title, body });
        setIsModalOpen(true);
        setTimeout(() => setIsModalOpen(false), 2500);
    };

    const handleRequestNotificationPermission = async () => {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
    };
    
    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords don't match.");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters long.');
            return;
        }
        if (currentPassword === user?.password) {
            dispatch({ type: 'UPDATE_PASSWORD', payload: newPassword });
            setPasswordSuccess('Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setPasswordError('Current password is incorrect.');
        }
    };


    if (!user) return null; // Should not happen if routing is correct

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

            <div className="space-y-8">
                {/* Profile */}
                <SettingsCard title="Profile" description="Manage your personal information.">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400">Name</p>
                            <p className="text-white">{user.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400">Email</p>
                            <p className="text-white">{user.email}</p>
                        </div>
                    </div>
                </SettingsCard>
                
                {/* Notifications */}
                <SettingsCard title="Notifications" description="Choose how you want to be notified when a timer ends. This is a UI simulation.">
                    <div>
                        <p className="text-white mb-3 font-medium">Alert Style</p>
                        <div className="flex space-x-4">
                        {Object.values(NotificationStyle).map(style => (
                            <button
                                key={style}
                                onClick={() => dispatch({ type: 'SET_NOTIFICATION_STYLE', payload: style })}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${notificationStyle === style ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                            >
                                {style}
                            </button>
                        ))}
                        </div>
                    </div>
                    {notificationPermission !== 'granted' && (
                        <div className="flex items-center justify-between p-3 bg-yellow-900/50 rounded-lg">
                           <div className="flex items-center">
                            <Bell size={20} className="text-yellow-400 mr-3" />
                            <p className="text-yellow-300 text-sm">
                                {notificationPermission === 'denied' 
                                    ? 'Notifications are blocked by your browser.'
                                    : 'Enable notifications for the best experience.'
                                }
                            </p>
                           </div>
                           {notificationPermission === 'default' && (
                             <button onClick={handleRequestNotificationPermission} className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-700 rounded-md">Enable</button>
                           )}
                        </div>
                    )}
                </SettingsCard>

                {/* Security */}
                <SettingsCard title="Security" description="Manage passwords, passkeys, and active sessions.">
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <h4 className="text-base font-semibold text-white flex items-center"><KeyRound size={18} className="mr-2"/> Change Password</h4>
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Current Password</label>
                            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white" required />
                        </div>
                         <div>
                            <label className="text-sm text-gray-400 block mb-1">New Password</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white" required />
                        </div>
                         <div>
                            <label className="text-sm text-gray-400 block mb-1">Confirm New Password</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white" required />
                        </div>
                        <div className="flex justify-end items-center">
                            {passwordError && <p className="text-sm text-red-500 mr-4">{passwordError}</p>}
                            {passwordSuccess && <p className="text-sm text-green-500 mr-4">{passwordSuccess}</p>}
                            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg">Update Password</button>
                        </div>
                    </form>
                    <div className="border-t border-gray-700 my-4"></div>
                    <div className="flex items-center justify-between">
                        <p className="text-white">Passkeys</p>
                        <button onClick={() => showStepUpModal('Add Passkey', 'Follow the instructions on your device to add a new passkey (platform or hardware).')} className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 rounded-lg">Add Passkey</button>
                    </div>
                </SettingsCard>
                
                {/* Sessions & Devices */}
                <SettingsCard title="Sessions & Devices" description="These are the devices with access to your account.">
                    {devices.map(device => (
                        <div key={device.id} className="flex items-center justify-between pb-2 border-b border-gray-700 last:border-b-0">
                            <div>
                                <p className={`text-white font-medium ${device.revoked ? 'line-through' : ''}`}>{device.name}</p>
                                <p className="text-sm text-gray-500">Last seen: {new Date(device.lastSeen).toLocaleDateString()}</p>
                            </div>
                            {!device.revoked && (
                                <button onClick={() => showStepUpModal('Revoke Device', `Authenticating to revoke access for ${device.name}.`)} className="text-sm text-red-500 hover:text-red-400">Revoke</button>
                            )}
                        </div>
                    ))}
                </SettingsCard>
                
                {/* Data Management */}
                <SettingsCard title="Data Management" description="Export an encrypted backup or delete your account.">
                    <div className="flex items-center justify-between">
                        <p className="text-white">Export Encrypted Backup</p>
                        <button onClick={() => showStepUpModal('Export Data', 'Please authenticate to begin your encrypted data export.')} className="flex items-center text-sm text-blue-400 hover:text-blue-300">
                            {ICONS.lock}<span className="ml-1">Export</span>
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-red-500">Delete Account</p>
                        <button onClick={() => showStepUpModal('Account Deletion', 'This is a critical action. Please authenticate to proceed.')} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-lg">Delete</button>
                    </div>
                </SettingsCard>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalContent.title}>
                <div className="text-center">
                    <div className="flex justify-center mb-4 text-blue-400">{ICONS.shield}</div>
                    <p className="text-gray-300">{modalContent.body}</p>
                    <p className="text-sm text-gray-500 mt-4">(This is a UI simulation of a security feature)</p>
                </div>
            </Modal>
        </div>
    );
};

export default Settings;
