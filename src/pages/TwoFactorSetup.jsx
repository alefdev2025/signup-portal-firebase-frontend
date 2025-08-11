// TwoFactorSetup.jsx - Extracted 2FA Setup Component

import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';

const TwoFactorSetup = ({ 
  twoFactorData, 
  formData, 
  onSuccess, 
  onSkip,
  loading: externalLoading 
}) => {
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handle2FASetup = async (e) => {
    e.preventDefault();
    
    if (twoFactorCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting to complete 2FA setup with code:', twoFactorCode);
      console.log('User ID:', twoFactorData.userId);
      
      const authCoreFn = httpsCallable(functions, 'authCore');
      const result = await authCoreFn({
        action: 'completePortal2FASetup',
        userId: twoFactorData.userId,
        token: twoFactorCode,
        code: twoFactorCode // Some backends expect 'code' instead of 'token'
      });
      
      console.log('2FA setup result:', result.data);
      
      if (result.data?.success) {
        setSuccessMessage('Two-factor authentication enabled successfully!');
        setTwoFactorCode('');
        
        // Call the success callback after a delay
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        console.error('2FA setup failed:', result.data?.error);
        setError(result.data?.error || 'Invalid code. Please try again.');
        setTwoFactorCode('');
      }
    } catch (error) {
      console.error('2FA setup error:', error);
      setError('Failed to verify code. Please try again.');
      setTwoFactorCode('');
    } finally {
      setLoading(false);
    }
  };

  // Show error state if no 2FA data
  if (!twoFactorData || !twoFactorData.qrCode) {
    return (
      <div className="p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
          Setup Error
        </h2>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-6">
          <h3 className="text-red-800 font-medium mb-2">Setup Error</h3>
          <p className="text-red-700 mb-4">
            We couldn't load your 2FA setup information. Don't worry - your account was created successfully!
          </p>
          <button
            type="button"
            onClick={onSkip}
            className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Continue to Login
          </button>
        </div>
      </div>
    );
  }

  // Show success and redirect
  if (successMessage) {
    return (
      <div className="p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
          Two-Factor Authentication Enabled
        </h2>
        
        <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        </div>
        
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
        Set Up Two-Factor Authentication
      </h2>
      
      <p className="text-gray-600 mb-6">
        Add an extra layer of security to your account by requiring a code from your phone in addition to your password.
      </p>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
          {error}
        </div>
      )}
      
      {/* Mobile device warning */}
      <div className="sm:hidden bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">
              Mobile Device Detected
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              You'll need an authenticator app on this device. If you haven't installed one yet, we recommend:
            </p>
            <ul className="list-disc list-inside text-sm text-amber-700 mt-2">
              <li>Google Authenticator</li>
              <li>Microsoft Authenticator</li>
              <li>Authy</li>
            </ul>
            <p className="text-sm text-amber-700 mt-2">
              Install one of these apps first, then return here to continue.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h4 className="font-semibold text-gray-800 mb-4 text-center">Step 1: Add to Authenticator App</h4>
        
        {/* Desktop: Show QR Code */}
        <div className="hidden sm:block text-center">
          <img 
            src={twoFactorData.qrCode} 
            alt="2FA QR Code" 
            className="mx-auto mb-4 border-2 border-gray-300 rounded-lg"
            style={{ maxWidth: '250px', height: 'auto' }}
          />
          <p className="text-sm text-gray-600 mb-2">
            Scan this QR code with your authenticator app
          </p>
        </div>
        
        {/* Mobile: Show setup key directly */}
        <div className="sm:hidden">
          <div className="bg-white rounded border border-gray-200 p-4 mb-4">
            <p className="text-sm text-gray-700 mb-2">Add this account to your authenticator app:</p>
            <p className="text-sm font-medium text-gray-900 mb-1">Account: Alcor Portal</p>
            <p className="text-sm font-medium text-gray-900 mb-3">Email: {formData.email}</p>
            <p className="text-xs text-gray-600 mb-2">Setup key:</p>
            <p className="font-mono text-xs break-all bg-gray-100 p-2 rounded select-all">
              {twoFactorData.secret}
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(twoFactorData.secret);
                alert('Setup key copied to clipboard!');
              }}
              className="mt-3 w-full bg-gray-200 text-gray-700 py-2 px-4 rounded text-sm hover:bg-gray-300"
            >
              Copy Setup Key
            </button>
          </div>
        </div>
        
        {/* Manual entry option for desktop */}
        <details className="hidden sm:block text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">Can't scan? Enter manually</summary>
          <div className="mt-2 p-3 bg-white rounded border border-gray-200">
            <p className="mb-2">Account name: <strong>Alcor Portal - {formData.email}</strong></p>
            <p className="mb-2">Secret key:</p>
            <p className="font-mono break-all select-all bg-gray-100 p-2 rounded">{twoFactorData.secret}</p>
          </div>
        </details>
      </div>
      
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-4">Step 2: Enter Verification Code</h4>
        <form onSubmit={handle2FASetup}>
          <label htmlFor="twoFactorCode" className="block text-gray-700 text-sm font-medium mb-2">
            Enter the 6-digit code from your authenticator app:
          </label>
          <input 
            type="text" 
            id="twoFactorCode"
            name="twoFactorCode"
            value={twoFactorCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 6) {
                setTwoFactorCode(value);
                if (error) setError(''); // Clear error when typing
              }
            }}
            placeholder="000000" 
            maxLength="6"
            className="w-full px-5 py-4 mb-4 border border-purple-300 rounded-md text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            autoComplete="off"
            autoFocus
            required
          />
          
          <button
            type="submit"
            disabled={loading || twoFactorCode.length !== 6}
            className="w-full bg-purple-600 text-white py-4 px-6 rounded-full font-semibold text-lg hover:bg-purple-700 disabled:opacity-70 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </>
            ) : (
              'Enable 2FA'
            )}
          </button>
        </form>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Important:</strong> Save your backup codes or secret key in a safe place. You'll need them if you lose access to your authenticator app.
        </p>
      </div>
      
      <div className="text-center">
        <button
          type="button"
          onClick={onSkip}
          className="text-gray-500 hover:text-gray-700 underline"
          disabled={loading || externalLoading}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default TwoFactorSetup;