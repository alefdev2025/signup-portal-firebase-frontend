// File: pages/signup/MembershipStep.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import { getPackageInfo } from "../../services/package";
import { updateSignupProgressAPI } from "../../services/auth";
import fundingService from "../../services/funding";
import alcorStar from "../../assets/images/alcor-yellow-star.png";

const MembershipStep = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [packageInfo, setPackageInfo] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPaymentFrequency, setSelectedPaymentFrequency] = useState("quarterly");
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Load user's package selection to get the membership cost
  useEffect(() => {
    const loadPackageInfo = async () => {
      if (currentUser === undefined) {
        return;
      }
      
      if (!currentUser) {
        navigate('/signup', { replace: true });
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Get package info using the same method as FundingPage
        const result = await fundingService.getPackageInfoForFunding();
        
        if (result.success) {
          setPackageInfo({
            packageType: result.packageType,
            preservationType: result.preservationType,
            preservationEstimate: result.preservationEstimate,
            annualCost: result.annualCost,
            details: {
              cost: result.annualCost
            }
          });
        } else {
          // Fallback to original method
          const packageResult = await getPackageInfo();
          if (packageResult?.success && packageResult?.packageInfo) {
            setPackageInfo(packageResult.packageInfo);
          } else {
            setError("Could not load your package information. Please go back and try again.");
            return;
          }
        }
        
        setLoading(false);
        // Set animation to start once loading is complete
        setTimeout(() => {
          setAnimationComplete(true);
        }, 100);
      } catch (err) {
        console.error("Error loading package info:", err);
        setError("An error occurred while loading your information. Please try again.");
        setLoading(false);
      }
    };
    
    loadPackageInfo();
  }, [currentUser, navigate]);
  
  // Handle going back to previous step
  const handleBack = () => {
    console.log("********** MembershipStep: Handle back button clicked **********");
    
    try {
      // Set force navigation
      localStorage.setItem('force_active_step', '4');
      localStorage.setItem('force_timestamp', Date.now().toString());
      
      console.log("Force navigation set:", {
        step: localStorage.getItem('force_active_step'),
        timestamp: localStorage.getItem('force_timestamp')
      });
      
      // Use the force=true URL parameter to bypass the route guard
      const fundingUrlWithForce = "/signup/funding?force=true";
      console.log(`Navigating to ${fundingUrlWithForce}`);
      
      // Use direct window location change for most reliable navigation
      window.location.href = fundingUrlWithForce;
      
      return false;
    } catch (error) {
      console.error("Error during back navigation:", error);
      
      // Last resort fallback
      window.location.href = '/signup/funding?force=true';
      return false;
    }
  };
  
  // Handle payment frequency selection and proceed to payment
  const handleContinue = async () => {
    if (isSubmitting || !currentUser || !packageInfo || !selectedPaymentFrequency) return;
    
    setIsSubmitting(true);
    
    try {
      // Update signup progress with payment frequency selection
      const progressResult = await updateSignupProgressAPI("payment", 5, {
        paymentFrequency: selectedPaymentFrequency,
        selectedAt: new Date().toISOString()
      });
      
      if (!progressResult?.success) {
        console.warn("Warning: Failed to update signup progress, but continuing");
      }
      
      // Navigate to payment processing or summary
      navigate('/signup/payment', { 
        state: { 
          paymentFrequency: selectedPaymentFrequency,
          packageInfo: packageInfo 
        }
      });
      return true;
    } catch (error) {
      console.error("Error proceeding to payment:", error);
      setError("An error occurred while processing your selection. Please try again.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate pricing based on package info
  const getAnnualCost = () => {
    return packageInfo?.annualCost || packageInfo?.details?.cost || 540; // Default to $540 if not available
  };
  
  const getMonthlyCost = () => {
    return Math.round(getAnnualCost() / 12);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Apply Marcellus font to the entire component
  const marcellusStyle = {
    fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif",
    fontSize: "1.05rem"
  };
  
  // Show loading if currentUser is still undefined or if we're loading
  if (currentUser === undefined || loading) {
    return (
      <div className="w-full bg-gray-100" style={{
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        position: 'relative',
        ...marcellusStyle,
        minHeight: '100vh',
        paddingTop: '2rem',
        paddingBottom: '2rem'
      }}>
        <div className="w-full mx-auto px-4 sm:px-6 md:px-8 py-8 max-w-[90%] md:max-w-[80%] lg:max-w-[70%]">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
            <p className="mt-4 text-xl text-gray-600">Loading membership options...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // If currentUser is null (not authenticated), don't render anything
  if (!currentUser) {
    return null;
  }
  
  // Show error state
  if (error) {
    return (
      <div className="w-full bg-gray-100" style={{
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        position: 'relative',
        ...marcellusStyle,
        minHeight: '100vh',
        paddingTop: '2rem',
        paddingBottom: '2rem'
      }}>
        <div className="w-full mx-auto px-4 sm:px-6 md:px-8 py-8 max-w-[90%] md:max-w-[80%] lg:max-w-[70%]">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 mb-8">
            <h3 className="font-semibold mb-2 text-red-600">Error Loading Information</h3>
            <p className="text-red-700 text-lg">{error}</p>
            <p className="text-red-600 mt-2">Please try refreshing the page or contact support if this issue persists.</p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleBack}
              className="py-5 px-8 border border-gray-300 rounded-full text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.03]"
              style={marcellusStyle}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full bg-gray-100" style={{
      width: '100vw',
      marginLeft: 'calc(-50vw + 50%)',
      marginRight: 'calc(-50vw + 50%)',
      position: 'relative',
      ...marcellusStyle,
      minHeight: '100vh',
      paddingTop: '2rem',
      paddingBottom: '2rem'
    }}>
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 py-8 max-w-[90%] md:max-w-[80%] lg:max-w-[70%]">
        <div className="mb-8">
          {/* Header with package info */}
          <div className={`mb-8 transition-all duration-700 ease-in-out transform ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-2xl md:text-3xl font-bold text-[#323053] mb-6 flex flex-col sm:flex-row sm:items-center">
              <div className="flex items-center mb-2 sm:mb-0">
                <img src={alcorStar} alt="Alcor Star" className="w-8 h-8 md:w-10 md:h-10 mr-2" />
                Select your membership payment frequency
              </div>
              <span className="text-2xl md:text-3xl text-[#775684] sm:ml-4">{formatCurrency(getAnnualCost())} USD/year</span>
            </h2>
          </div>

          {/* Payment Options */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 transition-all duration-700 ease-in-out delay-150 transform ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            
            {/* Monthly Option */}
            <div 
              onClick={() => setSelectedPaymentFrequency("monthly")}
              className={`relative cursor-pointer rounded-xl border p-8 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] ${
                selectedPaymentFrequency === "monthly" 
                  ? "border-[#775684] bg-gray-50 shadow-md" 
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center justify-center" style={marcellusStyle}>
                  Monthly
                  <img src={alcorStar} alt="Alcor Star" className="w-6 h-6 ml-1" />
                </h3>
                
                <div className="mb-8">
                  <div className="text-6xl font-bold text-gray-900 mb-2">
                    {formatCurrency(getMonthlyCost())}
                  </div>
                  <p className="text-gray-600 text-lg">
                    <span className="font-semibold">USD</span> • First month
                  </p>
                  <p className="text-gray-500 text-base">
                    Renews at {formatCurrency(getMonthlyCost())} USD/month
                  </p>
                </div>
                
                <button className={`w-full py-3 px-6 rounded-full font-semibold text-lg transition-all duration-300 ${
                  selectedPaymentFrequency === "monthly"
                    ? "bg-[#775684] text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}>
                  {selectedPaymentFrequency === "monthly" ? "Selected" : "Select Monthly"}
                </button>
              </div>
            </div>
            
            {/* Quarterly Option */}
            <div 
              onClick={() => setSelectedPaymentFrequency("quarterly")}
              className={`relative cursor-pointer rounded-xl border p-8 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] ${
                selectedPaymentFrequency === "quarterly" 
                  ? "border-[#775684] bg-gray-50 shadow-md" 
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center justify-center" style={marcellusStyle}>
                  Quarterly
                  <img src={alcorStar} alt="Alcor Star" className="w-6 h-6 ml-1" />
                </h3>
                
                <div className="mb-8">
                  <div className="text-6xl font-bold text-gray-900 mb-2">
                    {formatCurrency(Math.round(getAnnualCost() / 4))}
                  </div>
                  <p className="text-gray-600 text-lg">
                    <span className="font-semibold">USD</span> • Every 3 months
                  </p>
                  <p className="text-gray-500 text-base">
                    Renews at {formatCurrency(Math.round(getAnnualCost() / 4))} USD/quarter
                  </p>
                </div>
                
                <button className={`w-full py-3 px-6 rounded-full font-semibold text-lg transition-all duration-300 ${
                  selectedPaymentFrequency === "quarterly"
                    ? "bg-[#775684] text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}>
                  {selectedPaymentFrequency === "quarterly" ? "Selected" : "Select Quarterly"}
                </button>
              </div>
            </div>
            
            {/* Annual Option */}
            <div 
              onClick={() => setSelectedPaymentFrequency("annually")}
              className={`relative cursor-pointer rounded-xl border p-8 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] ${
                selectedPaymentFrequency === "annually" 
                  ? "border-[#775684] bg-gray-50 shadow-md" 
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center justify-center" style={marcellusStyle}>
                  Annual
                  <img src={alcorStar} alt="Alcor Star" className="w-6 h-6 ml-1" />
                </h3>
                
                <div className="mb-8">
                  <div className="text-6xl font-bold text-gray-900 mb-2">
                    {formatCurrency(getAnnualCost())}
                  </div>
                  <p className="text-gray-600 text-lg">
                    <span className="font-semibold">USD</span> • Per year
                  </p>
                  <p className="text-gray-500 text-base">
                    Renews at {formatCurrency(getAnnualCost())} USD/year
                  </p>
                </div>
                
                <button className={`w-full py-3 px-6 rounded-full font-semibold text-lg transition-all duration-300 ${
                  selectedPaymentFrequency === "annually"
                    ? "bg-[#775684] text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}>
                  {selectedPaymentFrequency === "annually" ? "Selected" : "Select Annual"}
                </button>
              </div>
            </div>
          </div>
          
          {/* Description Text */}
          <div className={`text-center mb-8 transition-all duration-700 ease-in-out delay-300 transform ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-gray-600 text-xl flex items-center justify-center" style={marcellusStyle}>
              <img src={alcorStar} alt="Alcor Star" className="w-6 h-6 mr-2" />
              Choose the payment schedule that works best for you
            </p>
          </div>
        </div>
        
        {/* Navigation Buttons */}
        <div className={`flex justify-between mt-8 transition-all duration-700 ease-in-out delay-450 transform ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <button
            type="button"
            onClick={handleBack}
            className="py-5 px-8 border border-gray-300 rounded-full text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.03]"
            style={marcellusStyle}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          
          <button
            onClick={handleContinue}
            disabled={isSubmitting || !selectedPaymentFrequency}
            className={`py-5 px-8 rounded-full font-semibold text-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.03] ${
              selectedPaymentFrequency ? "bg-[#775684] text-white hover:bg-[#664573]" : "bg-gray-300 text-gray-500 cursor-not-allowed"
            } disabled:opacity-70`}
            style={marcellusStyle}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                Continue
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global animation styles */}
      <style jsx global>{`
        .transition-all {
          transition-property: all;
        }
        .duration-300 {
          transition-duration: 300ms;
        }
        .duration-700 {
          transition-duration: 700ms;
        }
        .ease-in-out {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        .delay-150 {
          transition-delay: 150ms;
        }
        .delay-300 {
          transition-delay: 300ms;
        }
        .delay-450 {
          transition-delay: 450ms;
        }
        .opacity-0 {
          opacity: 0;
        }
        .opacity-100 {
          opacity: 1;
        }
        .translate-y-0 {
          transform: translateY(0);
        }
        .translate-y-8 {
          transform: translateY(2rem);
        }
        .transform {
          transform-origin: center;
        }
        .hover\\:scale-\\[1\\.02\\]:hover {
          transform: scale(1.02);
        }
        .hover\\:scale-\\[1\\.03\\]:hover {
          transform: scale(1.03);
        }
      `}</style>
    </div>
  );
};

export default MembershipStep;