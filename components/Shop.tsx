
import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Bundle, Page, Binder } from '../types';
import Modal from './shared/Modal';
import { v4 as uuidv4 } from 'uuid';
import { Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Get publishable key from .env
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!;
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const CheckoutForm: React.FC<{
  bundle: Bundle;
  onSuccess: () => void;
  onClose: () => void;
}> = ({ bundle, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setError(null);

    try {
      // Call backend function to create PaymentIntent
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: bundle.price * 100 }) // cents
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Failed to create payment intent' }));
        throw new Error(error);
      }

      const { clientSecret } = await res.json();
      if (!clientSecret) throw new Error('Missing clientSecret from server.');

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (stripeError) {
        setError(stripeError.message || "An unexpected error occurred.");
        setIsLoading(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess();
      } else {
        setError(`Payment status: ${paymentIntent?.status}`);
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message);
    }

    setIsLoading(false);
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
    <Modal isOpen={true} onClose={onClose} title="Complete Your Purchase">
      <div className="space-y-6">
        <div className="flex justify-between items-start p-4 bg-gray-900/50 rounded-lg">
          <div>
            <p className="font-bold text-white">{bundle.name}</p>
            <p className="text-sm text-gray-400">Billed now, one-time payment.</p>
          </div>
          <p className="text-2xl font-bold text-white">${bundle.price.toFixed(2)}</p>
        </div>
        <form onSubmit={handlePay} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Card Information</label>
            <div className="p-3 bg-gray-700 border border-gray-600 rounded-md">
              <CardElement options={cardElementOptions} />
            </div>
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button
            type="submit"
            disabled={isLoading || !stripe || !elements}
            className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-md transition-colors"
          >
            {isLoading ? "Processing..." : `Pay $${bundle.price.toFixed(2)}`}
          </button>
        </form>
        <div className="text-center text-xs text-gray-500 flex items-center justify-center">
          <Lock size={12} className="mr-1.5"/> Secure payment powered by Stripe.
        </div>
      </div>
    </Modal>
  );
};

const BundleCard: React.FC<{ bundle: Bundle; onAcquire: () => void; isOwned: boolean; isPublishedByMe: boolean; }> = ({ bundle, onAcquire, isOwned, isPublishedByMe }) => {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg transform hover:-translate-y-1 transition-transform duration-300">
      <img src={bundle.imageUrl} alt={bundle.name} className="w-full h-48 object-cover" />
      <div className="p-6">
        <h3 className="text-xl font-bold text-white">{bundle.name}</h3>
        <p className="text-gray-400 mt-2 h-20">{bundle.description}</p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-2xl font-bold text-blue-400">${bundle.price.toFixed(2)}</span>
          <button
            onClick={onAcquire}
            disabled={isOwned}
            className="px-6 py-2 font-semibold text-white rounded-lg transition-colors duration-200 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isOwned ? (isPublishedByMe ? 'Published' : 'Owned') : 'Acquire'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Shop: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleAcquireClick = (bundle: Bundle) => {
    if (state.user.role === 'owner' && state.binders.some(b => b.bundleId === bundle.bundleId)) return;
    if (state.purchasedBundles.includes(bundle.bundleId)) return;
    setSelectedBundle(bundle);
    setIsCheckoutOpen(true);
  };

  const handlePurchaseSuccess = () => {
    if (!selectedBundle) return;
    setIsCheckoutOpen(false);
    dispatch({ type: 'PURCHASE_BUNDLE', payload: selectedBundle.bundleId });
    setShowImportModal(true);
  };

  const handleImport = () => {
    if (!selectedBundle) return;
    const newPages: Page[] = selectedBundle.presetPages.map(p => ({
      ...p,
      id: uuidv4(),
      tasks: p.tasks.map(t => ({...t, id: uuidv4()})),
      files: [...p.files],
    }));
    const newBinder: Binder = {
      id: uuidv4(),
      name: selectedBundle.name,
      description: selectedBundle.description,
      pages: newPages,
      bundleId: selectedBundle.bundleId
    };
    dispatch({type: 'ADD_BINDER', payload: newBinder });
    setShowImportModal(false);
    setSelectedBundle(null);
    alert(`Successfully imported "${newBinder.name}" binder!`);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Shop</h1>
      <p className="text-gray-400 mb-8">Acquire preset binder bundles to jumpstart your productivity.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {state.bundles.map(bundle => {
          const isPublishedByMe = state.user.role === 'owner' && state.binders.some(b => b.bundleId === bundle.bundleId);
          const isOwned = state.purchasedBundles.includes(bundle.bundleId) || isPublishedByMe;
          return (
            <BundleCard
              key={bundle.bundleId}
              bundle={bundle}
              onAcquire={() => handleAcquireClick(bundle)}
              isOwned={isOwned}
              isPublishedByMe={isPublishedByMe}
            />
          )
        })}
      </div>

      {isCheckoutOpen && selectedBundle && (
        <Elements stripe={stripePromise}>
          <CheckoutForm
            bundle={selectedBundle}
            onSuccess={handlePurchaseSuccess}
            onClose={() => setIsCheckoutOpen(false)}
          />
        </Elements>
      )}

      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Purchase Successful!">
        <div className="text-center">
          <p className="text-gray-300 mb-6">You've successfully acquired the "{selectedBundle?.name}" bundle. Would you like to import it as a new binder now?</p>
          <div className="flex justify-center space-x-4">
            <button onClick={() => setShowImportModal(false)} className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg">Later</button>
            <button onClick={handleImport} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">Import Now</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Shop;
