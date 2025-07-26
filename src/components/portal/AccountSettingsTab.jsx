import React, { useState, useEffect } from 'react';
import { Check, Sparkles, AlertCircle } from 'lucide-react';
import Switch from 'react-switch';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { settingsApi } from '../../services/settingsApi';
import alcorStar from '../../assets/images/alcor-yellow-star.png';
import FloatingFooter from './FloatingFooter'; 
// Import the new icon components
import { IconWrapper, BellIcon, ShieldIcon, iconStyle } from './iconStyle';

// Backend API call stubs - to be implemented later
const backendApi = {
 // Called when media notifications are toggled
 updateMediaNotifications: async (enabled) => {
   console.log(`Backend stub: updateMediaNotifications called with enabled=${enabled}`);
   // TODO: Implement actual backend call
   // Example: return await fetch('/api/settings/media-notifications', { method: 'PUT', body: JSON.stringify({ enabled }) });
   return Promise.resolve({ success: true });
 },

 // Called when staff messages are toggled
 updateStaffMessages: async (enabled) => {
   console.log(`Backend stub: updateStaffMessages called with enabled=${enabled}`);
   // TODO: Implement actual backend call
   // Example: return await fetch('/api/settings/staff-messages', { method: 'PUT', body: JSON.stringify({ enabled }) });
   return Promise.resolve({ success: true });
 },

 // Called when two-factor authentication is toggled
 updateTwoFactorAuth: async (enabled) => {
   console.log(`Backend stub: updateTwoFactorAuth called with enabled=${enabled}`);
   // TODO: Implement actual backend call
   // Example: return await fetch('/api/settings/2fa', { method: 'PUT', body: JSON.stringify({ enabled }) });
   return Promise.resolve({ success: true });
 },

 // Called when settings are restored to defaults
 restoreDefaultSettings: async () => {
   console.log('Backend stub: restoreDefaultSettings called');
   // TODO: Implement actual backend call
   // Example: return await fetch('/api/settings/restore-defaults', { method: 'POST' });
   return Promise.resolve({ success: true });
 }
};

const SettingsTab = () => {
 const { salesforceContactId } = useMemberPortal();
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [settings, setSettings] = useState({
   receiveMediaNotifications: false,
   receiveStaffMessages: true,
   twoFactorEnabled: false
 });
 const [animatingStars, setAnimatingStars] = useState({});

 // GLOBAL STYLE SETTING - Set to false for original style (different widths, square, thin outline)
 const USE_PILL_STYLE = true;

 // Add Helvetica font with lighter weights
 useEffect(() => {
   const style = document.createElement('style');
   style.innerHTML = `
     @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');
     
     .settings-tab * {
       font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
     }
     .settings-tab p,
     .settings-tab span:not(.section-title-text),
     .settings-tab div {
       font-weight: 300 !important;
     }
     .settings-tab .font-bold,
     .settings-tab .font-semibold {
       font-weight: 600 !important;
     }
     .settings-tab h1 {
       font-weight: 500 !important;
       letter-spacing: -0.02em !important;
     }
     .settings-tab h2,
     .settings-tab h3,
     .settings-tab h4 {
       font-weight: 400 !important;
       letter-spacing: -0.01em !important;
     }
     @media (max-width: 640px) {
       .settings-tab .card-title {
         font-weight: 600 !important;
       }
     }
     .settings-tab .section-subtitle {
       font-weight: 300 !important;
       letter-spacing: 0.05em !important;
     }
     @media (min-width: 640px) {
       .settings-tab .section-title-text {
         font-weight: 400 !important;
         letter-spacing: -0.01em;
         color: #374151 !important;
       }
     }
     .settings-tab .fade-in {
       animation: fadeIn 0.8s ease-out;
     }
     .settings-tab .slide-in {
       animation: slideIn 0.8s ease-out;
     }
     .settings-tab .slide-in-delay-1 {
       animation: slideIn 0.8s ease-out 0.1s both;
     }
     .settings-tab .slide-in-delay-2 {
       animation: slideIn 0.8s ease-out 0.25s both;
     }
     .settings-tab .slide-in-delay-3 {
       animation: slideIn 0.8s ease-out 0.4s both;
     }
     @keyframes fadeIn {
       from {
         opacity: 0;
       }
       to {
         opacity: 1;
       }
     }
     @keyframes slideIn {
       from {
         opacity: 0;
         transform: translateY(20px);
       }
       to {
         opacity: 1;
         transform: translateY(0);
       }
     }
     @keyframes haloPulse {
       0% {
         box-shadow: 0 0 0 0 rgba(55, 65, 81, 0.4);
       }
       70% {
         box-shadow: 0 0 0 10px rgba(55, 65, 81, 0);
       }
       100% {
         box-shadow: 0 0 0 0 rgba(55, 65, 81, 0);
       }
     }
     @keyframes shimmer {
       0% { background-position: -200% 0; }
       100% { background-position: 200% 0; }
     }
     @keyframes fadeInUp {
       from {
         opacity: 0;
         transform: translateY(10px);
       }
       to {
         opacity: 1;
         transform: translateY(0);
       }
     }
     @keyframes subtleFadeIn {
       from {
         opacity: 0;
       }
       to {
         opacity: 1;
       }
     }
     @keyframes gentleSlideIn {
       from {
         opacity: 0;
         transform: translateY(8px);
       }
       to {
         opacity: 1;
         transform: translateY(0);
       }
     }
     .animate-fadeInUp {
       opacity: 0;
       animation: fadeInUp 0.5s ease-out forwards;
     }
     .animate-subtleFadeIn {
       opacity: 0;
       animation: subtleFadeIn 0.6s ease-out forwards;
     }
     .animate-gentleSlideIn {
       opacity: 0;
       animation: gentleSlideIn 0.4s ease-out forwards;
     }
     .custom-switch-handle {
       background-color: #374151 !important;
     }
     .custom-switch-on-handle .react-switch-handle {
       background-color: white !important;
       box-shadow: 0 2px 4px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1) !important;
     }
     .custom-switch-on-handle-pulse .react-switch-handle {
       background-color: white !important;
       box-shadow: 0 2px 4px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1) !important;
       animation: haloPulse 0.9s ease-out !important;
     }
     .custom-switch-off-handle .react-switch-handle {
       background-color: white !important;
       box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06) !important;
     }
     .custom-switch-off-handle .react-switch-bg {
       background-color: #e5e7eb !important;
     }
     .settings-tab .status-badge,
     .settings-tab .status-badge span {
       font-weight: 500 !important;
       letter-spacing: 0.08em !important;
       font-size: 0.6875rem !important;
       text-transform: uppercase !important;
     }
     /* Initial states for animated elements */
     .settings-tab [class*="animate-"] {
       will-change: opacity, transform;
     }
     .settings-list-item {
       transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
       position: relative;
       overflow: hidden;
     }
     .settings-list-item::before {
       content: '';
       position: absolute;
       top: 0;
       left: -100%;
       width: 100%;
       height: 100%;
       background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
       transition: left 0.6s ease;
     }
     .professional-card {
       box-shadow: 4px 6px 12px rgba(0, 0, 0, 0.08);
       transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
       background: #ffffff;
       border-radius: 1rem;
     }
     @media (max-width: 767px) {
       .professional-card {
         box-shadow: 4px 6px 12px rgba(0, 0, 0, 0.08);
       }
     }
     .professional-card:hover {
       box-shadow: 4px 6px 12px rgba(0, 0, 0, 0.08);
       transform: translateY(-2px);
     }
     @media (max-width: 767px) {
       .professional-card:hover {
         box-shadow: 4px 6px 12px rgba(0, 0, 0, 0.08);
       }
     }
     .luxury-divider {
       height: 1px;
       background: linear-gradient(to right, transparent, #d1d5db 20%, #d1d5db 80%, transparent);
     }
     @media (max-width: 640px) {
       .luxury-divider {
         background: linear-gradient(to right, transparent 5%, #d1d5db 15%, #d1d5db 85%, transparent 95%);
       }
     }
     .icon-luxury {
       position: relative;
       overflow: hidden;
     }
     .icon-luxury::after {
       content: '';
       position: absolute;
       top: -50%;
       left: -50%;
       width: 200%;
       height: 200%;
       background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
       transform: rotate(45deg);
       transition: all 0.6s;
       opacity: 0;
     }
     .professional-card:hover .icon-luxury::after {
       opacity: 1;
       animation: shimmer 1.5s ease;
     }
     .premium-text {
       background: linear-gradient(135deg, #000 0%, #333 100%);
       -webkit-background-clip: text;
       -webkit-text-fill-color: transparent;
       background-clip: text;
     }
     .settings-description {
       font-weight: 300 !important;
       line-height: 1.6 !important;
       color: #6b7280 !important;
     }
     .settings-list-item h3 {
       font-weight: 500 !important;
       color: #1f2937 !important;
     }
     .settings-list-item p {
       font-weight: 300 !important;
       color: #6b7280 !important;
     }
   `;
   document.head.appendChild(style);
   
   return () => {
     document.head.removeChild(style);
   };
 }, []);

 useEffect(() => {
   // Remove the scroll to top functionality that might be interfering
   fetchUserSettings();
   
 }, [salesforceContactId]);

 const fetchUserSettings = async () => {
   try {
     const userSettings = await settingsApi.getSettings();
     setSettings(userSettings);
   } catch (error) {
     console.error('Error fetching settings:', error);
     // Set defaults if fetch fails
     setSettings({
       receiveMediaNotifications: false,
       receiveStaffMessages: true,
       twoFactorEnabled: false
     });
   } finally {
     setLoading(false);
   }
 };

 const handleToggle = async (settingName) => {
   const newValue = !settings[settingName];
   const newSettings = {
     ...settings,
     [settingName]: newValue
   };
   
   // Update UI immediately for better UX
   setSettings(newSettings);
   
   // Trigger pulse animation if turning on
   if (newValue) {
     setAnimatingStars(prev => ({ ...prev, [settingName]: true }));
     setTimeout(() => {
       setAnimatingStars(prev => ({ ...prev, [settingName]: false }));
     }, 900);
   }
 };

 const handleRestoreDefaults = async () => {
   const defaultSettings = {
     receiveMediaNotifications: false,
     receiveStaffMessages: true,
     twoFactorEnabled: false
   };
   
   setSaving(true);
   
 };

 // Custom Switch component with pulse animation
 const CustomSwitch = ({ checked, onChange, settingName, color = "#374151" }) => (
   <div className="relative">
     <Switch
       checked={checked}
       onChange={onChange}
       onColor={color}
       offColor="#e5e7eb"
       uncheckedIcon={false}
       checkedIcon={false}
       height={22}
       width={44}
       handleDiameter={18}
       activeBoxShadow="0 0 0 0"
       onHandleColor="#ffffff"
       offHandleColor="#ffffff"
       className={checked ? (animatingStars[settingName] ? "custom-switch-on-handle-pulse" : "custom-switch-on-handle") : "custom-switch-off-handle"}
     />
   </div>
 );

 if (loading) {
   return (
     <div className="settings-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4">
       <div className="h-8"></div>
       <div className="px-4 md:px-0">
         <div className="animate-pulse">
           <div className="mb-12">
             <div className="h-10 bg-gray-100 w-48 mb-3"></div>
             <div className="h-4 bg-gray-50 w-72"></div>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {[1, 2].map((i) => (
               <div key={i} className="bg-white border border-gray-100 p-8 rounded-2xl">
                 <div className="h-6 bg-gray-100 w-32 mb-8 rounded"></div>
                 <div className="space-y-6">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-gray-50 rounded-lg"></div>
                     <div className="flex-1">
                       <div className="h-4 bg-gray-100 w-32 mb-2 rounded"></div>
                       <div className="h-3 bg-gray-50 w-full rounded"></div>
                     </div>
                     <div className="w-11 h-5 bg-gray-100 rounded-full"></div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
         </div>
       </div>
     </div>
   );
 }

 return (
   <div className="settings-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4">
     {/* Small top padding */}
     <div className="h-8"></div>
     
     {/* Header */}
     <div className="mb-12 px-4 md:px-0 hidden sm:block animate-subtleFadeIn">
       <h1 className="text-[1.375rem] md:text-[1.325rem] font-medium text-gray-900 mb-2 leading-tight animate-gentleSlideIn">Account Settings</h1>
       <p className="text-gray-400 text-xs md:text-sm tracking-wide uppercase section-subtitle animate-gentleSlideIn" style={{ animationDelay: '0.1s' }}>Manage your preferences and security</p>
     </div>

     {/* Settings Grid */}
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-0">
       {/* Notifications Card */}
       <div className="professional-card bg-white border border-gray-200 rounded-2xl overflow-hidden animate-fadeInUp" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)', animationDelay: '0.2s', opacity: 0 }}>
         <div className="px-8 py-6">
           <div className="flex items-center gap-4 mb-8">
             <IconWrapper className="icon-luxury" size="large" color="navy">
               <BellIcon className={iconStyle.iconSizeLarge} />
             </IconWrapper>
             <h2 className="text-lg font-normal text-gray-800 card-title">Notifications</h2>
           </div>

           <div className="space-y-6">
             <div className="settings-list-item p-5 bg-white border border-gray-100 rounded-xl animate-gentleSlideIn" style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05)', animationDelay: '0.3s' }}>
               <div className="flex items-start justify-between gap-4">
                 <div className="flex-1">
                   <h3 className="text-base font-medium text-gray-800 mb-1">Media Updates</h3>
                   <p className="text-xs text-gray-500 leading-relaxed settings-description">
                     Get email notifications for new announcements, newsletters and podcasts
                   </p>
                   <div className="mt-3 animate-subtleFadeIn" style={{ minHeight: '32px', animationDelay: '0.5s' }}>
                     {settings.receiveMediaNotifications && (
                       <div className="inline-flex items-center">
                         <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 border border-gray-200 rounded-lg">
                           <Check className="w-3.5 h-3.5 text-gray-600" strokeWidth={2} />
                           <span className="text-[0.6875rem] tracking-widest text-gray-700 font-medium status-badge">
                             ACTIVE
                           </span>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
                 <CustomSwitch
                   checked={settings.receiveMediaNotifications}
                   onChange={() => handleToggle('receiveMediaNotifications')}
                   settingName="receiveMediaNotifications"
                 />
               </div>
             </div>

             <div className="settings-list-item p-5 bg-white border border-gray-100 rounded-xl animate-gentleSlideIn" style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05)', animationDelay: '0.4s' }}>
               <div className="flex items-start justify-between gap-4">
                 <div className="flex-1">
                   <h3 className="text-base font-medium text-gray-800 mb-1">Staff Messages</h3>
                   <p className="text-xs text-gray-500 leading-relaxed settings-description">
                     Get email notifications when Alcor staff message portal users
                   </p>
                   <div className="mt-3 animate-subtleFadeIn" style={{ minHeight: '32px', animationDelay: '0.6s' }}>
                     {settings.receiveStaffMessages && (
                       <div className="inline-flex items-center">
                         <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 border border-gray-200 rounded-lg">
                           <Check className="w-3.5 h-3.5 text-gray-600" strokeWidth={2} />
                           <span className="text-[0.6875rem] tracking-widest text-gray-700 font-medium status-badge">
                             ACTIVE
                           </span>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
                 <CustomSwitch
                   checked={settings.receiveStaffMessages}
                   onChange={() => handleToggle('receiveStaffMessages')}
                   settingName="receiveStaffMessages"
                 />
               </div>
             </div>
           </div>
         </div>
       </div>

       {/* Security Card */}
       <div className="professional-card bg-white border border-gray-200 rounded-2xl overflow-hidden animate-fadeInUp" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)', animationDelay: '0.3s', opacity: 0 }}>
         <div className="px-8 py-6">
           <div className="flex items-center gap-4 mb-8">
             <IconWrapper className="icon-luxury" size="large" color="purple">
               <ShieldIcon className={iconStyle.iconSizeLarge} />
             </IconWrapper>
             <h2 className="text-lg font-normal text-gray-800 card-title">Security</h2>
           </div>

           <div className="settings-list-item p-5 bg-white border border-gray-100 rounded-xl animate-gentleSlideIn" style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)', animationDelay: '0.5s' }}>
             <div className="flex items-start justify-between gap-4">
               <div className="flex-1">
                 <h3 className="text-base font-medium text-gray-800 mb-1">Two-Factor Authentication</h3>
                 <p className="text-xs text-gray-500 leading-relaxed mb-4 settings-description">
                   Enhanced security with additional verification
                 </p>
                 
                 <div className="animate-subtleFadeIn" style={{ minHeight: '80px', animationDelay: '0.7s' }}>
                   {!settings.twoFactorEnabled ? (
                     <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-100/50 p-4 rounded-xl">
                       <div className="flex gap-3">
                         <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" strokeWidth={1} />
                         <div>
                           <p className="text-xs font-medium text-gray-700 tracking-wider uppercase">Recommended</p>
                           <p className="text-xs text-gray-400 mt-1 leading-relaxed font-light">
                             Secure your account
                           </p>
                         </div>
                       </div>
                     </div>
                   ) : (
                     <div className="inline-flex items-center">
                       <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 border border-emerald-100 rounded-lg">
                         <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
                         <span className="text-[0.6875rem] tracking-widest text-emerald-700 font-medium status-badge">
                           SECURED
                         </span>
                       </div>
                     </div>
                   )}
                 </div>
               </div>
               <CustomSwitch
                 checked={settings.twoFactorEnabled}
                 onChange={() => handleToggle('twoFactorEnabled')}
                 settingName="twoFactorEnabled"
                 color="#7d4582"
               />
             </div>
           </div>
         </div>
       </div>
     </div>

     {/* Footer Actions */}
     <div className="mt-16 px-4 md:px-0 pb-2 sm:pb-8 animate-subtleFadeIn" style={{ animationDelay: '0.6s' }}>
       <div className="luxury-divider mb-8 animate-gentleSlideIn" style={{ animationDelay: '0.7s' }}></div>
       <div className="flex items-center justify-between px-4 sm:px-0 animate-gentleSlideIn" style={{ animationDelay: '0.8s' }}>
         <div className="flex items-center gap-3">
           <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></div>
           <p className="text-xs text-gray-500 sm:text-gray-500 text-gray-600 tracking-wider uppercase font-light">Changes save automatically</p>
         </div>
         
         <button
           onClick={handleRestoreDefaults}
           disabled={saving}
           className="text-xs tracking-wider uppercase text-gray-600 sm:text-gray-500 hover:text-gray-700 font-normal transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-b border-transparent hover:border-gray-400"
         >
           {saving ? (
             <span className="flex items-center gap-2">
               <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
               RESTORING...
             </span>
           ) : (
             'Restore defaults'
           )}
         </button>
       </div>
     </div>
   </div>
 );
};

export default SettingsTab;