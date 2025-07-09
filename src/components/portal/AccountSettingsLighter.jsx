import React, { useState, useEffect } from 'react';
import { Bell, Mail, Shield, Check, Sparkles, AlertCircle } from 'lucide-react';
import Switch from 'react-switch';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { reportActivity, ACTIVITY_TYPES } from '../../services/activity';
import { settingsApi } from '../../services/settingsApi';
import alcorStar from '../../assets/images/alcor-star.png';

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
  const USE_PILL_STYLE = false;

  // Add Helvetica font with lighter weights
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .settings-tab * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .settings-tab .font-bold,
      .settings-tab .font-semibold {
        font-weight: 500 !important;
      }
      .settings-tab h1 {
        font-weight: 300 !important;
      }
      .settings-tab h2,
      .settings-tab h3,
      .settings-tab h4 {
        font-weight: 400 !important;
      }
      .settings-tab .fade-in {
        animation: fadeIn 0.6s ease-out;
      }
      .settings-tab .slide-in {
        animation: slideIn 0.6s ease-out;
      }
      .settings-tab .slide-in-delay-1 {
        animation: slideIn 0.6s ease-out 0.1s both;
      }
      .settings-tab .slide-in-delay-2 {
        animation: slideIn 0.6s ease-out 0.25s both;
      }
      .settings-tab .slide-in-delay-3 {
        animation: slideIn 0.6s ease-out 0.4s both;
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
          box-shadow: 0 0 0 0 rgba(255, 140, 0, 0.7);
        }
        70% {
          box-shadow: 0 0 0 25px rgba(255, 140, 0, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(255, 140, 0, 0);
        }
      }
      .custom-switch-handle {
        background-color: #FFD700 !important;
      }
      .custom-switch-on-handle .react-switch-handle {
        background-color: white !important;
        border: 3px solid #d68fd6 !important;
        box-sizing: border-box !important;
      }
      .custom-switch-on-handle-pulse .react-switch-handle {
        background-color: white !important;
        border: 3px solid #d68fd6 !important;
        box-sizing: border-box !important;
        animation: haloPulse 0.9s ease-out !important;
        border-radius: 50% !important;
      }
      .custom-switch-off-handle .react-switch-handle {
        background-color: #f3f4f6 !important;
        border: 2px solid #FFCAA6 !important;
        box-sizing: border-box !important;
      }
      .custom-switch-off-handle .react-switch-bg {
        border: 2px solid #FFCAA6 !important;
        box-sizing: border-box !important;
      }
      .creamsicle-outline {
        border: 2px solid #FFCAA6 !important;
      }
      .creamsicle-outline-thin {
        border: 1px solid #FFB08A !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    fetchUserSettings();
    
    // Report viewing settings
    if (salesforceContactId) {
      reportActivity(salesforceContactId, ACTIVITY_TYPES.VIEWED_SETTINGS)
        .catch(error => console.error('Failed to report activity:', error));
    }
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
    
    try {
      // Update setting via API
      await settingsApi.updateSetting(settingName, newValue);
      
      // Report the activity based on what was toggled
      if (salesforceContactId) {
        let activityType;
        
        switch (settingName) {
          case 'receiveMediaNotifications':
            activityType = newValue 
              ? ACTIVITY_TYPES.ENABLED_MEDIA_NOTIFICATIONS 
              : ACTIVITY_TYPES.DISABLED_MEDIA_NOTIFICATIONS;
            break;
          case 'receiveStaffMessages':
            activityType = newValue 
              ? ACTIVITY_TYPES.ENABLED_STAFF_MESSAGES 
              : ACTIVITY_TYPES.DISABLED_STAFF_MESSAGES;
            break;
          case 'twoFactorEnabled':
            activityType = newValue 
              ? ACTIVITY_TYPES.ENABLED_TWO_FACTOR 
              : ACTIVITY_TYPES.DISABLED_TWO_FACTOR;
            break;
        }
        
        if (activityType) {
          await reportActivity(salesforceContactId, activityType);
        }
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
      // Revert on error
      setSettings(settings);
      alert('Failed to update setting. Please try again.');
    }
  };

  const handleRestoreDefaults = async () => {
    const defaultSettings = {
      receiveMediaNotifications: false,
      receiveStaffMessages: true,
      twoFactorEnabled: false
    };
    
    setSaving(true);
    
    try {
      // Update all settings at once via API
      await settingsApi.updateSettings(defaultSettings);
      
      // Update local state
      setSettings(defaultSettings);

      // Report activity for restoring defaults
      if (salesforceContactId) {
        await reportActivity(salesforceContactId, ACTIVITY_TYPES.RESTORED_DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error restoring defaults:', error);
      alert('Failed to restore defaults. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Custom Switch component with pulse animation
  const CustomSwitch = ({ checked, onChange, settingName }) => (
    <div className="relative">
      <Switch
        checked={checked}
        onChange={onChange}
        onColor="#1e3a5f"
        offColor="#d1d5db"
        uncheckedIcon={false}
        checkedIcon={false}
        height={24}
        width={48}
        handleDiameter={20}
        activeBoxShadow="0 0 0 2px #12243c"
        onHandleColor="#ffffff"
        offHandleColor="#f3f4f6"
        className={checked ? (animatingStars[settingName] ? "custom-switch-on-handle-pulse" : "custom-switch-on-handle") : "custom-switch-off-handle"}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="-mx-6 -mt-6 md:mx-0 md:mt-0 md:w-11/12 md:pl-8">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 w-96 mb-12"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white shadow-sm border border-gray-100 p-8">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 bg-gray-200"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 w-64 mb-3"></div>
                    <div className="h-4 bg-gray-200 w-96"></div>
                  </div>
                  <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-tab -mx-6 -mt-6 md:mx-0 md:-mt-6 md:-ml-6">
      {/*<div className="settings-tab -mx-6 -mt-6 md:mx-0 md:mt-0 md:w-10/12 md:pl-2"></div>*/}
      {/* Settings Cards */}
      <div className="space-y-20 mr-auto fade-in">
        {/* Notifications Section */}
        <div className="bg-white shadow-sm border border-gray-400 sm:border-gray-200 overflow-hidden slide-in mx-4 sm:mx-0" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
          <div className="px-6 py-8 sm:py-7" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
            <h2 className="text-lg font-medium text-white flex items-center drop-shadow-md mt-2 sm:mt-0">
              <Sparkles className="w-5 h-5 text-white drop-shadow-sm mr-3" />
              Email Notifications
              <img src={alcorStar} alt="" className="w-6 h-6 ml-0.5" />
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {/* Media Notifications */}
            <div className="p-8 pb-12 sm:pb-8 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0">
                  <Bell className="w-7 h-7 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">Media Notifications</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Get notified when new podcasts, newsletters, and other media content is published
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-6">
                      <CustomSwitch
                        checked={settings.receiveMediaNotifications}
                        onChange={() => handleToggle('receiveMediaNotifications')}
                        settingName="receiveMediaNotifications"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <span className={`text-xs px-3 py-2.5 sm:py-3.5 bg-gray-100 text-gray-700 ${USE_PILL_STYLE ? 'rounded-full w-28 text-center' : 'w-28 text-center'} font-medium ${USE_PILL_STYLE ? 'creamsicle-outline' : 'creamsicle-outline-thin'}`}>
                      Default: Off
                    </span>
                    {settings.receiveMediaNotifications && (
                      <span className={`text-xs px-3 py-2.5 sm:py-3.5 bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white ${USE_PILL_STYLE ? 'rounded-full w-28 text-center' : 'w-28 text-center'} font-medium ring-2 ring-[#FFCAA6] sm:ring-0`}>
                        Currently Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Messages */}
            <div className="p-8 pb-12 sm:pb-8 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0">
                  <Mail className="w-7 h-7 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">Staff Messages</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Receive important updates and messages from Alcor staff members
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-6">
                      <CustomSwitch
                        checked={settings.receiveStaffMessages}
                        onChange={() => handleToggle('receiveStaffMessages')}
                        settingName="receiveStaffMessages"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <span className={`text-xs px-3 py-2.5 sm:py-3.5 bg-gray-100 text-gray-700 ${USE_PILL_STYLE ? 'rounded-full w-28 text-center' : 'w-28 text-center'} font-medium ${USE_PILL_STYLE ? 'creamsicle-outline' : 'creamsicle-outline-thin'}`}>
                      Default: On
                    </span>
                    {settings.receiveStaffMessages && (
                      <span className={`text-xs px-3 py-2.5 sm:py-3.5 bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white ${USE_PILL_STYLE ? 'rounded-full w-28 text-center' : 'w-28 text-center'} font-medium ring-2 ring-[#FFCAA6] sm:ring-0`}>
                        Currently Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white shadow-sm border border-gray-400 sm:border-gray-200 overflow-hidden slide-in-delay-2 mb-8 sm:mb-0 mx-4 sm:mx-0" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
          <div className="px-6 py-8 sm:py-7" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
            <h2 className="text-lg font-medium text-white flex items-center drop-shadow-md mt-2 sm:mt-0">
              <Shield className="w-5 h-5 text-white drop-shadow-sm mr-3" />
              Security
              <img src={alcorStar} alt="" className="w-6 h-6 ml-0.5" />
            </h2>
          </div>

          <div className="p-8 pb-12 sm:pb-8">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-start gap-5 flex-1">
                <div className="w-14 h-14 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0">
                  <Shield className="w-7 h-7 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Add an extra layer of security to your account with 2FA verification
                  </p>
                  {!settings.twoFactorEnabled && (
                    <div className="flex items-start gap-2 mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50">
                      <AlertCircle className="w-5 h-5 text-gray-800 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-800 font-medium">
                        We strongly recommend enabling two-factor authentication to protect your account
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-4">
                    {settings.twoFactorEnabled ? (
                      <span className={`text-xs px-3 py-2.5 sm:py-3.5 bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white ${USE_PILL_STYLE ? 'rounded-full w-28 text-center' : 'w-28 text-center'} font-medium inline-block`}>
                        Enabled
                      </span>
                    ) : (
                      <span className={`text-xs px-3 py-2.5 sm:py-3.5 bg-gray-700 text-white ${USE_PILL_STYLE ? 'rounded-full w-28 text-center' : 'w-28 text-center'} font-medium inline-block`}>
                        Not Protected
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 self-start mt-1 sm:mt-0">
                <CustomSwitch
                  checked={settings.twoFactorEnabled}
                  onChange={() => handleToggle('twoFactorEnabled')}
                  settingName="twoFactorEnabled"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gradient-to-r from-gray-50 to-gray-100/70 slide-in-delay-3 mx-4 sm:mx-0" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
        <div className="text-center sm:text-left">
          <p className="text-sm text-gray-700 font-normal">Changes are saved automatically</p>
          <p className="text-xs text-gray-500 mt-0.5">Your preferences are updated in real-time</p>
        </div>
        <button
          onClick={handleRestoreDefaults}
          disabled={saving}
          className="px-5 py-2.5 bg-white text-[#12243c] border border-[#12243c] hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-normal flex items-center gap-2 text-sm"
        >
          {saving ? (
            <>
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              Restoring...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Restore Defaults
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SettingsTab;