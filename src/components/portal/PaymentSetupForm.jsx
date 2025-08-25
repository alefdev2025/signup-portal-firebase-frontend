import React, { useState, useMemo } from 'react';
import { savePaymentMethod } from '../../services/paymentMethods';
import { syncStripeCustomerToNetSuite } from '../../services/payment';
import { toast } from 'react-hot-toast';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { getCountries } from './countries'; // Import from adjacent file
import alcorLogo from '../../assets/images/navy-alcor-logo.png';

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
const PaymentSetupForm = ({ onSuccess, onCancel, customerId }) => {
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
         email: email.trim() || null, // Email is now optional
         phone: phone.trim() || null, // Phone is optional
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
             saveResult.customerId
             //paymentMethod.id
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
       {/* Billing Address Section */}
       <div className="border-t pt-4">
         <h4 className="text-sm font-medium text-gray-900 mb-3">Billing Address</h4>
         
         {/* Country and Street Address - Side by side */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Country <span className="text-red-500">*</span>
             </label>
             <select
               required
               className="w-full px-3 py-2 border border-[#c5c5c5] rounded-lg focus:ring-1 focus:ring-[#6b5b7e] focus:border-[#6b5b7e] focus:outline-none"
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
           
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Street Address <span className="text-red-500">*</span>
             </label>
             <input
               type="text"
               required
               className="w-full px-3 py-2 border border-[#c5c5c5] rounded-lg focus:ring-1 focus:ring-[#6b5b7e] focus:border-[#6b5b7e] focus:outline-none"
               value={billingAddress.line1}
               onChange={(e) => setBillingAddress({...billingAddress, line1: e.target.value})}
               placeholder="123 Main Street"
             />
           </div>
         </div>
         
         {/* City and Apt - Side by side */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               City <span className="text-red-500">*</span>
             </label>
             <input
               type="text"
               required
               className="w-full px-3 py-2 border border-[#c5c5c5] rounded-lg focus:ring-1 focus:ring-[#6b5b7e] focus:border-[#6b5b7e] focus:outline-none"
               value={billingAddress.city}
               onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})}
               placeholder={selectedCountry.code === 'GB' ? 'London' : 'New York'}
             />
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Apt, suite, etc.
             </label>
             <input
               type="text"
               className="w-full px-3 py-2 border border-[#c5c5c5] rounded-lg focus:ring-1 focus:ring-[#6b5b7e] focus:border-[#6b5b7e] focus:outline-none"
               value={billingAddress.line2}
               onChange={(e) => setBillingAddress({...billingAddress, line2: e.target.value})}
               placeholder="Apt 4B"
             />
           </div>
         </div>
         
         {/* State and Postal Code - Side by side */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               {selectedCountry.stateLabel} {selectedCountry.hasStates && <span className="text-red-500">*</span>}
             </label>
             <input
               type="text"
               required={selectedCountry.hasStates}
               className="w-full px-3 py-2 border border-[#c5c5c5] rounded-lg focus:ring-1 focus:ring-[#6b5b7e] focus:border-[#6b5b7e] focus:outline-none"
               value={billingAddress.state}
               onChange={(e) => setBillingAddress({...billingAddress, state: e.target.value})}
               placeholder={selectedCountry.code === 'GB' ? 'Greater London' : selectedCountry.code === 'CA' ? 'ON' : 'NY'}
               maxLength={selectedCountry.code === 'US' || selectedCountry.code === 'CA' ? '2' : '50'}
             />
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               {selectedCountry.zipLabel} <span className="text-red-500">*</span>
             </label>
             <input
               type="text"
               required
               className="w-full px-3 py-2 border border-[#c5c5c5] rounded-lg focus:ring-1 focus:ring-[#6b5b7e] focus:border-[#6b5b7e] focus:outline-none"
               value={billingAddress.postal_code}
               onChange={(e) => setBillingAddress({...billingAddress, postal_code: e.target.value})}
               placeholder={selectedCountry.zipPlaceholder || '10001'}
             />
           </div>
         </div>
       </div>
 
       {/* Card Details - Half width on desktop */}
       <div className="border-t pt-4">
         <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Information</h4>
         
         {/* Cardholder Name and Card Details - Side by side on desktop */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Cardholder Name */}
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Cardholder Name <span className="text-red-500">*</span>
             </label>
             <input
               type="text"
               required
               className="w-full px-3 py-2 border border-[#c5c5c5] rounded-lg focus:ring-1 focus:ring-[#6b5b7e] focus:border-[#6b5b7e] focus:outline-none"
               value={cardholderName}
               onChange={(e) => setCardholderName(e.target.value)}
               placeholder="John Doe"
             />
           </div>
     
           {/* Card Details */}
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
                 Card Number <span className="text-red-500">*</span>
             </label>
             <div className={`px-3 py-3 border rounded-lg transition-colors ${
                 cardError ? 'border-red-300 bg-red-50' : 'border-[#c5c5c5]'
             } focus-within:ring-1 focus-within:ring-[#6b5b7e] focus-within:border-[#6b5b7e]`}>
                 <CardElement 
                 options={CARD_ELEMENT_OPTIONS} 
                 onChange={handleCardChange}
                 />
             </div>
             {cardError && (
                 <p className="text-xs text-red-600 mt-1">{cardError}</p>
             )}
           </div>
         </div>
       </div>
 
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
           disabled={!stripe || isProcessing || !cardComplete || !cardholderName}
           className="flex-1 bg-[#6b5b7e] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#5a4a6d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
         >
           {isProcessing ? 'Processing...' : 'Save Card'}
         </button>
       </div>
     </form>
   );
 };

export default PaymentSetupForm;