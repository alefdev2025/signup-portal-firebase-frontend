// pages/MobilePortalLoginPage.jsx
import React from 'react';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import navyAlcorLogo from "../assets/images/navy-alcor-logo.png";
import yellowStar from "../assets/images/alcor-yellow-star.png";

const MobilePortalLoginPage = ({
  email,
  password,
  error,
  successMessage,
  loading,
  showResetForm,
  resetEmail,
  resetError,
  isSubmittingReset,
  show2FAForm,
  twoFactorCode,
  is2FASubmitting,
  onLogin,
  onInputChange,
  onResetPassword,
  on2FASubmit,
  onGoogleSignInSuccess,
  onGoogleSignInError,
  onGoogleAccountConflict,
  setResetEmail,
  setShowResetForm,
  setTwoFactorCode,
  setError,
  onSignOut,
  onNavigateToSetup,
  onNavigateToHome
}) => {
  
  if (showResetForm) {
    return (
      <div style={{ backgroundColor: "#f2f3fe" }} className="min-h-screen flex flex-col">
        <div className="flex-1 px-4 pt-8 pb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <form onSubmit={onResetPassword}>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Reset Your Password</h2>
              <p className="text-gray-600 mb-4 text-sm">
                Enter your email address below and we'll send you a link to reset your password.
              </p>
              
              {resetError && (
                <p className="text-red-600 text-sm mb-4">{resetError}</p>
              )}
              
              <input 
                type="email" 
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="e.g. john.smith@example.com" 
                className="w-full px-4 py-3 mb-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                disabled={isSubmittingReset}
              />
              
              <button 
                type="submit"
                disabled={isSubmittingReset}
                style={{ backgroundColor: "#6f2d74", color: "white" }}
                className="w-full py-3 px-6 rounded-full font-semibold hover:opacity-90 disabled:opacity-70 mb-3"
                >
                {isSubmittingReset ? 'Processing...' : 'Send Reset Link'}
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  setShowResetForm(false);
                  setResetEmail('');
                  setError('');
                }}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium hover:bg-gray-50"
              >
                Back to Sign In
              </button>
              
              <div className="mt-6 text-center">
                <img src={navyAlcorLogo} alt="Alcor Life Extension Foundation" className="h-12 mx-auto" />
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (show2FAForm) {
    return (
      <div style={{ backgroundColor: "#f2f3fe" }} className="min-h-screen flex flex-col">
        <div className="flex-1 px-4 pt-8 pb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <form onSubmit={on2FASubmit}>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Two-Factor Authentication</h2>
              <p className="text-gray-600 mb-4 text-sm">
                Enter the 6-digit code from your authenticator app.
              </p>
              
              {error && (
                <p className="text-red-600 text-sm mb-4">{error}</p>
              )}
              
              <input 
                type="text" 
                value={twoFactorCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 6) setTwoFactorCode(value);
                }}
                placeholder="000000" 
                maxLength="6"
                className="w-full px-4 py-3 mb-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-2xl text-center tracking-widest font-mono"
                disabled={is2FASubmitting}
                autoComplete="one-time-code"
                autoFocus
              />
              
              <button 
                type="submit"
                disabled={is2FASubmitting || twoFactorCode.length !== 6}
                className="w-full bg-purple-700 text-white py-3 px-6 rounded-full font-semibold hover:bg-purple-800 disabled:opacity-70 mb-3"
              >
                {is2FASubmitting ? 'Verifying...' : 'Verify Code'}
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  onSignOut();
                  setTwoFactorCode('');
                  setError('');
                }}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <div className="mt-6 text-center">
                <img src={navyAlcorLogo} alt="Alcor Life Extension Foundation" className="h-12 mx-auto" />
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f2f3fe" }} className="min-h-screen flex flex-col">
      <div className="flex-1 px-4 pt-8 pb-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <form onSubmit={onLogin} className="p-6">
        <div className="text-center mb-9 relative">
  <span className="text-[22px] font-bold text-gray-800">
    Member Sign In
  </span>
  <img src={yellowStar} alt="" className="h-7 absolute top-1/2 -translate-y-1/2" style={{ left: 'calc(50% + 80px)' }} />
</div>
            
            {successMessage && (
              <p className="text-green-600 text-sm mb-4">{successMessage}</p>
            )}
  
            {error && (
              <p className="text-red-600 text-sm mb-4">{error}</p>
            )}
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-800 text-sm font-medium mb-2">
                Email
              </label>
              <input 
                type="email" 
                id="email"
                name="email"
                value={email}
                onChange={onInputChange}
                placeholder="e.g. john.smith@example.com" 
                className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                disabled={loading}
              />
            </div>
            
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-gray-800 text-sm font-medium">
                  Password
                </label>
                <button 
                  type="button" 
                  onClick={() => {
                    setResetEmail(email || '');
                    setShowResetForm(true);
                    setError('');
                  }}
                  className="text-purple-700 text-sm hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <input 
                type="password" 
                id="password"
                name="password"
                value={password}
                onChange={onInputChange}
                placeholder="Enter your password" 
                className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "#6f2d74", color: "white" }}
              className="w-full py-3 px-6 rounded-full font-semibold text-base hover:opacity-90 disabled:opacity-70 mb-3"
            >
              {loading ? 'Checking...' : 'Sign In'}
            </button>
            
            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-gray-300"></div>
              <div className="px-4 text-gray-500 uppercase text-xs">OR</div>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            
            <GoogleSignInButton
              onSuccess={onGoogleSignInSuccess}
              onError={onGoogleSignInError}
              onAccountConflict={onGoogleAccountConflict}
              disabled={loading}
              label="Continue with Google"
              className="w-full py-3 text-base mb-6"
            />
            
            <div className="border-t border-gray-200 pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-1">
                  Need portal access?
                </p>
                <button
                  type="button"
                  onClick={onNavigateToSetup}
                  className="text-purple-700 font-medium hover:underline text-base"
                >
                  Create Portal Account
                </button>
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <img src={navyAlcorLogo} alt="Alcor Life Extension Foundation" className="h-12 mx-auto mb-3" />
              <button
                type="button"
                onClick={onNavigateToHome}
                className="text-gray-500 hover:text-gray-700 underline text-xs"
              >
                Back to Home
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MobilePortalLoginPage;