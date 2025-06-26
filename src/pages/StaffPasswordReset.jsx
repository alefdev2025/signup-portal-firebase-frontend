import React, { useState, useEffect } from 'react';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Lock, AlertCircle, Check, X, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import darkLogo from "../assets/images/alcor-white-logo.png";

const StaffPasswordReset = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const oobCode = searchParams.get('oobCode');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });

  // Password strength checker
  const checkPasswordStrength = (pwd) => {
    const feedback = [];
    let score = 0;
    
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    
    if (pwd.length < 8) feedback.push('At least 8 characters');
    if (!/[a-z]/.test(pwd)) feedback.push('Include lowercase letter');
    if (!/[A-Z]/.test(pwd)) feedback.push('Include uppercase letter');
    if (!/[0-9]/.test(pwd)) feedback.push('Include number');
    if (!/[^A-Za-z0-9]/.test(pwd)) feedback.push('Include special character');
    
    return { score: Math.min(Math.floor((score / 6) * 4), 4), feedback };
  };

  // Update password strength when password changes
  useEffect(() => {
    if (password) {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  }, [password]);

  // Verify the reset code on mount
  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setError('Invalid or missing reset code. Please request a new password reset link.');
        setVerifying(false);
        return;
      }

      try {
        // Verify the password reset code is valid
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setVerifying(false);
      } catch (error) {
        console.error('Error verifying reset code:', error);
        setError('This password reset link is invalid or has expired. Please request a new one.');
        setVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Please fill in both password fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordStrength.score < 3) {
      setError('Password is too weak. Please use a stronger password.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Reset the password using the oobCode
      await confirmPasswordReset(auth, oobCode, password);
      
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/staff');
      }, 3000);
      
    } catch (error) {
      console.error('Error resetting password:', error);
      
      switch(error.code) {
        case 'auth/expired-action-code':
          setError('This password reset link has expired. Please request a new one.');
          break;
        case 'auth/invalid-action-code':
          setError('This password reset link is invalid. Please request a new one.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak. Please choose a stronger password.');
          break;
        default:
          setError('Failed to reset password. Please try again or request a new reset link.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch(passwordStrength.score) {
      case 0: return 'bg-gray-300';
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Reset Successful!</h2>
          <p className="text-gray-600 mb-4">Your password has been reset successfully.</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f2f3fe" }} className="min-h-screen flex flex-col">
      {/* Banner */}
      <div className="relative">
        <div 
          style={{
            background: 'linear-gradient(90deg, #0a1629 0%, #1e2650 100%)',
            fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif"
          }}
        >
          <div className="text-white px-10 pt-8 pb-12">
            <div className="flex justify-start mb-6">
              <img 
                src={darkLogo} 
                alt="Alcor Logo" 
                className="h-16 cursor-pointer"
                onClick={() => navigate('/staff')}
              />
            </div>
            
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold">
                Staff Portal - Reset Password
              </h1>
              <p className="text-lg md:text-xl mt-3 text-white/90">
                Create a new password for your staff account
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex justify-center items-start px-4 sm:px-8 md:px-12 pb-16 sm:pb-12 pt-8 sm:pt-12">
        <div className="w-full max-w-lg bg-white rounded-xl shadow-md overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            {error && !oobCode && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3 mb-6 flex items-start gap-3 text-base">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            {email && (
              <div className="mb-6 text-center">
                <p className="text-gray-600">Resetting password for:</p>
                <p className="font-semibold text-gray-800">{email}</p>
              </div>
            )}
            
            {error && oobCode && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3 mb-6 flex items-start gap-3 text-base">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            {oobCode && !error && (
              <>
                <div className="mb-6">
                  <label htmlFor="password" className="block text-gray-800 text-base font-medium mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your new password" 
                      className="w-full pl-12 pr-12 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-base"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-3">
                      <div className="flex gap-1 mb-2">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded ${
                              i < passwordStrength.score ? getPasswordStrengthColor() : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <ul className="text-xs text-gray-600 space-y-1">
                          {passwordStrength.feedback.map((item, index) => (
                            <li key={index} className="flex items-center gap-1">
                              <X className="w-3 h-3 text-red-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                      {passwordStrength.score === 4 && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Strong password
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mb-8">
                  <label htmlFor="confirmPassword" className="block text-gray-800 text-base font-medium mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password" 
                      className="w-full pl-12 pr-12 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-base"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      Passwords do not match
                    </p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Passwords match
                    </p>
                  )}
                </div>
                
                <div className="space-y-4">
                  <button 
                    type="submit"
                    disabled={loading || passwordStrength.score < 3}
                    style={{ backgroundColor: "#6f2d74", color: "white" }}
                    className="w-full py-3 px-6 rounded-full font-semibold text-base flex items-center justify-center hover:opacity-90 disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Resetting Password...
                      </>
                    ) : (
                      <>Reset Password</>
                    )}
                  </button>
                </div>
              </>
            )}
            
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => navigate('/staff')}
                className="text-purple-700 text-base hover:underline"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffPasswordReset;