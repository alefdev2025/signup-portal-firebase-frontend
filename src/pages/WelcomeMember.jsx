import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from "../contexts/UserContext";

// Import services
import { getContactInfo } from "../services/contact";
import membershipService from "../services/membership";
import fundingService from "../services/funding";
import { getMembershipCost } from "../services/pricing";

// Import logo assets
import whiteALogoNoText from "../assets/images/alcor-white-logo-no-text.png";
import alcorStar from "../assets/images/alcor-star.png";

export default function WelcomeMember() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Loading user data for welcome page...");
        
        // Load all user data in parallel
        const [contactResult, membershipResult, fundingResult, pricingResult] = await Promise.allSettled([
          getContactInfo(),
          membershipService.getMembershipInfo(),
          fundingService.getUserFundingInfo(),
          getMembershipCost()
        ]);

        // Process contact data
        let contactData = null;
        if (contactResult.status === 'fulfilled' && contactResult.value.success) {
          contactData = contactResult.value.contactInfo;
        }

        // Process membership data
        let membershipData = null;
        if (membershipResult.status === 'fulfilled' && membershipResult.value.success) {
          membershipData = membershipResult.value.data.membershipInfo;
        }

        // Process funding data
        let fundingData = null;
        if (fundingResult.status === 'fulfilled' && fundingResult.value.success) {
          fundingData = fundingResult.value.data;
        }

        // Process pricing data
        let pricingData = null;
        if (pricingResult.status === 'fulfilled' && pricingResult.value?.success) {
          pricingData = {
            membershipCost: pricingResult.value.membershipCost || 540,
            age: pricingResult.value.age,
            annualDues: pricingResult.value.annualDues
          };
        }

        // Get package data from funding service
        let packageData = null;
        try {
          const packageResult = await fundingService.getPackageInfoForFunding();
          if (packageResult.success) {
            packageData = {
              packageType: packageResult.packageType,
              preservationType: packageResult.preservationType,
              preservationEstimate: packageResult.preservationEstimate,
              annualCost: packageResult.annualCost
            };
          }
        } catch (err) {
          console.error("Error loading package info:", err);
        }

        setUserData({
          contactData: contactData || {},
          membershipData: membershipData || {},
          fundingData: fundingData || {},
          packageData: packageData || {},
          pricingData: pricingData || {}
        });

      } catch (err) {
        console.error("Error loading user data:", err);
        setError("Failed to load your membership details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Helper functions
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPreservationTypeText = (type) => {
    switch(type) {
      case 'neuro': return 'Neuropreservation';
      case 'wholebody': return 'Whole Body Preservation';
      case 'basic': return 'Basic Membership';
      default: return 'Not Selected';
    }
  };

  const getPaymentFrequencyText = (frequency) => {
    switch(frequency) {
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'annually': return 'Annual';
      case 'lifetime': return 'Lifetime';
      default: return 'Annual';
    }
  };

  const getFundingMethodText = (method) => {
    switch(method) {
      case 'insurance': return 'Life Insurance';
      case 'prepay': return 'Prepayment';
      case 'later': return 'Decide Later';
      default: return 'funding to be determined';
    }
  };

  // Calculate payment amount
  const calculatePaymentAmount = () => {
    const baseCost = userData?.pricingData?.membershipCost || userData?.packageData?.annualCost || 540;
    const frequency = userData?.membershipData?.paymentFrequency || 'annually';
    
    if (frequency === 'monthly') {
      return Math.round(baseCost / 12);
    } else if (frequency === 'quarterly') {
      return Math.round(baseCost / 4);
    }
    return baseCost;
  };

  // Get next steps based on user selections
  const getNextSteps = () => {
    const steps = [];
    const fundingMethod = userData?.fundingData?.fundingMethod || userData?.fundingData?.method;
    const preservationType = userData?.packageData?.preservationType;

    // Always include membership activation step
    steps.push({
      title: "Membership Activation",
      description: "Your membership will be activated within 1-2 business days. You'll receive login credentials for the member portal.",
      icon: "👤"
    });

    // Add steps based on preservation type and funding method
    if (preservationType !== 'basic') {
      if (fundingMethod === 'insurance') {
        steps.push({
          title: "Insurance Setup",
          description: "Our team will contact you to help set up or assign life insurance for your preservation funding.",
          icon: "🛡️"
        });
      } else if (fundingMethod === 'prepay') {
        steps.push({
          title: "Prepayment Options",
          description: "We'll reach out with details on prepayment plans and options for your preservation costs.",
          icon: "💰"
        });
      } else if (fundingMethod === 'later') {
        steps.push({
          title: "Funding Consultation",
          description: "A funding specialist will contact you to discuss your options for preservation funding.",
          icon: "📞"
        });
      }
    }

    // Always include paperwork step
    steps.push({
      title: "Complete Documentation",
      description: "Finalize any remaining legal documents and emergency contact information in your member portal.",
      icon: "📋"
    });

    return steps;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Top Header */}
        <div className="bg-gradient-to-br from-[#0a1629] to-[#1e2650] relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1629]/90 via-transparent to-[#1e2650]/70"></div>
          
          <div className="relative z-10 py-8 px-8">
            <div className="w-full flex justify-between items-center">
              <img src={whiteALogoNoText} alt="Alcor Logo" className="h-20" />
              <h1 className="text-xl sm:text-2xl font-semibold text-white">Welcome to Alcor</h1>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0a1629] border-t-transparent mb-6 mx-auto"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Membership Details</h3>
            <p className="text-gray-600">Preparing your welcome information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Top Header */}
        <div className="bg-gradient-to-br from-[#0a1629] to-[#1e2650] relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1629]/90 via-transparent to-[#1e2650]/70"></div>
          
          <div className="relative z-10 py-8 px-8">
            <div className="w-full flex justify-between items-center">
              <img src={whiteALogoNoText} alt="Alcor Logo" className="h-20" />
              <h1 className="text-xl sm:text-2xl font-semibold text-white">Welcome to Alcor</h1>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-2xl mx-auto p-8">
            <div className="text-red-500 text-6xl mb-6">⚠️</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">{error}</h3>
            <button 
              onClick={() => window.location.reload()}
              className="bg-[#0a1629] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#1e2650] transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Header */}
      <div className="bg-gradient-to-br from-[#0a1629] to-[#1e2650] relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1629]/90 via-transparent to-[#1e2650]/70"></div>
        
        <div className="relative z-10 py-8 px-8">
          <div className="w-full flex justify-between items-center">
            <img src={whiteALogoNoText} alt="Alcor Logo" className="h-20" />
            <h1 className="text-xl sm:text-2xl font-semibold text-white">Welcome to Alcor</h1>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 sm:px-12 md:px-8 py-12">
        
        {/* Payment Confirmation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden max-w-5xl mx-auto mb-12">
          <div className="bg-gradient-to-r from-[#0a1629] to-[#1e2650] p-8">
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-4 mb-4 mx-auto w-16 h-16 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Payment Confirmation</h2>
              <p className="text-xl text-white/90 leading-relaxed">
                You've only been charged for your membership today ({formatCurrency(calculatePaymentAmount())}). No preservation or insurance fees are applied at this stage. We'll reach out regarding your funding setup soon.
              </p>
            </div>
          </div>
          
          {/* What You Got - Connected white section */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-[#0a1629] mb-6 text-center">Your Package</h2>
            <div className="text-center">
              <p className="text-gray-600 text-lg leading-relaxed">
                You've selected {getPreservationTypeText(userData?.packageData?.preservationType)} with {getFundingMethodText(userData?.fundingData?.fundingMethod || userData?.fundingData?.method)} funding.
              </p>
            </div>
          </div>
        </div>

        {/* Two Wide Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 max-w-5xl mx-auto">
          
          {/* Member Portal Access */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 w-full min-h-[400px] flex flex-col">
            <div className="bg-gradient-to-r from-[#0a1629] to-[#1e2650] p-8">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Member Portal Access
                <img src={alcorStar} alt="" className="h-6 md:h-7 ml-2" />
              </h2>
            </div>
            
            <div className="p-6 md:p-8 flex-1 flex flex-col">
              <div className="flex-1 text-center">
                <p className="text-gray-600 text-lg leading-relaxed">
                  Your secure member portal provides access to your membership details, legal documents, emergency contact information, and exclusive member resources.
                </p>
              </div>

              <button 
                onClick={() => navigate('/member-portal')}
                className="py-3 sm:py-4 px-4 sm:px-8 rounded-full font-semibold text-base sm:text-lg bg-[#0a1629] hover:bg-[#1e2650] text-white flex items-center justify-center transition-all duration-300 shadow-sm mt-8 mx-auto"
              >
                <img src={alcorStar} alt="" className="h-5 mr-2" />
                Access Portal
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 w-full min-h-[400px] flex flex-col">
            <div className="bg-gradient-to-r from-[#0a1629] to-[#1e2650] p-8">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                What Happens Next
                <img src={alcorStar} alt="" className="h-6 md:h-7 ml-2" />
              </h2>
            </div>
            
            <div className="p-6 md:p-8 flex-1 flex flex-col">
              <div className="flex-1 text-center">
                <p className="text-gray-600 text-lg leading-relaxed">
                  You will hear from Alcor about next steps, but if you have any questions about any part of the process, please feel free to reach out to us.
                </p>
              </div>

              <button 
                onClick={() => navigate('/help')}
                className="py-3 sm:py-4 px-4 sm:px-8 rounded-full font-semibold text-base sm:text-lg bg-[#0a1629] hover:bg-[#1e2650] text-white flex items-center justify-center transition-all duration-300 shadow-sm mt-8 mx-auto"
              >
                <img src={alcorStar} alt="" className="h-5 mr-2" />
                Contact Us
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center">
          <div className="text-gray-500 text-sm">
            <p>© 2025 Alcor Life Extension Foundation. All rights reserved.</p>
            <p className="mt-2">7895 E Acoma Dr, Scottsdale, AZ 85260</p>
          </div>
        </div>
      </div>
    </div>
  );
}