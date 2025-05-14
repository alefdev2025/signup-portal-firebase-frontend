// File: pages/signup/FundingStep.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useUser } from "../../contexts/UserContext";
import { getStepFormData, saveFormData } from "../../services/storage";

const FundingStep = () => {
  const navigate = useNavigate();
  const { currentUser, refreshUserProgress } = useUser();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fundingMethod: "",
    isInsurance: false,
    insuranceProvider: "",
    policyNumber: "",
    selfFundingAmount: 0,
    accountType: "",
    // Add other funding-related fields as needed
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check authentication and load saved form data
  useEffect(() => {
    const init = async () => {
      if (!currentUser) {
        // Redirect unauthenticated users back to account creation
        navigate('/signup', { replace: true });
        return;
      }
      
      try {
        // Load any saved form data for this step
        const savedData = getStepFormData("funding");
        if (savedData) {
          setFormData(savedData);
        }
        
        // Check user's progress in the database
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // If user hasn't completed previous step, redirect back
          if (userData.signupProgress < 3) {
            navigate('/signup/package', { replace: true });
            return;
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error initializing funding step:", error);
        setLoading(false);
      }
    };
    
    init();
  }, [currentUser, navigate]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear errors when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };
  
  // Handle going back to previous step
  const handleBack = () => {
    navigate('/signup/package', { replace: true });
  };
  
  // Handle form submission and proceeding to next step
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validate form data
    const newErrors = {};
    
    if (!formData.fundingMethod) {
      newErrors.fundingMethod = "Please select a funding method";
    }
    
    if (formData.fundingMethod === "insurance" && !formData.insuranceProvider) {
      newErrors.insuranceProvider = "Please enter your insurance provider";
    }
    
    if (formData.fundingMethod === "self_funded" && (!formData.selfFundingAmount || formData.selfFundingAmount <= 0)) {
      newErrors.selfFundingAmount = "Please enter a valid amount";
    }
    
    setErrors(newErrors);
    
    // If there are errors, don't proceed
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save form data locally
      saveFormData("funding", formData);
      
      // Update progress in database
      const userDocRef = doc(db, "users", currentUser.uid);
      
      await setDoc(userDocRef, {
        fundingInfo: formData, // Store the actual form data
        signupStep: "membership", // Next step
        signupProgress: 5, // Progress to step 5
        lastUpdated: new Date()
      }, { merge: true });
      
      // Refresh user progress from backend
      if (typeof refreshUserProgress === 'function') {
        await refreshUserProgress();
      }
      
      // Navigate to next step
      navigate('/signup/membership', { replace: true });
    } catch (error) {
      console.error("Error saving funding info:", error);
      setErrors(prev => ({ 
        ...prev, 
        general: "An error occurred while saving your information. Please try again." 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[#0C2340] mb-6">Funding Information</h1>
      
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
          {errors.general}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        {/* Funding Method Selection */}
        <div>
          <label className="block text-gray-800 font-medium mb-2">Funding Method *</label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="fundingMethod"
                value="insurance"
                checked={formData.fundingMethod === "insurance"}
                onChange={handleChange}
                className="mr-2 h-5 w-5 text-[#6f2d74]"
              />
              <span>Life Insurance</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="fundingMethod"
                value="self_funded"
                checked={formData.fundingMethod === "self_funded"}
                onChange={handleChange}
                className="mr-2 h-5 w-5 text-[#6f2d74]"
              />
              <span>Self-Funded</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="fundingMethod"
                value="other"
                checked={formData.fundingMethod === "other"}
                onChange={handleChange}
                className="mr-2 h-5 w-5 text-[#6f2d74]"
              />
              <span>Other / Not Sure Yet</span>
            </label>
          </div>
          {errors.fundingMethod && (
            <p className="text-red-500 text-sm mt-1">{errors.fundingMethod}</p>
          )}
        </div>
        
        {/* Conditional Fields Based on Selection */}
        {formData.fundingMethod === "insurance" && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium">Insurance Details</h3>
            
            <div>
              <label htmlFor="insuranceProvider" className="block text-gray-700 font-medium mb-1">
                Insurance Provider *
              </label>
              <input
                type="text"
                id="insuranceProvider"
                name="insuranceProvider"
                value={formData.insuranceProvider}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#6f2d74] focus:border-[#6f2d74]"
                placeholder="e.g. MetLife, State Farm"
              />
              {errors.insuranceProvider && (
                <p className="text-red-500 text-sm mt-1">{errors.insuranceProvider}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="policyNumber" className="block text-gray-700 font-medium mb-1">
                Policy Number (optional)
              </label>
              <input
                type="text"
                id="policyNumber"
                name="policyNumber"
                value={formData.policyNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#6f2d74] focus:border-[#6f2d74]"
                placeholder="Your policy number if available"
              />
            </div>
          </div>
        )}
        
        {formData.fundingMethod === "self_funded" && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium">Self-Funding Details</h3>
            
            <div>
              <label htmlFor="selfFundingAmount" className="block text-gray-700 font-medium mb-1">
                Approximate Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="selfFundingAmount"
                  name="selfFundingAmount"
                  value={formData.selfFundingAmount}
                  onChange={handleChange}
                  className="w-full pl-8 px-4 py-2 border border-gray-300 rounded-md focus:ring-[#6f2d74] focus:border-[#6f2d74]"
                  placeholder="Enter amount"
                  min="0"
                />
              </div>
              {errors.selfFundingAmount && (
                <p className="text-red-500 text-sm mt-1">{errors.selfFundingAmount}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="accountType" className="block text-gray-700 font-medium mb-1">
                Account Type (optional)
              </label>
              <select
                id="accountType"
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#6f2d74] focus:border-[#6f2d74]"
              >
                <option value="">Select an account type</option>
                <option value="checking">Checking Account</option>
                <option value="savings">Savings Account</option>
                <option value="investment">Investment Account</option>
                <option value="trust">Trust</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handleBack}
            className="py-3 px-6 bg-white border border-gray-300 rounded-full text-gray-700 font-semibold hover:bg-gray-50"
          >
            Back
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-3 px-8 bg-[#6f2d74] rounded-full text-white font-semibold hover:bg-[#5f1c64] disabled:opacity-70 flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                Next
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FundingStep;