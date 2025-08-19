import React from 'react';

// Feature flag to show/hide payment failure alerts
const SHOW_PAYMENT_FAILURE_ALERTS = false;

const EmailNotifications = ({ 
 newInvoiceAlerts, 
 paymentFailureAlerts, 
 notificationEmail, 
 loadingNotificationSettings,
 onToggleNotification 
}) => {
 return (
   <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 2xl:p-10 mt-6 mb-16 animate-fadeIn animation-delay-700" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
     {/* Mobile Layout */}
     <div className="lg:hidden">
       <div className="mb-4">
         <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Email Notifications</h3>
         <p className="text-[11px] sm:text-xs text-gray-500 font-light">Get notified when new invoices are available</p>
       </div>
       
       <div className="space-y-4">
         <label className="flex items-center justify-between cursor-pointer">
           <span className="text-[11px] sm:text-xs text-gray-500 font-light">New invoice alerts</span>
           <div className="relative">
             <input 
               type="checkbox" 
               checked={newInvoiceAlerts}
               onChange={(e) => onToggleNotification('newInvoice', e.target.checked)}
               disabled={loadingNotificationSettings}
               className="sr-only peer" 
             />
             <div className="w-9 h-5 sm:w-10 sm:h-5.5 bg-gray-400 rounded-full peer peer-checked:bg-[#232f4e] transition-colors"></div>
             <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full transition-transform peer-checked:translate-x-4 sm:peer-checked:translate-x-4.5 shadow-sm"></div>
           </div>
         </label>
         
         {SHOW_PAYMENT_FAILURE_ALERTS && (
           <label className="flex items-center justify-between cursor-pointer">
             <span className="text-[11px] sm:text-xs text-gray-500 font-light">Payment failures</span>
             <div className="relative">
               <input 
                 type="checkbox" 
                 checked={paymentFailureAlerts}
                 onChange={(e) => onToggleNotification('paymentFailure', e.target.checked)}
                 disabled={loadingNotificationSettings}
                 className="sr-only peer" 
               />
               <div className="w-9 h-5 sm:w-10 sm:h-5.5 bg-gray-400 rounded-full peer peer-checked:bg-[#232f4e] transition-colors"></div>
               <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full transition-transform peer-checked:translate-x-4 sm:peer-checked:translate-x-4.5 shadow-sm"></div>
             </div>
           </label>
         )}
         
         <div>
           <p className="text-[11px] sm:text-xs text-gray-500 font-light">Sending to:</p>
           {loadingNotificationSettings ? (
             <div className="h-4 sm:h-4.5 bg-gray-200 rounded animate-pulse w-32 mt-1"></div>
           ) : (
             <p className="font-medium text-gray-900 text-[11px] sm:text-xs break-all">{notificationEmail}</p>
           )}
         </div>
       </div>
     </div>

     {/* Desktop Layout - Completely Different Approach */}
     <div className="hidden lg:flex lg:items-center lg:justify-between">
       <div className="flex items-center gap-8">
         <div>
           <h3 className="text-lg 2xl:text-xl font-semibold text-gray-900 mb-1">Email Notifications</h3>
           <p className="text-sm 2xl:text-base text-gray-500 font-light">Get notified when new invoices are available</p>
         </div>
         
         <div className="flex items-center gap-3">
           <p className="text-sm 2xl:text-base text-gray-500 font-light">Sending to:</p>
           {loadingNotificationSettings ? (
             <div className="h-5 2xl:h-6 bg-gray-200 rounded animate-pulse w-36 2xl:w-40"></div>
           ) : (
             <p className="font-medium text-gray-900 text-sm 2xl:text-base">{notificationEmail}</p>
           )}
         </div>
       </div>
       
       <div className="flex items-center gap-8">
         <label className="flex items-center gap-3 cursor-pointer">
           <span className="text-sm 2xl:text-base text-gray-500 font-light">New invoice alerts</span>
           <div className="relative">
             <input 
               type="checkbox" 
               checked={newInvoiceAlerts}
               onChange={(e) => onToggleNotification('newInvoice', e.target.checked)}
               disabled={loadingNotificationSettings}
               className="sr-only peer" 
             />
             <div className="w-11 h-6 2xl:w-12 2xl:h-7 bg-gray-400 rounded-full peer peer-checked:bg-[#232f4e] transition-colors"></div>
             <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 2xl:w-6 2xl:h-6 rounded-full transition-transform peer-checked:translate-x-5 2xl:peer-checked:translate-x-5 shadow-sm"></div>
           </div>
         </label>
         
         {SHOW_PAYMENT_FAILURE_ALERTS && (
           <label className="flex items-center gap-3 cursor-pointer">
             <span className="text-sm 2xl:text-base text-gray-500 font-light">Payment failures</span>
             <div className="relative">
               <input 
                 type="checkbox" 
                 checked={paymentFailureAlerts}
                 onChange={(e) => onToggleNotification('paymentFailure', e.target.checked)}
                 disabled={loadingNotificationSettings}
                 className="sr-only peer" 
               />
               <div className="w-11 h-6 2xl:w-12 2xl:h-7 bg-gray-400 rounded-full peer peer-checked:bg-[#232f4e] transition-colors"></div>
               <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 2xl:w-6 2xl:h-6 rounded-full transition-transform peer-checked:translate-x-5 2xl:peer-checked:translate-x-5 shadow-sm"></div>
             </div>
           </label>
         )}
       </div>
     </div>
   </div>
 );
};

export default EmailNotifications;