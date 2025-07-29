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
    <div className="bg-white rounded-2xl border border-gray-200 p-8 mt-10 mb-16 animate-fadeIn animation-delay-700" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
      <div className="flex flex-col gap-4 lg:gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Email Notifications</h3>
          <p className="text-sm lg:text-base text-gray-500 font-light">Get notified when new invoices are available</p>
        </div>
        
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-8 sm:items-center">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={newInvoiceAlerts}
                  onChange={(e) => onToggleNotification('newInvoice', e.target.checked)}
                  disabled={loadingNotificationSettings}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-400 rounded-full peer peer-checked:bg-[#232f4e] transition-colors"></div>
                <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
              </div>
              <span className="text-sm lg:text-base text-gray-500 font-light">New invoice alerts</span>
            </label>
            
            {SHOW_PAYMENT_FAILURE_ALERTS && (
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={paymentFailureAlerts}
                    onChange={(e) => onToggleNotification('paymentFailure', e.target.checked)}
                    disabled={loadingNotificationSettings}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-400 rounded-full peer peer-checked:bg-[#232f4e] transition-colors"></div>
                  <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                </div>
                <span className="text-sm lg:text-base text-gray-500 font-light">Payment failures</span>
              </label>
            )}
            
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm lg:text-base text-gray-500 font-light">Sending to:</p>
                {loadingNotificationSettings ? (
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-32 mt-1"></div>
                ) : (
                  <p className="font-medium text-gray-900 text-sm lg:text-base break-all">{notificationEmail}</p>
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