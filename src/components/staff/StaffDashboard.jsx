import React, { useState, useEffect } from 'react';
import { Bell, FileText, Users, LogOut, Send } from 'lucide-react';
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
      {/* Sidebar - Fixed with matching styles */}
      <div 
        className="w-[260px] shadow-2xl flex flex-col flex-shrink-0"
        style={{
          background: 'linear-gradient(180deg, #12243c 0%, #6e4376 100%)'
        }}
      >
        {/* Logo Section */}
        <div className="p-6 pt-10 pb-8 border-b border-white/20 text-center">
          <img src={alcorWhiteLogo} alt="Alcor Logo" className="h-16 w-auto mx-auto" />
          <p className="text-sm text-white/80 mt-2">Staff Portal</p>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 pt-6 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
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

      {/* Main Content - Scrollable */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-gray-100">
          <div className="p-8">
            {activeTab === 'content' && <StaffContent />}
            {activeTab === 'messages' && <StaffMessages />}
            {activeTab === 'notifications' && <StaffNotifications />}
            {activeTab === 'members' && <StaffMembers />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;