// File: pages/signup/MembershipPayment.jsx - PAYMENT PROCESSING VIEW
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../../contexts/UserContext";
import SimpleBanner from "../../components/SimpleBanner";
import alcorStar from "../../assets/images/alcor-yellow-star.png";

export default function MembershipPayment({ 
  membershipData,
  packageData,
  contactData,
  onBack,
  onComplete 
}) {
  const { user } = useUser();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('initializing');
  const [paymentError, setPaymentError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  
  // Apply Marcellus font
  const marcellusStyle = {
    fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif",
    fontSize: "1.05rem"
  };

  // Calculate payment amount based on membership data
  const calculatePaymentAmount = useCallback(() => {
    const baseCost = packageData?.annualCost || 540;
    let discountAmount = 0;
    
    if (membershipData?.iceCodeValid && membershipData?.iceCodeInfo) {
      // Apply ICE discount (25% for first year)
      discountAmount = Math.round(baseCost * 0.25);
    }
    
    const finalAmount = Math.max(0, baseCost - discountAmount);
    
    // Calculate based on payment frequency
    let amount = finalAmount;
    let frequency = membershipData?.paymentFrequency || 'annually';
    
    switch (frequency) {
      case 'monthly':
        amount = Math.round(finalAmount / 12);
        break;
      case 'quarterly':
        amount = Math.round(finalAmount / 4);
        break;
      case 'annually':
      default:
        amount = finalAmount;
        break;
    }
    
    return {
      amount,
      frequency,
      baseCost,
      discountAmount,
      finalAnnualCost: finalAmount
    };
  }, [membershipData, packageData]);

  // Initialize payment process
  useEffect(() => {
    const initializePayment = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setPaymentStatus('initializing');
        
        console.log('🔄 MembershipPayment: Initializing payment process...');
        console.log('Membership data:', membershipData);
        console.log('Package data:', packageData);
        console.log('Contact data:', contactData);
        
        // Calculate payment details
        const payment = calculatePaymentAmount();
        setPaymentData(payment);
        
        console.log('💰 Payment calculation:', payment);
        
        // Simulate payment initialization delay
        setTimeout(() => {
          setPaymentStatus('ready');
          setIsLoading(false);
        }, 2000);
        
      } catch (err) {
        console.error('❌ Error initializing payment:', err);
        setError('Failed to initialize payment process. Please try again.');
        setIsLoading(false);
      }
    };
    
    initializePayment();
  }, [membershipData, packageData, contactData, calculatePaymentAmount]);

  // Handle payment processing
  const handleProcessPayment = async () => {
    try {
      setPaymentStatus('processing');
      setPaymentError(null);
      
      console.log('💳 Processing payment...');
      
      // TODO: Integrate with actual payment processor (Stripe, etc.)
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate random success/failure for demo
      const isSuccess = Math.random() > 0.2; // 80% success rate
      
      if (isSuccess) {
        console.log('✅ Payment successful!');
        setPaymentStatus('completed');
        
        // Call completion handler after a brief delay
        setTimeout(() => {
          if (onComplete) {
            onComplete({
              paymentCompleted: true,
              paymentAmount: paymentData.amount,
              paymentFrequency: paymentData.frequency,
              transactionId: `TXN_${Date.now()}`, // Mock transaction ID
              completionDate: new Date().toISOString()
            });
          }
        }, 2000);
      } else {
        throw new Error('Payment was declined. Please check your payment method and try again.');
      }
      
    } catch (err) {
      console.error('❌ Payment error:', err);
      setPaymentStatus('error');
      setPaymentError(err.message || 'Payment processing failed. Please try again.');
    }
  };

  // Handle retry payment
  const handleRetryPayment = () => {
    setPaymentStatus('ready');
    setPaymentError(null);
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    if (!amount) return "";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get status display
  const getStatusDisplay = () => {
    switch (paymentStatus) {
      case 'initializing':
        return {
          icon: (
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#775684]"></div>
          ),
          title: 'Preparing Payment',
          message: 'Setting up your payment details...',
          color: 'text-[#775684]'
        };
      
      case 'ready':
        return {
          icon: (
            <div className="bg-blue-500 rounded-full p-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          ),
          title: 'Ready to Process Payment',
          message: 'Review your payment details and click Process Payment to continue.',
          color: 'text-blue-600'
        };
      
      case 'processing':
        return {
          icon: (
            <div className="bg-orange-500 rounded-full p-4">
              <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          ),
          title: 'Processing Payment...',
          message: 'Please wait while we process your payment. Do not refresh or close this page.',
          color: 'text-orange-600'
        };
      
      case 'completed':
        return {
          icon: (
            <div className="bg-green-500 rounded-full p-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ),
          title: 'Payment Successful!',
          message: 'Welcome to Alcor! Your membership is now active and your first payment has been processed.',
          color: 'text-green-600'
        };
      
      case 'error':
        return {
          icon: (
            <div className="bg-red-500 rounded-full p-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ),
          title: 'Payment Error',
          message: paymentError || 'There was an error processing your payment.',
          color: 'text-red-600'
        };
      
      default:
        return {
          icon: <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#775684]"></div>,
          title: 'Loading...',
          message: 'Please wait...',
          color: 'text-gray-600'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  if (error) {
    return (
      <div className="w-screen h-screen fixed inset-0 bg-white flex items-center justify-center" style={marcellusStyle}>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="bg-red-500 rounded-full p-4 w-fit mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Payment</h2>
          <p className="text-gray-600 text-lg mb-6">{error}</p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={onBack}
              className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50 transition-all duration-300"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#775684] text-white rounded-full font-medium hover:bg-[#664573] transition-all duration-300"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen fixed inset-0 bg-white" style={marcellusStyle}>
      <div className="w-full h-full flex flex-col">
        {/* Simple Banner - Always show */}
        <SimpleBanner title="Complete Your Payment" />
        
        {/* Payment Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          {/* Status Icon */}
          <div className="flex justify-center mb-8">
            {statusDisplay.icon}
          </div>
          
          {/* Status Title */}
          <h2 className={`text-3xl font-bold mb-6 text-center ${statusDisplay.color}`}>
            {statusDisplay.title}
          </h2>
          
          {/* Status Message */}
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed text-center">
            {statusDisplay.message}
          </p>
          
          {/* Payment Details Card - Show when ready or processing */}
          {(paymentStatus === 'ready' || paymentStatus === 'processing') && paymentData && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 mb-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Payment Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700 font-medium">Payment Frequency:</span>
                  <span className="text-gray-900 font-semibold capitalize">{paymentData.frequency}</span>
                </div>
                
                {paymentData.discountAmount > 0 && (
                  <>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700 font-medium">Base Cost:</span>
                      <span className="text-gray-500 line-through">{formatCurrency(paymentData.baseCost)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-green-700 font-medium">ICE Discount:</span>
                      <span className="text-green-700 font-semibold">-{formatCurrency(paymentData.discountAmount)}</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between items-center py-3 border-t-2 border-gray-300">
                  <span className="text-xl font-bold text-gray-900">Amount Due:</span>
                  <span className="text-2xl font-bold text-[#775684]">{formatCurrency(paymentData.amount)}</span>
                </div>
              </div>
              
              {/* Payment Method Placeholder */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Payment Method</h4>
                <div className="flex items-center">
                  <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-xs">VISA</span>
                  </div>
                  <span className="text-gray-700">•••• •••• •••• 1234</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Payment method will be collected in the actual implementation
                </p>
              </div>
            </div>
          )}
          
          {/* Success Message */}
          {paymentStatus === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 max-w-2xl">
              <div className="flex items-center text-green-800">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span className="font-semibold text-xl block">
                    Welcome to Alcor Life Extension Foundation!
                  </span>
                  <span className="text-lg">
                    Your membership is now active. You'll receive a confirmation email shortly.
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Debug Information (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left text-sm max-w-md w-full">
              <h4 className="font-semibold mb-2">Debug Info:</h4>
              <p>Status: {paymentStatus}</p>
              <p>Payment Data: {paymentData ? JSON.stringify(paymentData, null, 2) : 'None'}</p>
              <p>User: {user?.email}</p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-center space-x-6">
            {paymentStatus === 'ready' && (
              <>
                <button
                  onClick={onBack}
                  className="px-8 py-4 border border-gray-300 rounded-full text-gray-700 font-medium text-lg hover:bg-gray-50 transition-all duration-300"
                >
                  Go Back
                </button>
                <button
                  onClick={handleProcessPayment}
                  className="px-8 py-4 bg-[#775684] text-white rounded-full font-medium text-lg hover:bg-[#664573] transition-all duration-300 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Process Payment
                </button>
              </>
            )}
            
            {paymentStatus === 'error' && (
              <>
                <button
                  onClick={onBack}
                  className="px-8 py-4 border border-gray-300 rounded-full text-gray-700 font-medium text-lg hover:bg-gray-50 transition-all duration-300"
                >
                  Go Back
                </button>
                <button
                  onClick={handleRetryPayment}
                  className="px-8 py-4 bg-[#775684] text-white rounded-full font-medium text-lg hover:bg-[#664573] transition-all duration-300"
                >
                  Try Again
                </button>
              </>
            )}
            
            {paymentStatus === 'processing' && (
              <div className="text-center">
                <div className="animate-pulse text-orange-600 font-medium">
                  Processing your payment...
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  This usually takes 5-10 seconds
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}