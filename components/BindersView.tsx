import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import PageDetail from './PageDetail';
import { ICONS } from '../constants';
import { Page, ReminderFrequency, Binder } from '../types';
import { v4 as uuidv4 } from 'uuid';
import Modal from './shared/Modal';

const BinderCard: React.FC<{ binder: Binder; onSelect: (id: string) => void }> = ({ binder, onSelect }) => (
  <div 
    onClick={() => onSelect(binder.id)}
    className="bg-gray-800 rounded-xl p-5 shadow-lg transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer flex flex-col justify-between h-full"
    role="button"
    aria-label={`Select binder ${binder.name}`}
  >
    <div>
      <h3 className="text-lg font-bold text-white truncate">{binder.name}</h3>
      <p className="text-gray-400 mt-2 text-sm h-16 overflow-hidden">{binder.description || 'No description available.'}</p>
    </div>
    <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
        <span className="text-sm text-gray-500">{binder.pages.length} {binder.pages.length === 1 ? 'page' : 'pages'}</span>
        {binder.isPublished && (
            <span className="text-xs font-semibold bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Published</span>
        )}
    </div>
  </div>
);

const BindersView: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { binders, selectedBinderId, user } = state;
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  const selectedBinder = binders.find(b => b.id === selectedBinderId);
  
  const [bundleName, setBundleName] = useState('');
  const [bundleDesc, setBundleDesc] = useState('');
  const [bundlePrice, setBundlePrice] = useState(9.99);
  const [bundleImg, setBundleImg] = useState('');

  // State for inline editing binder name
  const [isEditingName, setIsEditingName] = useState(false);
  const [currentName, setCurrentName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const uploadedImageUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (isPublishModalOpen && selectedBinder) {
        setBundleName(selectedBinder.name);
        setBundleDesc(selectedBinder.description);
        setBundlePrice(selectedBinder.price ?? 9.99);
        setBundleImg(selectedBinder.imageUrl || '');
        setCurrentName(selectedBinder.name);
        
        if (uploadedImageUrlRef.current) {
            URL.revokeObjectURL(uploadedImageUrlRef.current);
            uploadedImageUrlRef.current = null;
        }
    }
  }, [selectedBinder, isPublishModalOpen]);

  useEffect(() => {
    if (selectedBinder) {
      setCurrentName(selectedBinder.name);
    }
  }, [selectedBinder]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameUpdate = () => {
    if (selectedBinder && currentName.trim() && currentName.trim() !== selectedBinder.name) {
      dispatch({ type: 'UPDATE_BINDER', payload: { ...selectedBinder, name: currentName.trim() } });
    }
    setIsEditingName(false);
  };

  const handleNameInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameUpdate();
    } else if (e.key === 'Escape') {
      setCurrentName(selectedBinder?.name || '');
      setIsEditingName(false);
    }
  };

  const handleAddPage = () => {
    if (!selectedBinderId) return;
    const newPage: Page = {
        id: uuidv4(),
        title: 'New Page',
        notes: '',
        files: [],
        tasks: [],
        reminder: { title: '', frequency: ReminderFrequency.NONE, isActive: false }
    };
    dispatch({ type: 'ADD_PAGE', payload: { binderId: selectedBinderId, page: newPage } });
  };
  
  const handleDeleteBinder = () => {
    if (!selectedBinder) return;

    const confirmMessage = `Are you sure you want to delete the binder "${selectedBinder.name}"?` +
      (selectedBinder.isPublished ? "\n\nThis will also remove its listing from the shop." : "");

    if (window.confirm(confirmMessage)) {
        dispatch({ type: 'DELETE_BINDER', payload: selectedBinder.id });
    }
  };

  const handleClosePublishModal = () => {
    if (uploadedImageUrlRef.current) {
        URL.revokeObjectURL(uploadedImageUrlRef.current);
        uploadedImageUrlRef.current = null;
    }
    setIsPublishModalOpen(false);
  };

  // === STRIPE PRODUCT SYNC (kept) ===
  const handlePublishBinder = async () => {
    if (!selectedBinder) return;

    const binderDataForStripe = {
      name: bundleName,
      description: bundleDesc || '',
      price: Math.round(Number(bundlePrice) * 100), // Stripe wants cents (integer)
      imageUrl: bundleImg || `https://picsum.photos/seed/${bundleName.replace(/\s+/g, '-').toLowerCase()}/400/300`,
      bundleId: selectedBinder.bundleId || `bundle_${uuidv4()}`,
      // We only track stripePriceId in Binder type; pass it if present so backend can reuse price if unchanged
      priceId: selectedBinder.stripePriceId || undefined,
      currency: 'usd',
    };

    try {
      const response = await fetch('/api/sync-stripe-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(binderDataForStripe),
      });

      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: 'Failed to sync product with Stripe' }));
        throw new Error(error);
      }

      const { stripePriceId } = await response.json();

      const updatedBinder: Binder = {
        ...selectedBinder,
        name: bundleName,
        description: bundleDesc,
        price: Number(bundlePrice),
        imageUrl: binderDataForStripe.imageUrl,
        isPublished: true,
        bundleId: binderDataForStripe.bundleId,
        stripePriceId: stripePriceId, // save price id returned from server
      };
      
      dispatch({ type: 'UPDATE_BINDER', payload: updatedBinder });
      uploadedImageUrlRef.current = null; 

      const successAction = selectedBinder.isPublished ? 'updated' : 'published';
      alert(`Successfully ${successAction} "${bundleName}" and created/updated its product in Stripe.`);
      setIsPublishModalOpen(false);

    } catch (error: any) {
      console.error('Publishing error:', error);
      alert(error?.message || 'Could not sync with Stripe. Please check your backend and try again.');
    }
  };
  // === END STRIPE SYNC ===

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (uploadedImageUrlRef.current) {
            URL.revokeObjectURL(uploadedImageUrlRef.current);
        }
        const newImageUrl = URL.createObjectURL(file);
        uploadedImageUrlRef.current = newImageUrl;
        setBundleImg(newImageUrl);
    }
  };

  const handleSelectBinder = (binderId: string) => {
    dispatch({ type: 'SELECT_BINDER', payload: binderId });
  };

  if (!selectedBinder) {
    return (
      <div className="p-4 sm:p-6 md:p-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-2">My Binders</h1>
        <p className="text-gray-400 mb-8">Select a binder to view its contents.</p>
        
        {binders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {binders.map(binder => (
                    <BinderCard key={binder.id} binder={binder} onSelect={handleSelectBinder} />
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500 bg-gray-900/50 rounded-lg">
                <h2 className="text-2xl font-bold">No Binders Found</h2>
                <p className="mt-2">Create your first page and binder using the "New Page" button in the header.</p>
            </div>
        )}
      </div>
    );
  }
  
  const isPublished = !!selectedBinder.isPublished;

  return (
    <div className="flex h-full">
      {/* Table of Contents (static width, no collapse here) */}
      <div className="w-80 bg-gray-900/50 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          {isEditingName && user.role === 'owner' ? (
            <input
              ref={nameInputRef}
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
              onBlur={handleNameUpdate}
              onKeyDown={handleNameInputKeyDown}
              className="text-lg font-bold text-white bg-transparent border-b-2 border-blue-500 focus:outline-none w-full pr-2"
            />
          ) : (
            <h2
              onClick={() => user.role === 'owner' && setIsEditingName(true)}
              className={`text-lg font-bold text-white truncate pr-2 ${user.role === 'owner' ? 'cursor-pointer hover:text-blue-300 transition-colors' : ''}`}
              title={user.role === 'owner' ? "Click to edit binder name" : selectedBinder.name}
            >
              {selectedBinder.name}
            </h2>
          )}
          <div className="flex items-center space-x-2">
            {user.role === 'owner' && (
              <button onClick={() => setIsPublishModalOpen(true)} title={isPublished ? "Manage Listing" : "Publish to Shop"} className="text-gray-400 hover:text-white transition-colors duration-200">
                  {ICONS.upload}
              </button>
            )}
            <button onClick={handleAddPage} className="text-gray-400 hover:text-white transition-colors duration-200">
                {ICONS.add}
            </button>
            <button onClick={handleDeleteBinder} className="text-gray-400 hover:text-red-500 transition-colors duration-200">
                {ICONS.delete}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {selectedBinder.pages.map(page => (
            <button
              key={page.id}
              onClick={() => dispatch({ type: 'SELECT_PAGE', payload: { binderId: selectedBinder.id, pageId: page.id } })}
              className={`flex items-center w-full text-left p-3 rounded-lg text-sm transition-colors duration-200 ${
                state.selectedPageId === page.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {ICONS.page}
              <span className="ml-3 truncate">{page.title}</span>
            </button>
          ))}
          {selectedBinder.pages.length === 0 && (
              <div className="text-center text-gray-500 p-4">No pages in this binder.</div>
          )}
        </div>
      </div>

      {/* Page Detail */}
      <div className="flex-1">
        <PageDetail />
      </div>
      
      <Modal isOpen={isPublishModalOpen} onClose={handleClosePublishModal} title={isPublished ? "Update Shop Listing" : "Publish Binder to Shop"}>
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300">Bundle Name</label>
                <input type="text" value={bundleName} onChange={e => setBundleName(e.target.value)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Description</label>
                <textarea value={bundleDesc} onChange={e => setBundleDesc(e.target.value)} rows={3} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Price ($)</label>
                <input type="number" step="0.01" value={bundlePrice} onChange={e => setBundlePrice(parseFloat(e.target.value) || 0)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Cover Image</label>
                <div className="mt-2 flex items-center space-x-4">
                    <input
                        type="file"
                        accept="image/*"
                        ref={imageInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                    {bundleImg ? (
                        <img src={bundleImg} alt="Cover preview" className="h-24 w-24 rounded-md object-cover bg-gray-700" />
                    ) : (
                        <div className="h-24 w-24 rounded-md bg-gray-700 flex items-center justify-center text-gray-500">
                            {ICONS.image}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Upload Image
                    </button>
                </div>
            </div>
            <button onClick={handlePublishBinder} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                {isPublished ? 'Update Listing' : 'Publish'}
            </button>
        </div>
      </Modal>
    </div>
  );
};

export default BindersView;
