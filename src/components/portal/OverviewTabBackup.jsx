import React, { useState, useEffect, useRef } from 'react';
import { getContactInfo } from '../../services/contact';
import { useUser } from '../../contexts/UserContext';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { latestMediaItems } from './LatestMedia';
import { memberNewsletters } from './MemberNewsletters';
import { announcements } from './Announcements';
import GradientButton from './GradientButton';

// Import the new AccountDashboard component
import AccountDashboard from './OverviewWidgets/AccountDashboard';

// Import all components from OverviewSectionOneComponents
import LatestMediaCard from './OverviewSectionOneComponents/LatestMediaCard';
import MembershipStatusCard from './OverviewSectionOneComponents/MembershipStatusCard';
import UpcomingEventsCard from './OverviewSectionOneComponents/UpcomingEventsCard';
import AccountSettingsCard from './OverviewSectionOneComponents/AccountSettingsCard';
import PaymentHistoryCard from './OverviewSectionOneComponents/PaymentHistoryCard';
import RecentActivityCard from './OverviewSectionOneComponents/RecentActivityCard';
import NewsletterCard from './OverviewSectionOneComponents/NewsletterCard';

// Placeholder data for recent appearances
const recentAppearances = [
  {
    id: 1,
    title: "Cryonics: The Future of Life Extension",
    type: "Conference",
    organization: "BioTech Summit 2024",
    date: "March 15, 2024",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    recordingUrl: "#"
  }
];

const OverviewTab = () => {
  const { currentUser, salesforceCustomer } = useUser();
  const { customerName } = useMemberPortal();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [visibleSections, setVisibleSections] = useState(new Set());

  // Refs for scroll animations
  const quickActionsRef = useRef(null);
  const overviewWidgetsRef = useRef(null);
  const originalAnnouncementsRef = useRef(null);
  const originalNewslettersRef = useRef(null);

  useEffect(() => {
    // Use Salesforce customer data if available
    if (salesforceCustomer) {
      const firstName = salesforceCustomer.firstName || salesforceCustomer.fullName?.split(' ')[0] || 'Member';
      setUserName(firstName);
      setLoading(false);
    } else if (customerName) {
      // Fallback to customerName from MemberPortal context
      const firstName = customerName.split(' ')[0] || 'Member';
      setUserName(firstName);
      setLoading(false);
    } else if (currentUser) {
      // Final fallback to display name or email
      const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Member';
      setUserName(displayName);
      setLoading(false);
    } else {
      // Default fallback
      setUserName('Member');
      setLoading(false);
    }
  }, [currentUser, salesforceCustomer, customerName]);

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

    if (quickActionsRef.current) observer.observe(quickActionsRef.current);
    if (overviewWidgetsRef.current) observer.observe(overviewWidgetsRef.current);
    if (originalAnnouncementsRef.current) delayedObserver.observe(originalAnnouncementsRef.current);
    if (originalNewslettersRef.current) delayedObserver.observe(originalNewslettersRef.current);

    return () => {
      if (quickActionsRef.current) observer.unobserve(quickActionsRef.current);
      if (overviewWidgetsRef.current) observer.unobserve(overviewWidgetsRef.current);
      if (originalAnnouncementsRef.current) delayedObserver.unobserve(originalAnnouncementsRef.current);
      if (originalNewslettersRef.current) delayedObserver.unobserve(originalNewslettersRef.current);
    };
  }, []);

  return (
    <div className="-mt-4">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-normal text-gray-900 mb-2">
          Welcome, {loading ? '...' : userName || 'Member'}!
        </h1>
        <p className="text-base text-gray-600 mb-8">
          Access your membership settings, documents, and resources all in one place.
        </p>
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* First Row - Latest Media */}
          <LatestMediaCard latestMediaItems={latestMediaItems} />

          {/* Membership Status Card */}
          <MembershipStatusCard />

          {/* Upcoming Events Card */}
          <UpcomingEventsCard announcements={announcements} />

          {/* Second Row - Account Settings */}
          <AccountSettingsCard />

          {/* Payment History Card */}
          <PaymentHistoryCard />

          {/* Third Row - Recent Activity */}
          <RecentActivityCard />

          {/* Newsletter Card */}
          <NewsletterCard memberNewsletters={memberNewsletters} />
        </div>
      </div>
      {/* Welcome Section with Cards */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-gray-900 mb-2 tracking-tight">
          Welcome{loading ? '...' : (userName ? `, ${userName}!` : '!')}
        </h1>
        <p className="text-base text-gray-600 mb-8">
          Access your membership settings, documents, and resources all in one place.
        </p>
        
        {/* Top Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Latest Media Card */}
          {latestMediaItems && latestMediaItems.length > 0 && (
            <div className="bg-gradient-to-br from-navy-800 to-navy-900 rounded-2xl p-6 text-white relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer" style={{ background: 'linear-gradient(135deg, #050a15 0%, #0f1629 25%, #1a1f42 50%, #2d3561 75%, #3f4a8a 100%)' }}>
              <h3 className="text-lg font-semibold mb-1">Latest Media</h3>
              <p className="text-sm opacity-90 mb-3">{latestMediaItems[0].type} • {latestMediaItems[0].date}</p>
              <div className="flex items-start gap-3">
                <img 
                  src={latestMediaItems[0].image} 
                  alt={latestMediaItems[0].title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
                <p className="text-sm font-medium line-clamp-2">{latestMediaItems[0].title}</p>
              </div>
            </div>
          )}

          {/* Membership Status Card */}
          <div 
            className="rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300" 
            style={{ 
              background: 'linear-gradient(155deg, #f5e6f3 0%, #e8d5e7 20%, #dfc4db 40%, #d4b3cf 60%, #c8a2c3 80%, #b19bcd 100%)' 
            }}
          >
            <p className="text-sm text-gray-600 uppercase tracking-wide">Quick Stats</p>
            <h3 className="text-xl font-bold text-gray-900">Membership Status</h3>
            <p className="text-lg text-gray-700 mt-1">Active Member</p>
            <button className="mt-4 bg-white/50 hover:bg-white/70 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              View Details →
            </button>
          </div>

          {/* Upcoming Events Card */}
          {announcements && announcements.length > 0 && (
            <div className="bg-gradient-to-br from-navy-900 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden hover:shadow-xl transition-all duration-300" style={{ background: 'linear-gradient(135deg, #080f1f 0%, #1a1f42 50%, #242e5f 100%)' }}>
              <h3 className="text-lg font-semibold mb-1">Upcoming Events</h3>
              <p className="text-base font-medium mb-1">{announcements[0].title}</p>
              {announcements[0].eventDate && (
                <div className="flex items-center gap-2 text-sm mb-3 mt-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{announcements[0].eventDate}</span>
                </div>
              )}
              <button className="text-white/90 hover:text-white text-sm font-medium">
                View Details →
              </button>
            </div>
          )}
        </div>

        {/* Second Row Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Account Settings Card */}
          <div 
            className="rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300" 
            style={{ 
              background: 'linear-gradient(135deg, #f5e6f3 0%, #e8d5e7 20%, #dfc4db 40%, #d4b3cf 60%, #c8a2c3 80%, #b19bcd 100%)' 
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
                <p className="text-sm text-gray-700">Manage your profile</p>
              </div>
              <div className="bg-white/30 backdrop-blur-sm p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Payment History Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Payment History</h3>
                <p className="text-sm opacity-90">View transactions</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Profile Updated</p>
                <p className="text-sm text-gray-500">2 days ago</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Document Downloaded</p>
                <p className="text-sm text-gray-500">1 week ago</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div ref={quickActionsRef} id="quickActions" className="mb-8">
        <h2 className={`text-2xl font-light text-[#2a2346] mb-4 transition-all duration-800 ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div 
            className={`bg-gray-100 hover:bg-gray-200 rounded-lg p-6 transition-all cursor-pointer group duration-700 ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '100ms' }}
          >
            <div 
              className="w-14 h-14 rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-110 relative overflow-hidden"
            >
              <div 
                className="absolute inset-0" 
                style={{ 
                  background: 'linear-gradient(to right, #b8a2d4, #b19bcd, #aa94c6, #a38dbf, #9c86b8)',
                }}
              />
              <svg className="w-7 h-7 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <h3 className="font-medium text-[#2a2346] mb-2">Account Settings</h3>
            <p className="text-sm text-[#4a3d6b]">Manage your profile and preferences</p>
          </div>
          
          <div 
            className={`bg-gray-100 hover:bg-gray-200 rounded-lg p-6 transition-all cursor-pointer group duration-700 ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '200ms' }}
          >
            <div 
              className="w-14 h-14 rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-110 relative overflow-hidden"
            >
              <div 
                className="absolute inset-0" 
                style={{ 
                  background: 'linear-gradient(to right, #9c86b8, #957fb1, #8e78aa, #8771a3, #806a9c)',
                }}
              />
              <svg className="w-7 h-7 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
              </svg>
            </div>
            <h3 className="font-medium text-[#2a2346] mb-2">View Membership</h3>
            <p className="text-sm text-[#4a3d6b]">Check your membership details</p>
          </div>
          
          <div 
            className={`bg-gray-100 hover:bg-gray-200 rounded-lg p-6 transition-all cursor-pointer group duration-700 ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '300ms' }}
          >
            <div 
              className="w-14 h-14 rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-110 relative overflow-hidden"
            >
              <div 
                className="absolute inset-0" 
                style={{ 
                  background: 'linear-gradient(to right, #806a9c, #796395, #725c8e, #6b5587, #644e80)',
                }}
              />
              <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="font-medium text-[#2a2346] mb-2">Payment History</h3>
            <p className="text-sm text-[#4a3d6b]">Review recent transactions</p>
          </div>
          
          <div 
            className={`bg-gray-100 hover:bg-gray-200 rounded-lg p-6 transition-all cursor-pointer group duration-700 ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '400ms' }}
          >
            <div 
              className="w-14 h-14 rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-110 relative overflow-hidden"
            >
              <div 
                className="absolute inset-0" 
                style={{ 
                  background: 'linear-gradient(to right, #644e80, #5d4779, #564072, #4f396b, #483264)',
                }}
              />
              <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-[#2a2346] mb-2">Support Center</h3>
            <p className="text-sm text-[#4a3d6b]">Get help when you need it</p>
          </div>
        </div>
      </div>

      {/* Account Dashboard Section */}
      <div ref={overviewWidgetsRef} id="overviewWidgets" className="mb-8">
        <h2 className={`text-2xl font-light text-[#2a2346] mb-4 transition-all duration-800 ${visibleSections.has('overviewWidgets') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>Account Dashboard</h2>
        <AccountDashboard isVisible={visibleSections.has('overviewWidgets')} />
      </div>

      {/* Original Announcements Section - Exactly as it was */}
      {announcements && announcements.length > 0 && (
        <div ref={originalAnnouncementsRef} id="originalAnnouncements" className="mt-16">
          <h2 className={`text-2xl font-light text-[#2a2346] mb-6 transition-all duration-1000 ${visibleSections.has('originalAnnouncements') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>Announcements</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {announcements.slice(0, 2).map((announcement, index) => (
              <div 
                key={announcement.id}
                className={`bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-1000 cursor-pointer ${visibleSections.has('originalAnnouncements') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${200 + (index * 200)}ms` }}
              >
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={announcement.image}
                    alt={announcement.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Full overlay with gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
                  
                  {/* Text overlay content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                    <h3 className="text-2xl font-medium mb-2">{announcement.title}</h3>
                    {announcement.subtitle && (
                      <p className="text-lg mb-3 text-white/90">{announcement.subtitle}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-white/80">
                      {announcement.eventDate && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {announcement.eventDate}
                        </span>
                      )}
                      {announcement.eventTime && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {announcement.eventTime}
                        </span>
                      )}
                      {announcement.location && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {announcement.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-white border-2 border-purple-200 border-t-0 rounded-b-lg">
                  <p className="text-gray-600 mb-4">{announcement.description}</p>
                  <a 
                    href={announcement.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#6b5b7e] hover:text-[#4a4266] font-medium transition-colors inline-flex items-center gap-2 underline underline-offset-4"
                  >
                    Learn More
                    <svg className="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Original Member Newsletter Section - Exactly as it was */}
      {memberNewsletters && memberNewsletters.length > 0 && (
        <div ref={originalNewslettersRef} id="originalNewsletters" className="mt-16">
          <h2 className={`text-2xl font-light text-[#2a2346] mb-6 transition-all duration-800 ${visibleSections.has('originalNewsletters') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>Member Newsletters</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {memberNewsletters.slice(0, 2).map((newsletter, index) => (
              <div 
                key={newsletter.id}
                className={`bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-700 cursor-pointer ${visibleSections.has('originalNewsletters') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={newsletter.image}
                    alt={newsletter.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-medium mb-1">{newsletter.title}</h3>
                    <p className="text-sm opacity-90">{newsletter.formattedDate}</p>
                  </div>
                </div>
                <div className="p-6 bg-white border-2 border-[#f5e6d3] border-t-0 rounded-b-lg">
                  <p className="text-gray-600 mb-4 line-clamp-2">{newsletter.description}</p>
                  <button className="text-[#d09163] hover:text-[#b87a52] font-medium transition-colors flex items-center gap-2 underline underline-offset-4">
                    Read Newsletter
                    <svg className="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;