import React from 'react';
import { XCircle } from 'lucide-react';

const PaymentCanceled = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <XCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Canceled</h2>
        <p className="text-gray-600 mb-6">
          Your payment was canceled. No charges have been made to your account.
        </p>
        <button
          onClick={onClose}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default PaymentCanceled;
