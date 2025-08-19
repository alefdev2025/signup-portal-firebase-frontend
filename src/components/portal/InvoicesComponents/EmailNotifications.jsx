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
     <div className="flex flex-col gap-4 sm:gap-5 2xl:gap-6 lg:gap-6 lg:flex-row lg:items-center lg:justify-between">
       <div className="flex-shrink-0">
         <h3 className="text-base sm:text-lg 2xl:text-xl font-semibold text-gray-900 mb-1">Email Notifications</h3>
         <p className="text-[11px] sm:text-xs 2xl:text-sm lg:text-sm sm:lg:text-base 2xl:lg:text-lg text-gray-500 font-light">Get notified when new invoices are available</p>
       </div>
       
       <div className="flex flex-col gap-4 sm:gap-5 2xl:gap-6 lg:flex-row lg:items-center lg:gap-8">
         <div className="flex flex-col gap-3 sm:gap-4 2xl:gap-5 sm:flex-row sm:gap-8 sm:items-center">
           <label className="flex items-center gap-2 sm:gap-3 2xl:gap-4 cursor-pointer group">
             <div className="relative">
               <input 
                 type="checkbox" 
                 checked={newInvoiceAlerts}
                 onChange={(e) => onToggleNotification('newInvoice', e.target.checked)}
                 disabled={loadingNotificationSettings}
                 className="sr-only peer" 
               />
               <div className="w-9 h-5 sm:w-10 sm:h-5.5 2xl:w-11 2xl:h-6 bg-gray-400 rounded-full peer peer-checked:bg-[#232f4e] transition-colors"></div>
               <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 sm:w-4.5 sm:h-4.5 2xl:w-5 2xl:h-5 rounded-full transition-transform peer-checked:translate-x-4 sm:peer-checked:translate-x-4.5 2xl:peer-checked:translate-x-5 shadow-sm"></div>
             </div>
             <span className="text-[11px] sm:text-xs 2xl:text-sm lg:text-sm sm:lg:text-base 2xl:lg:text-lg text-gray-500 font-light">New invoice alerts</span>
           </label>
           
           {SHOW_PAYMENT_FAILURE_ALERTS && (
             <label className="flex items-center gap-2 sm:gap-3 2xl:gap-4 cursor-pointer group">
               <div className="relative">
                 <input 
                   type="checkbox" 
                   checked={paymentFailureAlerts}
                   onChange={(e) => onToggleNotification('paymentFailure', e.target.checked)}
                   disabled={loadingNotificationSettings}
                   className="sr-only peer" 
                 />
                 <div className="w-9 h-5 sm:w-10 sm:h-5.5 2xl:w-11 2xl:h-6 bg-gray-400 rounded-full peer peer-checked:bg-[#232f4e] transition-colors"></div>
                 <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 sm:w-4.5 sm:h-4.5 2xl:w-5 2xl:h-5 rounded-full transition-transform peer-checked:translate-x-4 sm:peer-checked:translate-x-4.5 2xl:peer-checked:translate-x-5 shadow-sm"></div>
               </div>
               <span className="text-[11px] sm:text-xs 2xl:text-sm lg:text-sm sm:lg:text-base 2xl:lg:text-lg text-gray-500 font-light">Payment failures</span>
             </label>
           )}
           
           <div className="flex items-center gap-2 sm:gap-3 2xl:gap-4">
             <div>
               <p className="text-[11px] sm:text-xs 2xl:text-sm lg:text-sm sm:lg:text-base 2xl:lg:text-lg text-gray-500 font-light">Sending to:</p>
               {loadingNotificationSettings ? (
                 <div className="h-4 sm:h-4.5 2xl:h-5 bg-gray-200 rounded animate-pulse w-28 sm:w-32 2xl:w-36 mt-1"></div>
               ) : (
                 <p className="font-medium text-gray-900 text-[11px] sm:text-xs 2xl:text-sm lg:text-sm sm:lg:text-base 2xl:lg:text-lg break-all">{notificationEmail}</p>
               )}
             </div>
           </div>
         </div>
       </div>
     </div>
   </div>
 );
};

export default EmailNotifications;