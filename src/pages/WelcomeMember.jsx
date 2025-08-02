// File: WelcomeMember.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import membershipService from '../services/membership';
import { auth } from '../services/firebase';

// Import logo and image assets
import whiteALogoNoText from "../assets/images/alcor-white-logo-no-text.png";
import dewars2 from "../assets/images/dewars2.jpg";
import alcorStar from "../assets/images/alcor-star.png";

// Font family from MembershipCompletionSteps
const SYSTEM_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export default function WelcomeMember() {
 const navigate = useNavigate();
 const { user, refreshUserProgress } = useUser();
 const [isLoading, setIsLoading] = useState(true);
 const [membershipData, setMembershipData] = useState(null);
 const [error, setError] = useState(null);
 const [isConvertingToPortal, setIsConvertingToPortal] = useState(false);

 // Animation styles from MembershipCompletionSteps
 const fadeInStyle = {
   opacity: 0,
   animation: 'fadeIn 0.5s ease-in-out forwards'
 };

 const getAnimationDelay = (index) => ({
   animationDelay: `${index * 0.1}s`
 });

 // Fetch membership data on mount
 useEffect(() => {
   const loadMembershipData = async () => {
     try {
       setIsLoading(true);
       setError(null);

       // Get completion status which includes readyForDocuSign data
       const completionResult = await membershipService.checkMembershipCompletionStatus();
       
       if (completionResult.success) {
         console.log("✅ Membership data loaded:", completionResult.data);
         
         // Also try to get payment status
         try {
           const paymentStatus = await membershipService.getPaymentStatus();
           if (paymentStatus.success && paymentStatus.data.exists) {
             // Merge payment data
             completionResult.data.readyForPayment = paymentStatus.data;
             completionResult.data.paymentCompleted = paymentStatus.data.paymentStatus?.status === 'completed';
           }
         } catch (paymentError) {
           console.warn("Could not fetch payment data:", paymentError);
         }
         
         setMembershipData(completionResult.data);
       } else {
         throw new Error(completionResult.error || 'Failed to load membership data');
       }
     } catch (error) {
       console.error("❌ Error loading membership data:", error);
       setError("Unable to load your membership details. Please try again.");
     } finally {
       setIsLoading(false);
     }
   };

   loadMembershipData();
 }, []);

 // Handle converting user to portal user
 const handleGoToPortal = async () => {
   try {
     setIsConvertingToPortal(true);
     setError(null);

     // Call backend to convert user to portal user
     const token = await auth.currentUser.getIdToken();
     
     const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app'}/api/user/convert-to-portal`, {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         completedSignup: true,
         membershipType: membershipData?.paymentCompleted ? 'standard' : 'basic',
         timestamp: new Date().toISOString()
       })
     });

     const result = await response.json();
     
     if (!response.ok || !result.success) {
       throw new Error(result.error || 'Failed to activate portal access');
     }

     console.log("✅ Portal access activated");
     
     // Refresh user context if available
     if (refreshUserProgress) {
       await refreshUserProgress();
     }

     // Navigate to portal
     navigate('/portal-home');
     
   } catch (error) {
     console.error("❌ Error converting to portal user:", error);
     setError("Failed to activate portal access. Please try again or contact support.");
   } finally {
     setIsConvertingToPortal(false);
   }
 };

 // Format currency
 const formatCurrency = (amount) => {
   if (!amount && amount !== 0) return "N/A";
   return new Intl.NumberFormat('en-US', {
     style: 'currency',
     currency: 'USD',
     minimumFractionDigits: 0,
     maximumFractionDigits: 0
   }).format(amount);
 };

 // Format date
 const formatDate = (dateString) => {
   if (!dateString) return "N/A";
   return new Date(dateString).toLocaleDateString('en-US', {
     year: 'numeric',
     month: 'long',
     day: 'numeric'
   });
 };

 // Determine membership status
 const getMembershipStatus = () => {
   if (!membershipData) return { type: 'basic', hasApplication: false };
   
   const hasApplication = membershipData.paymentCompleted || 
                         membershipData.readyForPayment?.paymentStatus?.status === 'completed';
   
   return {
     type: hasApplication ? 'standard' : 'basic',
     hasApplication: hasApplication
   };
 };

 // Get cryopreservation type
 const getCryopreservationType = () => {
   // Check if we have data loaded first
   if (!membershipData) return null;
   
   // The backend returns membershipType directly in the completion data
   const preservationType = membershipData?.membershipType || 
                           membershipData?.readyForDocuSign?.membershipDetails?.preservationType || 
                           membershipData?.readyForPayment?.membershipInfo?.preservationType ||
                           membershipData?.preservationType;
   
   if (!preservationType) return null;
   
   // Normalize the preservation type string
   const normalizedType = preservationType.toLowerCase();
   if (normalizedType.includes('neuro')) return 'Neuropreservation';
   if (normalizedType.includes('whole') || normalizedType.includes('body')) return 'Whole Body';
   if (normalizedType === 'basic') return null; // Don't show preservation type for basic members
   
   return preservationType; // Return as-is if not recognized
 };

 // Loading state
 if (isLoading) {
   return (
     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
       <div className="text-center">
         <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#775684]"></div>
         <p className="mt-4 text-lg text-gray-600" style={{ fontFamily: SYSTEM_FONT }}>Loading your membership details...</p>
       </div>
     </div>
   );
 }

 const membershipStatus = getMembershipStatus();
 const cryopreservationType = getCryopreservationType();

 return (
   <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" style={{ fontFamily: SYSTEM_FONT }}>
     {/* Top Header with Dewars Image */}
     <div className="relative h-64 md:h-72 overflow-hidden">
       {/* Background Image */}
       <div 
         className="absolute inset-0 bg-cover bg-center"
         style={{ backgroundImage: `url(${dewars2})` }}
       >
         <div className="absolute inset-0 bg-gradient-to-b from-[#0a1629]/80 via-[#0a1629]/60 to-gray-900/90"></div>
       </div>
       
       {/* Logo Overlay */}
       <div className="relative z-10 py-4 px-8 pt-12">
         <div className="w-full flex justify-center">
           <img src={whiteALogoNoText} alt="Alcor Logo" className="h-16" />
         </div>
       </div>
       
       {/* Welcome Text Overlay */}
       <div className="absolute inset-0 flex items-center justify-center z-10 pt-16">
         <div className="text-center text-white">
           <h1 className="text-4xl font-light mb-2">Welcome to Alcor!</h1>
           <p className="text-xl opacity-90 flex items-center justify-center">
             You are now a Basic Member<img src={alcorStar} alt="" className="h-5 ml-1" />
           </p>
         </div>
       </div>
     </div>
     
     {/* Main Content */}
     <div className="max-w-4xl mx-auto px-8 py-12">
       
       {/* Error Alert */}
       {error && (
         <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" style={fadeInStyle}>
           <div className="flex">
             <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
             </svg>
             <p className="text-red-700" style={{ fontSize: '14px' }}>{error}</p>
           </div>
         </div>
       )}

       {/* Status Message Card */}
       <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm" style={{...fadeInStyle, ...getAnimationDelay(0)}}>
         <div className="flex items-start">
           <div className="flex-shrink-0 mr-4">
             <div className="bg-gradient-to-br from-[#162740] to-[#785683] p-3 rounded-lg">
               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
             </div>
           </div>
           <div className="flex-1">
             <h3 className="text-gray-900 font-medium mb-2" style={{ fontSize: '18px' }}>
               {membershipStatus.hasApplication ? 'Cryopreservation Application in Progress' : 'Basic Membership Active'}
             </h3>
             <p className="text-gray-600" style={{ fontSize: '15px' }}>
               {membershipStatus.hasApplication ? (
                 <>Your cryopreservation application is in progress. You can complete the remaining steps in the Member Portal at any time.</>
               ) : (
                 <>As a Basic Member, you have access to member resources and can upgrade to cryopreservation coverage at any time through the Member Portal.</>
               )}
             </p>
           </div>
         </div>
       </div>

       {/* Membership Summary with Icons */}
       <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-8" style={{...fadeInStyle, ...getAnimationDelay(1)}}>
         <div className="flex items-center mb-4">
           <div className="p-2.5 rounded-lg mr-3" style={{ 
             background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' 
           }}>
             <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
             </svg>
           </div>
                        <h3 className="text-gray-900 font-medium" style={{ fontSize: '18px' }}>Your Membership Summary</h3>
         </div>
         
         <div className="space-y-3">
           {/* Member Info with Icon */}
           <div className="flex items-center py-2 border-b border-gray-200">
             <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
             </svg>
             <span className="text-gray-600 flex-1" style={{ fontSize: '15px' }}>Member Name:</span>
             <span className="font-medium text-gray-900">
               {(() => {
                 // First try to get from readyForDocuSign data
                 const readyForDocuSign = membershipData?.readyForDocuSign || membershipData;
                 if (readyForDocuSign?.memberName) {
                   return readyForDocuSign.memberName;
                 }
                 // Then try user context
                 if (user?.firstName || user?.lastName) {
                   return `${user.firstName || ''} ${user.lastName || ''}`.trim();
                 }
                 // Try email as fallback
                 if (user?.email) {
                   return user.email.split('@')[0];
                 }
                 return 'Member';
               })()}
             </span>
           </div>

           {/* Membership Type with Icon */}
           <div className="flex items-center py-2 border-b border-gray-200">
             <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
             </svg>
             <span className="text-gray-600 flex-1" style={{ fontSize: '15px' }}>Membership Type:</span>
             <span className="font-medium text-gray-900">Basic Member</span>
           </div>

           {/* Cryopreservation Application Status - Only show if they applied */}
           {membershipStatus.hasApplication && (
             <div className="flex items-center py-2 border-b border-gray-200">
               <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
               <span className="text-gray-600 flex-1" style={{ fontSize: '15px' }}>Cryopreservation Application:</span>
               <span className="font-medium text-blue-600">In Progress</span>
             </div>
           )}

           {/* Cryopreservation Type - Only show if they have selected a type */}
           {cryopreservationType && (
             <div className="flex items-center py-2 border-b border-gray-200">
               <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
               </svg>
               <span className="text-gray-600 flex-1" style={{ fontSize: '15px' }}>Preservation Type:</span>
               <span className="font-medium text-gray-900">{cryopreservationType}</span>
             </div>
           )}

           {/* Annual Dues with Icon - Only show if they have dues */}
           {(membershipData?.totalDue || membershipData?.readyForPayment?.paymentDetails?.totalDue) && (
             <div className="flex items-center py-2 border-b border-gray-200">
               <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <span className="text-gray-600 flex-1" style={{ fontSize: '15px' }}>Annual Dues:</span>
               <span className="font-medium text-gray-900">
                 {formatCurrency(membershipData?.totalDue || membershipData?.readyForPayment?.paymentDetails?.totalDue)}
               </span>
             </div>
           )}

           {/* ICE Discount Applied with Icon */}
           {(membershipData?.iceCode || membershipData?.readyForDocuSign?.iceCode) && (
             <div className="flex items-center py-2 border-b border-gray-200">
               <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
               </svg>
               <span className="text-gray-600 flex-1" style={{ fontSize: '15px' }}>ICE Discount:</span>
               <span className="font-medium text-green-600">25% Applied</span>
             </div>
           )}

           {/* Member Status */}
           <div className="flex items-center py-2 border-b border-gray-200">
             <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <span className="text-gray-600 flex-1" style={{ fontSize: '15px' }}>Status:</span>
             <span className="font-medium text-green-600">Active</span>
           </div>

           {/* Join Date with Icon */}
           <div className="flex items-center py-2">
             <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
             <span className="text-gray-600 flex-1" style={{ fontSize: '15px' }}>Join Date:</span>
             <span className="font-medium text-gray-900">
               {formatDate(new Date().toISOString())}
             </span>
           </div>
         </div>
       </div>

       {/* Next Steps Card with Icon */}
       <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-sm" style={{...fadeInStyle, ...getAnimationDelay(2)}}>
         <div className="flex items-start">
           <div className="flex-shrink-0 mr-4">
             <div className="p-2.5 rounded-lg" style={{ 
               background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' 
             }}>
               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
               </svg>
             </div>
           </div>
           <div className="flex-1">
             <h4 className="text-gray-900 font-medium mb-3" style={{ fontSize: '16px' }}>Next Steps</h4>
             <div className="space-y-3">
               {membershipStatus.hasApplication ? (
                 <>
                   <div className="flex items-start">
                     <svg className="w-4 h-4 text-[#775684] mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                     </svg>
                     <span className="text-gray-700" style={{ fontSize: '14px' }}>Access the Member Portal to complete your cryopreservation application</span>
                   </div>
                   <div className="flex items-start">
                     <svg className="w-4 h-4 text-[#775684] mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                     </svg>
                     <span className="text-gray-700" style={{ fontSize: '14px' }}>Review and complete any remaining documentation</span>
                   </div>
                   <div className="flex items-start">
                     <svg className="w-4 h-4 text-[#775684] mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                     </svg>
                     <span className="text-gray-700" style={{ fontSize: '14px' }}>Download your membership materials</span>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="flex items-start">
                     <svg className="w-4 h-4 text-[#775684] mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                     </svg>
                     <span className="text-gray-700" style={{ fontSize: '14px' }}>Explore member resources in the Member Portal</span>
                   </div>
                   <div className="flex items-start">
                     <svg className="w-4 h-4 text-[#775684] mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                     </svg>
                     <span className="text-gray-700" style={{ fontSize: '14px' }}>Consider upgrading to cryopreservation coverage</span>
                   </div>
                   <div className="flex items-start">
                     <svg className="w-4 h-4 text-[#775684] mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                     </svg>
                     <span className="text-gray-700" style={{ fontSize: '14px' }}>Join member forums and stay updated with Alcor news</span>
                   </div>
                   <div className="flex items-start">
                     <svg className="w-4 h-4 text-[#775684] mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                     </svg>
                     <span className="text-gray-700" style={{ fontSize: '14px' }}>Download your Basic Member materials</span>
                   </div>
                 </>
               )}
             </div>
           </div>
         </div>
       </div>

       {/* Action Buttons */}
       <div className="flex flex-col sm:flex-row gap-4 justify-center" style={{...fadeInStyle, ...getAnimationDelay(3)}}>
         {/* Primary Button - Go to Portal */}
         <button
           onClick={handleGoToPortal}
           disabled={isConvertingToPortal}
           className={`py-3 px-8 rounded-full font-medium transition-all duration-300 shadow-md hover:shadow-lg ${
             isConvertingToPortal
               ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
               : 'bg-[#775684] text-white hover:bg-[#664573] hover:translate-x-[2px]'
           }`}
         >
           {isConvertingToPortal ? (
             <span className="flex items-center">
               <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Activating Portal Access...
             </span>
           ) : (
             <span className="flex items-center">
               <img src={alcorStar} alt="" className="h-4 mr-2" />
               Go to Member Portal
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010 1.414z" clipRule="evenodd" />
               </svg>
             </span>
           )}
         </button>

         {/* Secondary Button - Return Home */}
         <button
           onClick={() => navigate('/')}
           className="py-3 px-8 bg-[#1e293b] text-white rounded-full font-medium hover:bg-[#0f172a] transition-all duration-300 shadow-md hover:shadow-lg"
         >
           <span className="flex items-center">
             <img src={alcorStar} alt="" className="h-4 mr-2" />
             Return to Homepage
           </span>
         </button>
       </div>

       {/* Support Information with Icon */}
       <div className="text-center mt-8" style={{...fadeInStyle, ...getAnimationDelay(4)}}>
         <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 inline-block">
           <div className="flex items-center text-gray-600" style={{ fontSize: '14px' }}>
             <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
             </svg>
             <span>Need assistance? Contact us at{' '}
               <a href="mailto:info@alcor.org" className="text-[#775684] hover:underline">info@alcor.org</a>
               {' '}or call 623-432-7775
             </span>
           </div>
         </div>
       </div>
     </div>
   </div>
 );
}

// Add global styles
if (typeof document !== 'undefined') {
 const globalStyles = document.createElement('style');
 globalStyles.innerHTML = `
   @keyframes fadeIn {
     from { opacity: 0; transform: translateY(10px); }
     to { opacity: 1; transform: translateY(0); }
   }
 `;
 
 if (!document.head.querySelector('style[data-welcome-member-styles]')) {
   globalStyles.setAttribute('data-welcome-member-styles', 'true');
   document.head.appendChild(globalStyles);
 }
}