import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const StripeCheckout = ({ isOpen, onClose }) => {
  const { t } = useTranslation('common');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plans = [
    {
      id: 'plan_10_exports',
      nameKey: 'payment.plan10.name',
      priceKey: 'payment.plan10.price',
      exports: 10,
      descriptionKey: 'payment.plan10.description'
    },
    {
      id: 'plan_20_exports',
      nameKey: 'payment.plan20.name',
      priceKey: 'payment.plan20.price',
      exports: 20,
      descriptionKey: 'payment.plan20.description'
    }
  ];

  const handleCheckout = async (planId) => {
    setLoading(true);
    setError('');
    setSelectedPlan(planId);

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to create checkout session');
      }

      if (!data.sessionUrl) {
        throw new Error(data.details || 'No checkout URL received');
      }

      // Redirect to Stripe checkout
      console.log('Redirecting to Stripe checkout...');
      window.location.href = data.sessionUrl;
    } catch (err) {
      setError(err.message || 'Failed to create checkout session');
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{t('payment.unlock')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => handleCheckout(plan.id)}
              disabled={loading}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                selectedPlan === plan.id && loading
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-400'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t(plan.nameKey)}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{t(plan.descriptionKey)}</p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-blue-600">{t(plan.priceKey)}</span>
              </div>
              <button
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                disabled={loading || selectedPlan === plan.id}
              >
                {selectedPlan === plan.id && loading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                    {t('payment.processing')}
                  </>
                ) : (
                  t('buttons.getStarted')
                )}
              </button>
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-600 text-center">
          {t('payment.secure')}
        </p>
      </div>
    </div>
  );
};

export default StripeCheckout;