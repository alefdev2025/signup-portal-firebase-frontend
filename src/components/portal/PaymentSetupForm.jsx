// File: components/portal/PaymentSetupForm.jsx
import React, { useState, useMemo } from 'react';
import { savePaymentMethod } from '../../services/paymentMethods';
import { syncStripeCustomerToNetSuite } from '../../services/payment';
import { toast } from 'react-hot-toast';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { getCountries } from './utils/countries';

const CARD_ELEMENT_OPTIONS = {
   style: {
     base: {
       fontSize: '16px',
       color: '#424770',
       fontFamily: 'system-ui, -apple-system, sans-serif',
       '::placeholder': {
         color: '#aab7c4',
       },
     },
     invalid: {
       color: '#dc3545',
       iconColor: '#dc3545'
     },
     complete: {
       iconColor: '#28a745'
     }
   },
   hidePostalCode: true, // Since you're collecting it separately
 };

// Payment Setup Form Component with international support
const PaymentSetupForm = ({ onSuccess, onCancel, autopayOnly = false, customerId }) => {
   const stripe = useStripe();
   const elements = useElements();
   const { salesforceCustomer, currentUser } = useMemberPortal();
   const [cardError, setCardError] = useState(null);
   
   const [isProcessing, setIsProcessing] = useState(false);
   const [error, setError] = useState(null);
   const [cardComplete, setCardComplete] = useState(false);
   const [stripeCustomerId, setStripeCustomerId] = useState(null);
   
   // Form fields - MUST BE DEFINED BEFORE USING IN selectedCountry
   const [cardholderName, setCardholderName] = useState(salesforceCustomer?.name || '');
   const [email, setEmail] = useState(currentUser?.email || salesforceCustomer?.email || '');
   const [phone, setPhone] = useState(salesforceCustomer?.phone || '');
   const [billingAddress, setBillingAddress] = useState({
     line1: salesforceCustomer?.mailingAddress?.street || '',
     line2: '',
     city: salesforceCustomer?.mailingAddress?.city || '',
     state: salesforceCustomer?.mailingAddress?.state || '',
     postal_code: salesforceCustomer?.mailingAddress?.postalCode || '',
     country: salesforceCustomer?.mailingAddress?.country || 'US'
   });
 
   // Get countries list and selected country
   const countries = useMemo(() => getCountries(), []);
   const selectedCountry = countries.find(c => c.code === billingAddress.country) || countries[0];
 
   const handleCardChange = (event) => {
       setCardComplete(event.complete);
       
       if (event.error) {
         setCardError(event.error.message);
         // Don't set the main error here - only on submit
       } else {
         setCardError(null);
       }
       
       // Clear any submit errors when user starts typing again
       if (error && event.error?.message !== error) {
         setError(null);
       }
     };
 
   const handleSubmit = async (e) => {
     e.preventDefault();
     
     if (!stripe || !elements) {
       return;
     }
   
     // Validate required fields
     if (!cardholderName.trim()) {
       setError('Please enter the cardholder name');
       return;
     }
     
     if (!email.trim()) {
       setError('Please enter your email address');
       return;
     }
     
     // Basic email validation
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!emailRegex.test(email)) {
       setError('Please enter a valid email address');
       return;
     }
   
     if (!cardComplete) {
       setError('Please complete your card information');
       return;
     }
     
     // Validate address fields
     if (!billingAddress.line1.trim() || !billingAddress.city.trim() || !billingAddress.postal_code.trim()) {
       setError('Please complete all required billing address fields');
       return;
     }
     
     // Only require state for countries that have states
     if (selectedCountry.hasStates && !billingAddress.state.trim()) {
       setError(`Please enter your ${selectedCountry.stateLabel.toLowerCase()}`);
       return;
     }
   
     setIsProcessing(true);
     setError(null);
   
     try {
       // Build billing details object
       const billingDetails = {
         name: cardholderName.trim(),
         email: email.trim(),
         phone: phone.trim() || null,
         address: {
           line1: billingAddress.line1.trim(),
           city: billingAddress.city.trim(),
           postal_code: billingAddress.postal_code.trim(),
           country: billingAddress.country
         }
       };
       
       // Add optional fields
       if (billingAddress.line2.trim()) {
         billingDetails.address.line2 = billingAddress.line2.trim();
       }
       
       // Only add state if it exists (not all countries have states)
       if (billingAddress.state.trim()) {
         billingDetails.address.state = billingAddress.state.trim();
       }
       
       // Create payment method
       const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
         type: 'card',
         card: elements.getElement(CardElement),
         billing_details: billingDetails
       });
   
       if (pmError) {
         throw new Error(pmError.message);
       }
   
       console.log('Payment method created:', paymentMethod.id);
       
       // Save the payment method
       const saveResult = await savePaymentMethod({ 
         paymentMethodId: paymentMethod.id,
         customerInfo: {
           email: email.trim(),
           phone: phone.trim() || null,
           name: cardholderName.trim()
         }
       });
       
       if (!saveResult.success) {
         throw new Error(saveResult.error || 'Failed to save payment method');
       }
       
       console.log('Payment method saved, Stripe customer ID:', saveResult.customerId);
       
       // ✅ SYNC STRIPE CUSTOMER ID TO NETSUITE
       if (saveResult.customerId && customerId) {
         try {
           console.log('🔄 Syncing Stripe Customer ID to NetSuite...');
           console.log('NetSuite Customer ID:', customerId);
           console.log('Stripe Customer ID:', saveResult.customerId);
           console.log('Payment Method ID:', paymentMethod.id);
           
           const syncResult = await syncStripeCustomerToNetSuite(
             customerId,
             saveResult.customerId,
             paymentMethod.id
           );
           
           if (syncResult.success) {
             console.log('✅ Stripe Customer ID synced to NetSuite');
             setStripeCustomerId(saveResult.customerId);
             
             if (syncResult.verified) {
               console.log('✅ Sync verified in NetSuite');
             }
           } else {
             console.error('❌ Failed to sync to NetSuite:', syncResult.error);
             // Don't show error toast - card is still saved
           }
           
         } catch (syncError) {
           console.error('❌ Failed to sync to NetSuite:', syncError);
           // Silent fail - don't interrupt the user experience
         }
       }
       
       toast.success('Payment method saved successfully!');
       
       // Call success callback
       onSuccess({
         success: true,
         autopayEnabled: false
       });
       
     } catch (error) {
       console.error('Error setting up payment method:', error);
       setError(error.message || 'Failed to set up payment method. Please try again.');
     } finally {
       setIsProcessing(false);
     }
   };
 
   return (
     <form onSubmit={handleSubmit} className="space-y-4">
       {/* Cardholder Name */}
       <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">
           Cardholder Name <span className="text-red-500">*</span>
         </label>
         <input
           type="text"
           required
           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
           value={cardholderName}
           onChange={(e) => setCardholderName(e.target.value)}
           placeholder="John Doe"
         />
       </div>
 
       {/* Email */}
       <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">
           Email Address <span className="text-red-500">*</span>
         </label>
         <input
           type="email"
           required
           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
           value={email}
           onChange={(e) => setEmail(e.target.value)}
           placeholder="john@example.com"
         />
         <p className="text-xs text-gray-500 mt-1">Receipt will be sent to this email</p>
       </div>
 
       {/* Phone (Optional) */}
       <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">
           Phone Number
         </label>
         <input
           type="tel"
           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
           value={phone}
           onChange={(e) => setPhone(e.target.value)}
           placeholder="+1 (555) 123-4567"
         />
       </div>
 
       {/* Billing Address Section */}
       <div className="border-t pt-4">
         <h4 className="text-sm font-medium text-gray-900 mb-3">Billing Address</h4>
         
         {/* Country */}
         <div className="mb-3">
           <label className="block text-sm font-medium text-gray-700 mb-1">
             Country <span className="text-red-500">*</span>
           </label>
           <select
             required
             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
             value={billingAddress.country}
             onChange={(e) => {
               setBillingAddress({...billingAddress, country: e.target.value, state: ''});
             }}
           >
             {countries.map(country => (
               <option key={country.code} value={country.code}>
                 {country.name}
               </option>
             ))}
           </select>
         </div>
         
         {/* Street Address */}
         <div className="mb-3">
           <label className="block text-sm font-medium text-gray-700 mb-1">
             Street Address <span className="text-red-500">*</span>
           </label>
           <input
             type="text"
             required
             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
             value={billingAddress.line1}
             onChange={(e) => setBillingAddress({...billingAddress, line1: e.target.value})}
             placeholder="123 Main Street"
           />
         </div>
 
         {/* Address Line 2 (Optional) */}
         <div className="mb-3">
           <label className="block text-sm font-medium text-gray-700 mb-1">
             Apartment, suite, etc.
           </label>
           <input
             type="text"
             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
             value={billingAddress.line2}
             onChange={(e) => setBillingAddress({...billingAddress, line2: e.target.value})}
             placeholder="Apt 4B"
           />
         </div>
 
         {/* City and State/Province */}
         <div className="grid grid-cols-2 gap-3 mb-3">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               City <span className="text-red-500">*</span>
             </label>
             <input
               type="text"
               required
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
               value={billingAddress.city}
               onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})}
               placeholder={selectedCountry.code === 'GB' ? 'London' : 'New York'}
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               {selectedCountry.stateLabel} {selectedCountry.hasStates && <span className="text-red-500">*</span>}
             </label>
             <input
               type="text"
               required={selectedCountry.hasStates}
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
               value={billingAddress.state}
               onChange={(e) => setBillingAddress({...billingAddress, state: e.target.value})}
               placeholder={selectedCountry.code === 'GB' ? 'Greater London' : selectedCountry.code === 'CA' ? 'ON' : 'NY'}
               maxLength={selectedCountry.code === 'US' || selectedCountry.code === 'CA' ? '2' : '50'}
             />
           </div>
         </div>
 
         {/* Postal Code */}
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">
             {selectedCountry.zipLabel} <span className="text-red-500">*</span>
           </label>
           <input
             type="text"
             required
             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
             value={billingAddress.postal_code}
             onChange={(e) => setBillingAddress({...billingAddress, postal_code: e.target.value})}
             placeholder={selectedCountry.zipPlaceholder || '10001'}
           />
         </div>
       </div>
 
       {/* Card Details */}
       <div className="border-t pt-4">
       <label className="block text-sm font-medium text-gray-700 mb-1">
           Card Details <span className="text-red-500">*</span>
       </label>
       <div className={`px-3 py-2 border rounded-lg transition-colors ${
           cardError ? 'border-red-300 bg-red-50' : 'border-gray-300'
       } focus-within:ring-2 focus-within:ring-[#6b5b7e] focus-within:border-transparent`}>
           <CardElement 
           options={CARD_ELEMENT_OPTIONS} 
           onChange={handleCardChange}
           />
       </div>
       {cardError && (
           <p className="text-xs text-red-600 mt-1">{cardError}</p>
       )}
       </div>
 
       {autopayOnly && (
         <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
           <p className="text-sm text-blue-800">
             This card will be used for automatic invoice payments
           </p>
         </div>
       )}
 
       {error && (
         <div className="bg-red-50 border border-red-200 rounded-lg p-3">
           <p className="text-sm text-red-800">{error}</p>
         </div>
       )}
 
       <div className="flex gap-3 pt-2">
         <button
           type="button"
           onClick={onCancel}
           className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
           disabled={isProcessing}
         >
           Cancel
         </button>
         <button
           type="submit"
           disabled={!stripe || isProcessing || !cardComplete || !cardholderName || !email}
           className="flex-1 bg-[#6b5b7e] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#5a4a6d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
         >
           {isProcessing ? 'Processing...' : (autopayOnly ? 'Save & Enable Autopay' : 'Save Card')}
         </button>
       </div>
     </form>
   );
 };

export default PaymentSetupForm;