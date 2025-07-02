import React, { useState, useEffect } from 'react';
import { Bell, Mail, Shield, Check, Sparkles, AlertCircle } from 'lucide-react';
import Switch from 'react-switch';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { reportActivity, ACTIVITY_TYPES } from '../../services/activity';
import { settingsApi } from '../../services/settingsApi';
import alcorStar from '../../assets/images/alcor-yellow-star.png';

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
      .settings-tab * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
      }
      .settings-tab p,
      .settings-tab span:not(.section-title-text),
      .settings-tab div {
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
      @media (min-width: 640px) {
        .settings-tab .section-title-text {
          font-weight: 500 !important;
          letter-spacing: -0.02em;
          color: #111827 !important;
        }
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
      .settings-tab .status-badge,
      .settings-tab .status-badge span {
        font-weight: 800 !important;
        letter-spacing: 0.05em !important;
      }
      .gradient-border {
        position: relative;
        background: linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%);
        padding: 2px;
      }
      .gradient-border-inner {
        background: white;
        border-radius: 1.25rem;
      }
      @media (min-width: 640px) {
        .sm\\:gradient-border {
          position: relative;
          border-radius: 1.25rem;
          overflow: hidden;
        }
        .sm\\:gradient-border::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 1.25rem;
          padding: 2px;
          background: linear-gradient(90deg, #3a2f5a 0%, #5a4276 30%, #6e4376 60%, #8e5396 85%, #a673b6 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
        .sm\\:gradient-border > .sm\\:gradient-border-inner {
          background: white;
          border-radius: 1.25rem;
          position: relative;
        }
        .sm\\:gradient-border-inner .banner-section {
          background: transparent !important;
        }
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
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-64 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-96"></div>
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
    <div className="settings-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-11/12 md:pl-4">
      {/*<div className="settings-tab -mx-6 -mt-6 md:mx-0 md:mt-0 md:w-10/12 md:pl-2"></div>*/}
      {/* Settings Cards */}
      <div className="space-y-20 mr-auto fade-in">
        {/* Notifications Section */}
        <div className="bg-white shadow-sm border-2 border-gray-400 sm:border-gray-200 rounded-[1.5rem] sm:rounded-[1.25rem] overflow-hidden slide-in mx-4 sm:mx-0 sm:gradient-border" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
          <div className="sm:gradient-border-inner">
            <div className="px-6 py-8 sm:py-7 rounded-t-[1.5rem] sm:rounded-t-[1.25rem] banner-section" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
              <h2 className="text-lg sm:text-2xl font-normal text-white sm:text-gray-900 flex items-center drop-shadow-md sm:drop-shadow-none mt-2 sm:mt-0">
                <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-white sm:text-gray-900 drop-shadow-sm sm:drop-shadow-none mr-3 sm:stroke-[2]" />
                <strong className="sm:hidden">Email Notifications</strong>
                <span className="hidden sm:inline section-title-text">Email Notifications</span>
                <img src={alcorStar} alt="" className="w-6 h-6 ml-0.5 sm:hidden" />
              </h2>
            </div>

            <div className="divide-y divide-gray-100">
              {/* Media Notifications */}
              <div className="p-6 sm:p-8 pb-8 sm:pb-8 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">Media Notifications</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Get notified when new podcasts, newsletters, and other media content is published
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <CustomSwitch
                          checked={settings.receiveMediaNotifications}
                          onChange={() => handleToggle('receiveMediaNotifications')}
                          settingName="receiveMediaNotifications"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-4 sm:hidden">
                      <span className={`text-xs px-4 py-2 bg-white text-gray-700 ${USE_PILL_STYLE ? 'rounded-full text-center' : 'rounded-full text-center'} font-bold status-badge border border-gray-300 flex items-center justify-center gap-1.5`}>
                        <span>Default: Off</span>
                      </span>
                      {settings.receiveMediaNotifications && (
                        <span className={`text-xs px-4 py-2 bg-white text-[#825f7c] ${USE_PILL_STYLE ? 'rounded-full text-center' : 'rounded-full text-center'} font-bold status-badge border border-[#825f7c] flex items-center justify-center gap-1.5`}>
                          <span>Currently Active</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Messages */}
              <div className="p-6 sm:p-8 pb-10 sm:pb-12 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">Staff Messages</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Receive important updates and messages from Alcor staff members
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <CustomSwitch
                          checked={settings.receiveStaffMessages}
                          onChange={() => handleToggle('receiveStaffMessages')}
                          settingName="receiveStaffMessages"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-4 sm:hidden">
                      <span className={`text-xs px-4 py-2 bg-white text-gray-700 ${USE_PILL_STYLE ? 'rounded-full text-center' : 'rounded-full text-center'} font-bold status-badge border border-gray-300 flex items-center justify-center gap-1.5`}>
                        <span>Default: On</span>
                      </span>
                      {settings.receiveStaffMessages && (
                        <span className={`text-xs px-4 py-2 bg-white text-[#825f7c] ${USE_PILL_STYLE ? 'rounded-full text-center' : 'rounded-full text-center'} font-bold status-badge border border-[#825f7c] flex items-center justify-center gap-1.5`}>
                          <span>Currently Active</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white shadow-sm border-2 border-gray-400 sm:border-gray-200 rounded-[1.5rem] sm:rounded-[1.25rem] overflow-hidden slide-in-delay-2 mb-8 sm:mb-0 mx-4 sm:mx-0 sm:gradient-border" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
          <div className="sm:gradient-border-inner">
            <div className="px-6 py-8 sm:py-7 rounded-t-[1.5rem] sm:rounded-t-[1.25rem] banner-section" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
              <h2 className="text-lg sm:text-2xl font-normal text-white sm:text-gray-900 flex items-center drop-shadow-md sm:drop-shadow-none mt-2 sm:mt-0">
                <Shield className="w-5 h-5 sm:w-7 sm:h-7 text-white sm:text-gray-900 drop-shadow-sm sm:drop-shadow-none mr-3 sm:stroke-[2]" />
                <strong className="sm:hidden">Security</strong>
                <span className="hidden sm:inline section-title-text">Security</span>
                <img src={alcorStar} alt="" className="w-6 h-6 ml-0.5 sm:hidden" />
              </h2>
            </div>

            <div className="p-6 sm:p-8 pb-8 sm:pb-8">
              <div className="flex items-center justify-between gap-4 sm:gap-6">
                <div className="flex items-start gap-4 sm:gap-5 flex-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Add an extra layer of security to your account with 2FA verification
                    </p>
                    {!settings.twoFactorEnabled && (
                      <div className="flex items-start gap-2 mt-4 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800 flex-shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm text-gray-800 font-medium">
                          We strongly recommend enabling two-factor authentication to protect your account
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-4 sm:hidden">
                      {settings.twoFactorEnabled ? (
                        <span className={`text-xs px-4 py-2 bg-white text-[#825f7c] ${USE_PILL_STYLE ? 'rounded-full text-center' : 'rounded-full text-center'} font-bold status-badge border border-[#825f7c] inline-flex items-center justify-center gap-1.5`}>
                          <span>Enabled</span>
                        </span>
                      ) : (
                        <span className={`text-xs px-4 py-2 bg-white text-[#13283f] ${USE_PILL_STYLE ? 'rounded-full text-center' : 'rounded-full text-center'} font-bold status-badge border border-[#13283f] inline-flex items-center justify-center gap-1.5`}>
                          <span>Not Protected</span>
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
      </div>

      {/* Footer Actions */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gradient-to-r from-gray-50 to-gray-100/70 rounded-xl sm:rounded-2xl slide-in-delay-3 mx-4 sm:mx-0" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
        <div className="text-center sm:text-left">
          <p className="text-sm text-gray-700 font-normal">Changes are saved automatically</p>
          <p className="text-xs text-gray-500 mt-0.5">Your preferences are updated in real-time</p>
        </div>
        <button
          onClick={handleRestoreDefaults}
          disabled={saving}
          className="px-5 py-2.5 bg-white text-[#12243c] border border-[#12243c] rounded-lg hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-normal flex items-center gap-2 text-sm"
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