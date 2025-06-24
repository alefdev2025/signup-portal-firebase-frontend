import React, { useState, useEffect, useRef } from 'react';
import { getContactInfo } from '../../services/contact';
import { useUser } from '../../contexts/UserContext';
import { latestMediaItems } from './LatestMedia';
import { memberNewsletters } from './MemberNewsletters';
import { announcements } from './Announcements';
import GradientButton from './GradientButton';
import dewarsImage from '../../assets/images/dewars2.jpg';

const OverviewTab = () => {
  const { currentUser } = useUser();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [visibleSections, setVisibleSections] = useState(new Set());

  // Refs for scroll animations
  const profileRef = useRef(null);
  const quickActionsRef = useRef(null);
  const dashboardCardsRef = useRef(null);
  const announcementsRef = useRef(null);
  const newslettersRef = useRef(null);
  const recentActivityRef = useRef(null);

  useEffect(() => {
    const fetchUserName = async () => {
      if (currentUser) {
        try {
          const response = await getContactInfo();
          if (response.success && response.contactInfo) {
            const firstName = response.contactInfo.firstName || 'Nikki';
            setUserName(firstName);
          } else {
            setUserName('Nikki');
          }
        } catch (error) {
          console.error('Error fetching user info:', error);
          setUserName('Nikki');
        }
      } else {
        setUserName('Nikki');
      }
      setLoading(false);
    };

    fetchUserName();
  }, [currentUser]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1 }
    );

    const delayedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.3 }
    );

    // Observers
    if (profileRef.current) observer.observe(profileRef.current);
    if (quickActionsRef.current) observer.observe(quickActionsRef.current);
    if (dashboardCardsRef.current) observer.observe(dashboardCardsRef.current);
    if (recentActivityRef.current) observer.observe(recentActivityRef.current);
    if (announcementsRef.current) delayedObserver.observe(announcementsRef.current);
    if (newslettersRef.current) delayedObserver.observe(newslettersRef.current);

    return () => {
      if (profileRef.current) observer.unobserve(profileRef.current);
      if (quickActionsRef.current) observer.unobserve(quickActionsRef.current);
      if (dashboardCardsRef.current) observer.unobserve(dashboardCardsRef.current);
      if (recentActivityRef.current) observer.unobserve(recentActivityRef.current);
      if (announcementsRef.current) delayedObserver.unobserve(announcementsRef.current);
      if (newslettersRef.current) delayedObserver.unobserve(newslettersRef.current);
    };
  }, []);

  return (
    <div className="px-6 md:px-12 py-4">
      {/* Hero Section with Classic Gradient */}
      <div 
        className="relative h-72 rounded-2xl overflow-hidden mb-8 animate-fadeIn"
        style={{ 
          animation: 'fadeIn 0.8s ease-in-out'
        }}
      >
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
        
        {/* Background image */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${dewarsImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        {/* Gradient overlay that becomes transparent towards bottom right */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'linear-gradient(135deg, #0e0e2f 0%, #1b163a 15%, #2a1b3d 30%, #3f2541 45%, rgba(46, 65, 104, 0.7) 65%, rgba(56, 78, 122, 0.4) 90%, rgba(255, 179, 102, 0.1) 100%)',
          }}
        />
        
        {/* Mesh gradient overlay for complexity */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 80% 20%, rgba(56, 78, 122, 0.3) 0%, transparent 50%)',
          }}
        />
        
        {/* Additional accent gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(115deg, transparent 40%, rgba(46, 65, 104, 0.2) 70%, rgba(56, 78, 122, 0.3) 100%)',
          }}
        />
        
        <div className="relative z-10 h-full flex items-center">
          <div className="flex items-center gap-12 w-full px-8">
            {/* Welcome message on the left */}
            <div className="flex-1">
              <h1 className="font-light text-white mb-3 drop-shadow-lg tracking-tight" style={{ fontSize: '2.5rem' }}>
                <span className="text-white/90">Welcome</span>
                <span className="text-white font-normal">{loading ? '...' : (userName ? `, ${userName}!` : '!')}</span>
              </h1>
              <p className="text-base md:text-lg text-white/90 mb-4 drop-shadow">
                Access your membership settings, documents, and resources all in one place.
              </p>
              <GradientButton 
                onClick={() => console.log('View membership status')}
                variant="outline"
                size="md"
                className="border-white/30 text-white hover:bg-white/10"
              >
                View Membership Status
              </GradientButton>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Profile Header */}
      <div ref={profileRef} id="profile" className={`bg-white rounded-2xl shadow-lg mb-8 overflow-hidden transition-all duration-800 ${visibleSections.has('profile') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="relative h-32 bg-gradient-to-r from-[#0a1629] via-[#2e4168] to-[#384e7a]">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute bottom-0 right-0 w-96 h-32 bg-gradient-to-l from-[#ffd4a3]/30 to-transparent"></div>
        </div>
        
        <div className="relative px-8 pb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-end gap-6">
              {/* Profile Image */}
              <div className="relative -mt-16 z-10">
                <div className="w-32 h-32 rounded-2xl bg-white p-1 shadow-xl">
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#b8a2d4] via-[#9c86b8] to-[#806a9c] flex items-center justify-center">
                    <span className="text-white text-4xl font-light">
                      {loading ? '...' : userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white"></div>
              </div>
              
              {/* Profile Info */}
              <div className="pb-2">
                <h1 className="text-2xl md:text-3xl font-medium text-gray-900 mb-1">
                  {loading ? 'Loading...' : `Welcome back, ${userName}!`}
                </h1>
                <p className="text-gray-600 mb-3">Access your membership settings, documents, and resources</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Active Member
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Member since 2020
                  </span>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="mt-6 lg:mt-0 flex gap-3">
              <button className="px-4 py-2 bg-[#806a9c] text-white rounded-lg hover:bg-[#6b5587] transition-colors text-sm font-medium">
                View Membership
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                Edit Profile
              </button>
            </div>
          </div>
          
          {/* Dashboard Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-100">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200/50">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#b8a2d4] to-[#9c86b8] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs text-purple-600 font-medium">+2 years</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">5</p>
              <p className="text-sm text-gray-600">Years Active</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs text-blue-600 font-medium">+3 new</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">12</p>
              <p className="text-sm text-gray-600">Documents</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200/50">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">Active</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">Current</p>
              <p className="text-sm text-gray-600">Payment Status</p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200/50">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className="flex -space-x-1">
                  <div className="w-6 h-6 rounded-full bg-amber-300 border-2 border-white"></div>
                  <div className="w-6 h-6 rounded-full bg-amber-400 border-2 border-white"></div>
                  <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-white"></div>
                  <div className="w-6 h-6 rounded-full bg-amber-600 border-2 border-white"></div>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">100%</p>
              <p className="text-sm text-gray-600">Profile Complete</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div ref={quickActionsRef} id="quickActions" className="mb-8">
        <h2 className={`text-xl font-light text-[#2a2346] mb-4 transition-all duration-800 ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div 
            className={`bg-white rounded-xl p-5 transition-all cursor-pointer group duration-300 border border-gray-200 hover:border-[#b8a2d4] hover:shadow-lg ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '100ms' }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#b8a2d4] to-[#9c86b8] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <h3 className="font-medium text-lg text-[#2a2346] mb-1">Account Settings</h3>
            <p className="text-xs text-gray-500">Manage your profile and preferences</p>
          </div>
          
          <div 
            className={`bg-white rounded-xl p-5 transition-all cursor-pointer group duration-300 border border-gray-200 hover:border-[#9c86b8] hover:shadow-lg ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9c86b8] to-[#806a9c] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
              </svg>
            </div>
            <h3 className="font-medium text-lg text-[#2a2346] mb-1">View Membership</h3>
            <p className="text-xs text-gray-500">Check your membership details</p>
          </div>
          
          <div 
            className={`bg-white rounded-xl p-5 transition-all cursor-pointer group duration-300 border border-gray-200 hover:border-[#806a9c] hover:shadow-lg ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '300ms' }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#806a9c] to-[#644e80] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="font-medium text-lg text-[#2a2346] mb-1">Payment History</h3>
            <p className="text-xs text-gray-500">Review recent transactions</p>
          </div>
          
          <div 
            className={`bg-white rounded-xl p-5 transition-all cursor-pointer group duration-300 border border-gray-200 hover:border-[#644e80] hover:shadow-lg ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '400ms' }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#644e80] to-[#483264] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-lg text-[#2a2346] mb-1">Support Center</h3>
            <p className="text-xs text-gray-500">Get help when you need it</p>
          </div>
        </div>
      </div>

      {/* Latest Media Section */}
      {latestMediaItems && latestMediaItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-light text-[#2a2346] mb-4">Latest Media</h2>
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestMediaItems.slice(0, 3).map((item, index) => (
                <div key={index} className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-lg mb-3">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                      {item.type}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{item.date}</p>
                  <h4 className="font-medium text-gray-900 line-clamp-2 group-hover:text-[#806a9c] transition-colors">
                    {item.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Announcements Section */}
      {announcements && announcements.length > 0 && (
        <div ref={announcementsRef} id="announcements" className="mb-8">
          <h2 className={`text-xl font-light text-[#2a2346] mb-4 transition-all duration-1000 ${visibleSections.has('announcements') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>Announcements</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {announcements.slice(0, 2).map((announcement, index) => (
              <div 
                key={announcement.id}
                className={`bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-1000 cursor-pointer ${visibleSections.has('announcements') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${200 + (index * 200)}ms` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={announcement.image}
                    alt={announcement.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
                  
                  <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                    <h3 className="text-lg font-medium mb-1">{announcement.title}</h3>
                    {announcement.subtitle && (
                      <p className="text-sm mb-2 text-white/90">{announcement.subtitle}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-white/80">
                      {announcement.eventDate && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {announcement.eventDate}
                        </span>
                      )}
                      {announcement.eventTime && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {announcement.eventTime}
                        </span>
                      )}
                      {announcement.location && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {announcement.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-3">{announcement.description}</p>
                  <a 
                    href={announcement.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#806a9c] hover:text-[#6b5587] text-sm font-medium transition-colors inline-flex items-center gap-2"
                  >
                    Learn More
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member Newsletter Section */}
      {memberNewsletters && memberNewsletters.length > 0 && (
        <div ref={newslettersRef} id="newsletters" className="mb-8">
          <h2 className={`text-xl font-light text-[#2a2346] mb-4 transition-all duration-800 ${visibleSections.has('newsletters') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>Member Newsletters</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {memberNewsletters.slice(0, 2).map((newsletter, index) => (
              <div 
                key={newsletter.id}
                className={`bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-700 cursor-pointer ${visibleSections.has('newsletters') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={newsletter.image}
                    alt={newsletter.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-lg font-medium mb-1">{newsletter.title}</h3>
                    <p className="text-xs opacity-90">{newsletter.formattedDate}</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{newsletter.description}</p>
                  <button className="text-[#d09163] hover:text-[#b87a52] text-sm font-medium transition-colors flex items-center gap-2">
                    Read Newsletter
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div ref={recentActivityRef} id="recentActivity" className="mb-8">
        <h2 className={`text-xl font-light text-[#2a2346] mb-4 transition-all duration-800 ${visibleSections.has('recentActivity') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>Recent Activity</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-all duration-700 cursor-pointer border-b border-gray-100 ${visibleSections.has('recentActivity') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '100ms' }}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#806a9c] to-[#644e80] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[#2a2346] font-medium text-sm">Updated profile information</p>
              <p className="text-xs text-gray-500">2 days ago</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          <div className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-all duration-700 cursor-pointer ${visibleSections.has('recentActivity') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '200ms' }}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#806a9c] to-[#644e80] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[#2a2346] font-medium text-sm">Downloaded membership contract</p>
              <p className="text-xs text-gray-500">1 week ago</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;