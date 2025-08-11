

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { View, Binder, Page, ReminderFrequency } from '../types';
import { v4 as uuidv4 } from 'uuid';
import Modal from './shared/Modal';

const NewPageModal: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { isNewPageModalOpen, binders } = state;

    const [pageTitle, setPageTitle] = useState('');
    const [saveOption, setSaveOption] = useState('existing'); // 'existing' or 'new'
    const [selectedBinderId, setSelectedBinderId] = useState('');
    const [newBinderName, setNewBinderName] = useState('');

    useEffect(() => {
        // When modal opens, reset form state
        if (isNewPageModalOpen) {
            setPageTitle('');
            setSaveOption('existing');
            // Default to the currently selected binder or the first one
            setSelectedBinderId(state.selectedBinderId || (binders[0]?.id || ''));
            setNewBinderName('');
        }
    }, [isNewPageModalOpen, binders, state.selectedBinderId]);

    const handleClose = () => {
        dispatch({ type: 'SET_NEW_PAGE_MODAL_OPEN', payload: false });
    };

    const handleSubmit = () => {
        const newPageSkeleton: Omit<Page, 'id'> = {
            title: pageTitle,
            notes: '',
            files: [],
            tasks: [],
            reminder: { title: '', frequency: ReminderFrequency.NONE, isActive: false }
        };
        const pageId = uuidv4();

        if (saveOption === 'existing') {
            dispatch({ type: 'ADD_PAGE', payload: { binderId: selectedBinderId, page: { ...newPageSkeleton, id: pageId } } });
            dispatch({ type: 'SELECT_PAGE', payload: { binderId: selectedBinderId, pageId: pageId } });
            dispatch({ type: 'SET_VIEW', payload: View.BINDERS });
        } else { // 'new' binder
            const binderId = uuidv4();
            const newBinder: Binder = {
                id: binderId,
                name: newBinderName,
                description: '',
                pages: [{ ...newPageSkeleton, id: pageId }]
            };
            dispatch({ type: 'ADD_BINDER', payload: newBinder });
            dispatch({ type: 'SELECT_BINDER', payload: binderId });
            // SELECT_PAGE is implicitly handled by SELECT_BINDER, which selects the first page
            dispatch({ type: 'SET_VIEW', payload: View.BINDERS });
        }

        handleClose();
    };
    
    const isFormValid = pageTitle.trim() !== '' && (saveOption === 'existing' ? selectedBinderId !== '' : newBinderName.trim() !== '');

    if (!isNewPageModalOpen) return null;

    return (
        <Modal isOpen={isNewPageModalOpen} onClose={handleClose} title="Create a New Page">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Page Title</label>
                    <input 
                        type="text" 
                        value={pageTitle}
                        onChange={e => setPageTitle(e.target.value)}
                        placeholder="e.g., Q4 Project Plan"
                        className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                    />
                </div>
                
                <fieldset>
                    <legend className="block text-sm font-medium text-gray-300 mb-2">Where to save?</legend>
                    <div className="space-y-4">
                        {/* Option 1: Existing Binder */}
                        <div className="flex items-center">
                            <input 
                                id="existing-binder" 
                                name="save-option" 
                                type="radio" 
                                checked={saveOption === 'existing'}
                                onChange={() => setSaveOption('existing')}
                                className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                            />
                            <label htmlFor="existing-binder" className="ml-3 block text-sm font-medium text-gray-200">
                                Existing Binder
                            </label>
                        </div>
                        {saveOption === 'existing' && (
                            <div className="pl-7">
                                <select
                                    value={selectedBinderId}
                                    onChange={e => setSelectedBinderId(e.target.value)}
                                    className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {binders.length > 0 ? binders.map(binder => (
                                        <option key={binder.id} value={binder.id}>{binder.name}</option>
                                    )) : <option disabled>No binders available</option>}
                                </select>
                            </div>
                        )}
                        
                        {/* Option 2: New Binder */}
                        <div className="flex items-center">
                            <input 
                                id="new-binder" 
                                name="save-option" 
                                type="radio" 
                                checked={saveOption === 'new'}
                                onChange={() => setSaveOption('new')}
                                className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                            />
                            <label htmlFor="new-binder" className="ml-3 block text-sm font-medium text-gray-200">
                                New Binder
                            </label>
                        </div>
                        {saveOption === 'new' && (
                            <div className="pl-7">
                                <input 
                                    type="text" 
                                    value={newBinderName}
                                    onChange={e => setNewBinderName(e.target.value)}
                                    placeholder="New Binder Name"
                                    className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        )}
                    </div>
                </fieldset>

                <button 
                    onClick={handleSubmit} 
                    disabled={!isFormValid}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    Create Page
                </button>
            </div>
        </Modal>
    );
};

export default NewPageModal;
