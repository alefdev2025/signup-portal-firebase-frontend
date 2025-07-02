import React, { useState, useEffect } from 'react';
import { Bell, FileText, Users, LogOut, Send, Menu, X } from 'lucide-react';
import { auth } from '../../services/firebase';
import StaffNotifications from './StaffNotifications';
import StaffContent from './StaffContent';
import StaffMembers from './StaffMembers';
import StaffMessages from './StaffMessages';
import alcorWhiteLogo from '../../assets/images/alcor-white-logo.png';

const StaffDashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        checkStaffAccess(user);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkStaffAccess = async (user) => {
    try {
      setIsStaff(true); // Assume true, backend will deny if not
    } catch (error) {
      console.error('Error checking staff access:', error);
      setIsStaff(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  if (!currentUser || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6f2d74] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access the staff dashboard.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-[#6f2d74] text-white py-2 px-4 rounded-lg hover:bg-[#5a245f]"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const navigation = [
    { id: 'content', name: 'Content', icon: FileText },
    { id: 'messages', name: 'Messages', icon: Send },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'members', name: 'Members', icon: Users },
  ];

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <img src={alcorWhiteLogo} alt="Alcor Logo" className="h-8 w-auto" />
            <span className="text-sm text-gray-600 font-medium">Staff Portal</span>
          </div>
          <div className="w-10" /> {/* Spacer for center alignment */}
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on desktop, drawer on mobile */}
      <div 
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 
          w-[260px] shadow-2xl flex flex-col flex-shrink-0
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          background: 'linear-gradient(180deg, #12243c 0%, #6e4376 100%)'
        }}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-white/80 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Logo Section */}
        <div className="p-6 pt-6 pb-8 border-b border-white/20">
          <img src={alcorWhiteLogo} alt="Alcor Logo" className="h-16 w-auto" />
          <p className="text-sm text-white/80 mt-2 pl-2">Staff Portal</p>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 pt-6 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-normal ${
                    activeTab === item.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-white/80'}`} />
                  <span className="text-lg">{item.name}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-white/20">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white font-medium">
                {currentUser?.email?.[0]?.toUpperCase() || 'S'}
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-white text-sm font-medium truncate drop-shadow-sm">
                {currentUser?.displayName || 'Staff Member'}
              </p>
              <p className="text-white/80 text-xs truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable with rounded corners */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
        {/* Content Area with rounded corners */}
        <div className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          <div className="h-full lg:p-8 lg:pl-0">
            <div className="h-full bg-white lg:rounded-l-3xl shadow-xl overflow-hidden">
              <div className="h-full overflow-y-auto">
                <div className="p-4 lg:p-8">
                  {activeTab === 'content' && <StaffContent />}
                  {activeTab === 'messages' && <StaffMessages />}
                  {activeTab === 'notifications' && <StaffNotifications />}
                  {activeTab === 'members' && <StaffMembers />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;