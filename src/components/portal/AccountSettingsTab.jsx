import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Check, Sparkles, AlertCircle } from 'lucide-react';
import Switch from 'react-switch';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { settingsApi } from '../../services/settingsApi';
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '../../services/firebase';
import alcorStar from '../../assets/images/alcor-yellow-star.png';
import FloatingFooter from './FloatingFooter'; 
import analytics from '../../services/analytics';
// Import the new icon components
import { IconWrapper, BellIcon, ShieldIcon, iconStyle } from './iconStyle';

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
 
 // 2FA states
 const [show2FASetup, setShow2FASetup] = useState(false);
 const [twoFactorData, setTwoFactorData] = useState(null);
 const [twoFactorCode, setTwoFactorCode] = useState('');
 const [show2FADisable, setShow2FADisable] = useState(false);
 const [disableCode, setDisableCode] = useState('');
 const [error, setError] = useState('');
 const [successMessage, setSuccessMessage] = useState('');

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
   // Special handling for 2FA
   if (settingName === 'twoFactorEnabled') {
     if (!settings.twoFactorEnabled) {
       // Enable 2FA - show setup
       handle2FAEnable();
     } else {
       // Disable 2FA - show confirmation
       setShow2FADisable(true);
     }
     return;
   }

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

   // Save to backend
   try {
     const result = await settingsApi.updateSettings({ [settingName]: newValue });
     if (!result.success) {
       // Revert if failed
       setSettings(prev => ({ ...prev, [settingName]: !newValue }));
       setError('Failed to update settings. Please try again.');
       setTimeout(() => setError(''), 3000);
     } else {
       // Track analytics
       if (salesforceContactId) {
         analytics.logUserAction('settings_updated', {
           setting: settingName,
           value: newValue
         });
       }
     }
   } catch (error) {
     console.error('Error updating setting:', error);
     // Revert on error
     setSettings(prev => ({ ...prev, [settingName]: !newValue }));
     setError('Failed to update settings. Please try again.');
     setTimeout(() => setError(''), 3000);
   }
 };

 // Enhanced 2FA Enable handler with better messaging
 const handle2FAEnable = async () => {
   setSaving(true);
   setError('');
   
   // Check if this is a re-enable situation
   const wasEnabledBefore = localStorage.getItem(`2fa_was_enabled_${auth.currentUser?.uid}`) === 'true';
   
   try {
     // Call settings API to setup 2FA
     const result = await settingsApi.setup2FA();
     
     if (result.success && result.qrCode && result.secret) {
       setTwoFactorData({
         qrCode: result.qrCode,
         secret: result.secret,
         wasEnabledBefore
       });
       setShow2FASetup(true);
       
       // Track that they've had 2FA before
       localStorage.setItem(`2fa_was_enabled_${auth.currentUser?.uid}`, 'true');
     } else {
       setError(result.error || 'Failed to setup 2FA');
       setTimeout(() => setError(''), 3000);
     }
   } catch (error) {
     console.error('2FA setup error:', error);
     setError('Failed to setup two-factor authentication');
     setTimeout(() => setError(''), 3000);
   } finally {
     setSaving(false);
   }
 };

// Replace your current handle2FAVerification with this:
const handle2FAVerification = async (e) => {
  e.preventDefault();
  
  if (twoFactorCode.length !== 6) {
    setError('Please enter a 6-digit code');
    return;
  }
  
  setSaving(true);
  setError('');
  
  try {
    // Use the settings API enable2FA method - NOT authCore
    const result = await settingsApi.enable2FA(twoFactorCode);
    
    if (result.success) {
      // Update local state
      setSettings(prev => ({ ...prev, twoFactorEnabled: true }));
      setShow2FASetup(false);
      setTwoFactorCode('');
      setTwoFactorData(null);
      setSuccessMessage('Two-factor authentication enabled successfully!');
      
      // Track analytics
      if (salesforceContactId) {
        analytics.logUserAction('2fa_enabled', {});
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setError(result.error || 'Invalid code. Please try again.');
      setTwoFactorCode('');
    }
  } catch (error) {
    console.error('2FA verification error:', error);
    setError('Failed to verify code. Please try again.');
    setTwoFactorCode('');
  } finally {
    setSaving(false);
  }
};

 // 2FA disable handler - Using settings API
 const handle2FADisable = async (e) => {
   e.preventDefault();
   
   if (disableCode.length !== 6) {
     setError('Please enter a 6-digit code');
     return;
   }
   
   setSaving(true);
   setError('');
   
   try {
     // Call settings API to disable 2FA
     const result = await settingsApi.disable2FA(disableCode);
     
     if (result.success) {
       setSettings(prev => ({ ...prev, twoFactorEnabled: false }));
       setShow2FADisable(false);
       setDisableCode('');
       setSuccessMessage('Two-factor authentication disabled');
       
       // Track analytics
       if (salesforceContactId) {
         analytics.logUserAction('2fa_disabled', {});
       }
       
       // Clear success message after 3 seconds
       setTimeout(() => setSuccessMessage(''), 3000);
     } else {
       setError(result.error || 'Invalid code. Please try again.');
       setDisableCode('');
     }
   } catch (error) {
     console.error('2FA disable error:', error);
     setError('Failed to verify code. Please try again.');
     setDisableCode('');
   } finally {
     setSaving(false);
   }
 };

 const handleRestoreDefaults = async () => {
   const defaultSettings = {
     receiveMediaNotifications: false,
     receiveStaffMessages: true,
     twoFactorEnabled: settings.twoFactorEnabled // Don't change 2FA on restore
   };
   
   setSaving(true);
   setError('');
   
   try {
     const result = await settingsApi.updateSettings(defaultSettings);
     if (result.success) {
       setSettings(defaultSettings);
       setSuccessMessage('Settings restored to defaults');
       
       // Track analytics
       if (salesforceContactId) {
         analytics.logUserAction('settings_restored_to_defaults', {});
       }
       
       setTimeout(() => setSuccessMessage(''), 3000);
     } else {
       setError('Failed to restore defaults');
       setTimeout(() => setError(''), 3000);
     }
   } catch (error) {
     console.error('Error restoring defaults:', error);
     setError('Failed to restore defaults');
     setTimeout(() => setError(''), 3000);
   } finally {
     setSaving(false);
   }
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

     {/* Success/Error Messages */}
     {successMessage && (
       <div className="mb-6 px-4 md:px-0">
         <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-4">
           <div className="flex items-center">
             <Check className="w-5 h-5 mr-2" />
             {successMessage}
           </div>
         </div>
       </div>
     )}
     
     {error && (
       <div className="mb-6 px-4 md:px-0">
         <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
           {error}
         </div>
       </div>
     )}

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

     {/* 2FA Setup Modal - Using Portal */}
     {show2FASetup && ReactDOM.createPortal(
       <div className="fixed inset-0 z-[100] overflow-y-auto">
         <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => {
           setShow2FASetup(false);
           setTwoFactorCode('');
           setError('');
         }}></div>
         
         <div className="flex min-h-full items-center justify-center p-4">
           <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl">
             <div className="p-6">
               <h3 className="text-lg font-semibold text-gray-800 mb-4">Set Up Two-Factor Authentication</h3>
               
               {/* Add notice if re-enabling */}
               {twoFactorData?.wasEnabledBefore && (
                 <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                   <p className="text-sm text-blue-800">
                     <strong>Note:</strong> Since you're re-enabling 2FA, you'll need to {window.innerWidth < 640 ? 'add' : 'scan'} a new {window.innerWidth < 640 ? 'setup key' : 'QR code'}. 
                     Your previous 2FA configuration has been removed for security.
                   </p>
                 </div>
               )}
               
               {twoFactorData && (
                 <>
                   <div className="bg-gray-50 rounded-lg p-6 mb-6">
                     <h4 className="font-medium text-gray-800 mb-4 text-center">Step 1: Add to Authenticator App</h4>
                     
                     {/* Desktop: Show QR Code */}
                     <div className="hidden sm:block text-center">
                       <img 
                         src={twoFactorData.qrCode} 
                         alt="2FA QR Code" 
                         className="mx-auto mb-4 border-2 border-gray-300 rounded-lg"
                         style={{ maxWidth: '200px', height: 'auto' }}
                       />
                       <p className="text-sm text-gray-600 mb-2">
                         Scan this QR code with your authenticator app
                       </p>
                     </div>
                     
                     {/* Mobile: Show setup key */}
                     <div className="sm:hidden">
                       <p className="text-sm text-gray-700 mb-2">Add this account to your authenticator app:</p>
                       <p className="text-sm font-medium text-gray-900 mb-1">Account: Alcor Portal</p>
                       <p className="text-xs text-gray-600 mb-2">Setup key:</p>
                       <p className="font-mono text-xs break-all bg-gray-100 p-2 rounded select-all mb-3">
                         {twoFactorData.secret}
                       </p>
                       <button
                         type="button"
                         onClick={() => {
                           navigator.clipboard.writeText(twoFactorData.secret);
                           alert('Setup key copied to clipboard!');
                         }}
                         className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded text-sm hover:bg-gray-300"
                       >
                         Copy Setup Key
                       </button>
                     </div>
                   </div>
                   
                   <form onSubmit={handle2FAVerification}>
                     <label className="block text-gray-700 text-sm font-medium mb-2">
                       Step 2: Enter Verification Code
                     </label>
                     <input 
                       type="text" 
                       value={twoFactorCode}
                       onChange={(e) => {
                         const value = e.target.value.replace(/\D/g, '');
                         if (value.length <= 6) setTwoFactorCode(value);
                       }}
                       placeholder="000000" 
                       maxLength="6"
                       className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-md text-center text-xl tracking-widest font-mono"
                       autoFocus
                       required
                     />
                     
                     <div className="flex gap-3">
                       <button
                         type="submit"
                         disabled={saving || twoFactorCode.length !== 6}
                         className="flex-1 bg-purple-600 text-white py-3 rounded-md font-medium hover:bg-purple-700 disabled:opacity-50"
                       >
                         {saving ? 'Verifying...' : 'Enable 2FA'}
                       </button>
                       <button
                         type="button"
                         onClick={() => {
                           setShow2FASetup(false);
                           setTwoFactorCode('');
                           setError('');
                         }}
                         className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-300"
                       >
                         Cancel
                       </button>
                     </div>
                   </form>
                   
                   {error && (
                     <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                       {error}
                     </div>
                   )}
                 </>
               )}
             </div>
           </div>
         </div>
       </div>,
       document.body
     )}

     {/* 2FA Disable Modal - Using Portal */}
     {show2FADisable && ReactDOM.createPortal(
       <div className="fixed inset-0 z-[100] overflow-y-auto">
         <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => {
           setShow2FADisable(false);
           setDisableCode('');
           setError('');
         }}></div>
         
         <div className="flex min-h-full items-center justify-center p-4">
           <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl">
             <div className="p-6">
               <h3 className="text-lg font-semibold text-gray-800 mb-4">Disable Two-Factor Authentication</h3>
               
               <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                 <p className="text-sm text-yellow-800">
                   <strong>Warning:</strong> Disabling 2FA will make your account less secure. Enter your current 2FA code to confirm.
                 </p>
               </div>
               
               <form onSubmit={handle2FADisable}>
                 <label className="block text-gray-700 text-sm font-medium mb-2">
                   Enter your 6-digit authentication code
                 </label>
                 <input 
                   type="text" 
                   value={disableCode}
                   onChange={(e) => {
                     const value = e.target.value.replace(/\D/g, '');
                     if (value.length <= 6) setDisableCode(value);
                   }}
                   placeholder="000000" 
                   maxLength="6"
                   className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-md text-center text-xl tracking-widest font-mono"
                   autoFocus
                   required
                 />
                 
                 <div className="flex gap-3">
                   <button
                     type="submit"
                     disabled={saving || disableCode.length !== 6}
                     className="flex-1 bg-red-600 text-white py-3 rounded-md font-medium hover:bg-red-700 disabled:opacity-50"
                   >
                     {saving ? 'Verifying...' : 'Disable 2FA'}
                   </button>
                   <button
                     type="button"
                     onClick={() => {
                       setShow2FADisable(false);
                       setDisableCode('');
                       setError('');
                     }}
                     className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-300"
                   >
                     Cancel
                   </button>
                 </div>
               </form>
               
               {error && (
                 <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                   {error}
                 </div>
               )}
             </div>
           </div>
         </div>
       </div>,
       document.body
     )}
   </div>
 );
};

export default SettingsTab;