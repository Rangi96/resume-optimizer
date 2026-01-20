import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PaymentSuccess = ({ sessionId, onClose }) => {
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Give webhook time to process (it should be instant, but let's be safe)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        {loading ? (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('payment.success.processingTitle')}</h2>
            <p className="text-gray-600">{t('payment.success.processingMessage')}</p>
          </>
        ) : (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('payment.success.title')}</h2>
            <p className="text-gray-600 mb-6">
              {t('payment.success.message')}
            </p>
            {error && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                {error}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium"
            >
              {t('buttons.continue')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
