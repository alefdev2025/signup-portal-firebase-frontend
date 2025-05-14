// File: pages/signup/MembershipStep.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useUser } from "../../contexts/UserContext";
import { getStepFormData, saveFormData } from "../../services/storage";

const MembershipStep = () => {
  const navigate = useNavigate();
  const { currentUser, refreshUserProgress } = useUser();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    membershipType: "",
    agreeToTerms: false,
    emergencyContact: {
      name: "",
      relationship: "",
      email: "",
      phone: ""
    },
    // Add other membership-related fields as needed
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
        const savedData = getStepFormData("membership");
        if (savedData) {
          setFormData(savedData);
        }
        
        // Check user's progress in the database
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // If user hasn't completed previous step, redirect back
          if (userData.signupProgress < 4) {
            navigate('/signup/funding', { replace: true });
            return;
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error initializing membership step:", error);
        setLoading(false);
      }
    };
    
    init();
  }, [currentUser, navigate]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested emergency contact fields
    if (name.startsWith("emergency_")) {
      const field = name.replace("emergency_", "");
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear errors when field is changed
    if (name.startsWith("emergency_")) {
      const field = name.replace("emergency_", "");
      if (errors[`emergencyContact.${field}`]) {
        setErrors(prev => ({ 
          ...prev, 
          [`emergencyContact.${field}`]: "" 
        }));
      }
    } else if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };
  
  // Handle going back to previous step
  const handleBack = () => {
    navigate('/signup/funding', { replace: true });
  };
  
  // Handle form submission and completing the signup process
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validate form data
    const newErrors = {};
    
    if (!formData.membershipType) {
      newErrors.membershipType = "Please select a membership type";
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the membership terms";
    }
    
    // Validate emergency contact info
    if (!formData.emergencyContact.name) {
      newErrors["emergencyContact.name"] = "Emergency contact name is required";
    }
    
    if (!formData.emergencyContact.relationship) {
      newErrors["emergencyContact.relationship"] = "Relationship is required";
    }
    
    if (!formData.emergencyContact.email && !formData.emergencyContact.phone) {
      newErrors["emergencyContact.email"] = "Please provide either email or phone";
      newErrors["emergencyContact.phone"] = "Please provide either email or phone";
    }
    
    setErrors(newErrors);
    
    // If there are errors, don't proceed
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save form data locally
      saveFormData("membership", formData);
      
      // Update progress in database and mark signup as complete
      const userDocRef = doc(db, "users", currentUser.uid);
      
      await setDoc(userDocRef, {
        membershipInfo: formData, // Store the actual form data
        signupStep: "completed", // Mark as completed
        signupProgress: 6, // Final step completed (index 5 + 1)
        signupCompleted: true,
        signupCompletedDate: new Date(),
        lastUpdated: new Date()
      }, { merge: true });
      
      // Refresh user progress from backend
      if (typeof refreshUserProgress === 'function') {
        await refreshUserProgress();
      }
      
      // Navigate to completion summary
      navigate('/summary', { replace: true });
    } catch (error) {
      console.error("Error completing signup:", error);
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
      <h1 className="text-2xl font-bold text-[#0C2340] mb-6">Membership Information</h1>
      
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
          {errors.general}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        {/* Membership Type Selection */}
        <div>
          <label className="block text-gray-800 font-medium mb-2">Membership Type *</label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="membershipType"
                value="standard"
                checked={formData.membershipType === "standard"}
                onChange={handleChange}
                className="mr-2 h-5 w-5 text-[#6f2d74]"
              />
              <span>Standard Membership</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="membershipType"
                value="premium"
                checked={formData.membershipType === "premium"}
                onChange={handleChange}
                className="mr-2 h-5 w-5 text-[#6f2d74]"
              />
              <span>Premium Membership</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="membershipType"
                value="platinum"
                checked={formData.membershipType === "platinum"}
                onChange={handleChange}
                className="mr-2 h-5 w-5 text-[#6f2d74]"
              />
              <span>Platinum Membership</span>
            </label>
          </div>
          {errors.membershipType && (
            <p className="text-red-500 text-sm mt-1">{errors.membershipType}</p>
          )}
        </div>
        
        {/* Emergency Contact Information */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-lg mb-4">Emergency Contact Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="emergency_name" className="block text-gray-700 font-medium mb-1">
                Name *
              </label>
              <input
                type="text"
                id="emergency_name"
                name="emergency_name"
                value={formData.emergencyContact.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#6f2d74] focus:border-[#6f2d74]"
                placeholder="Full name"
              />
              {errors["emergencyContact.name"] && (
                <p className="text-red-500 text-sm mt-1">{errors["emergencyContact.name"]}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="emergency_relationship" className="block text-gray-700 font-medium mb-1">
                Relationship *
              </label>
              <input
                type="text"
                id="emergency_relationship"
                name="emergency_relationship"
                value={formData.emergencyContact.relationship}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#6f2d74] focus:border-[#6f2d74]"
                placeholder="e.g. Spouse, Child, Sibling"
              />
              {errors["emergencyContact.relationship"] && (
                <p className="text-red-500 text-sm mt-1">{errors["emergencyContact.relationship"]}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="emergency_email" className="block text-gray-700 font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                id="emergency_email"
                name="emergency_email"
                value={formData.emergencyContact.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#6f2d74] focus:border-[#6f2d74]"
                placeholder="Email address"
              />
              {errors["emergencyContact.email"] && (
                <p className="text-red-500 text-sm mt-1">{errors["emergencyContact.email"]}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="emergency_phone" className="block text-gray-700 font-medium mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="emergency_phone"
                name="emergency_phone"
                value={formData.emergencyContact.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#6f2d74] focus:border-[#6f2d74]"
                placeholder="Phone number"
              />
              {errors["emergencyContact.phone"] && (
                <p className="text-red-500 text-sm mt-1">{errors["emergencyContact.phone"]}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Terms and Conditions */}
        <div className="border-t border-gray-200 pt-6">
          <label className="flex items-start">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="mt-1 mr-3 h-5 w-5 text-[#6f2d74] border-gray-300 rounded focus:ring-[#6f2d74]"
            />
            <span className="text-gray-700">
              I agree to the Membership Terms and Conditions, and I understand that
              by completing this application, I am applying for membership with Alcor Cryonics.
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="text-red-500 text-sm mt-1 ml-8">{errors.agreeToTerms}</p>
          )}
        </div>
        
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
                Complete Signup
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MembershipStep;