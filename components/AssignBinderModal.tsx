import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Binder, User, UserRole } from '../types';
import Modal from './shared/Modal';
import { ICONS } from '../constants';

interface AssignBinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  binder: Binder;
}

const AssignBinderModal: React.FC<AssignBinderModalProps> = ({ isOpen, onClose, binder }) => {
    const { state, dispatch } = useAppContext();
    const { users, user: currentUser, simulatedRole } = state;
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setSelectedUserIds(binder.assignedUsers || []);
        }
    }, [isOpen, binder.assignedUsers]);

    if (!currentUser) return null;

    let adminContext = currentUser;
    if (currentUser.role === UserRole.OWNER && simulatedRole === UserRole.CORPORATE_ADMIN) {
        const mockAdmin = users.find(u => u.role === UserRole.CORPORATE_ADMIN);
        if (mockAdmin) {
            adminContext = mockAdmin;
        }
    }

    const corporateUsers = users.filter(u => 
        u.corporateId === adminContext.corporateId && u.role === UserRole.CORPORATE_USER
    );

    const handleToggleUser = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleSave = () => {
        dispatch({
            type: 'ASSIGN_BINDER',
            payload: {
                binderId: binder.id,
                userIds: selectedUserIds,
            }
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Assign "${binder.name}"`}>
            <div className="space-y-4">
                <p className="text-sm text-gray-400">Select users to grant access to this binder. Users will be able to view and edit content.</p>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {corporateUsers.length > 0 ? corporateUsers.map(corpUser => (
                        <label key={corpUser.id} className="flex items-center p-3 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
                            <input
                                type="checkbox"
                                checked={selectedUserIds.includes(corpUser.id)}
                                onChange={() => handleToggleUser(corpUser.id)}
                                className="h-5 w-5 rounded border-gray-500 bg-gray-800 text-blue-500 focus:ring-blue-600"
                            />
                            <div className="ml-4">
                                <p className="text-white font-medium">{corpUser.name}</p>
                                <p className="text-xs text-gray-500">{corpUser.email}</p>
                            </div>
                        </label>
                    )) : (
                        <p className="text-center text-gray-500 py-4">No corporate users available to assign. You can create users in Settings.</p>
                    )}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                        {ICONS.check} <span className="ml-2">Update Assignments</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AssignBinderModal;
