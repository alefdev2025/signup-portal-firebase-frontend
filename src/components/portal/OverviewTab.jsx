import React, { useState, useEffect, useRef } from 'react';
import { getContactInfo } from '../../services/contact';
import { useUser } from '../../contexts/UserContext';
import { latestMediaItems } from './LatestMedia';
import { memberNewsletters } from './MemberNewsletters';
import { announcements } from './Announcements';
import { podcastEpisodes } from './podcastConfig';
import GradientButton from './GradientButton';
import TopLeftCard from './DashboardComponents/TopLeftCard';
import TopMiddleCard from './DashboardComponents/TopMiddleCard';
import MiddleLeftSmallCard from './DashboardComponents/MiddleLeftSmallCard';
import MiddleRightSmallCard from './DashboardComponents/MiddleRightSmallCard';
import TopRightCard from './DashboardComponents/TopRightCard';
import podcastImage from '../../assets/images/podcast-image.png';
import PodcastCard from './PodcastCard';

const OverviewTab = () => {
  const { currentUser } = useUser();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [visibleSections, setVisibleSections] = useState(new Set());

  // Refs for scroll animations
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
            // Fallback to Nikki if no contact info found
            setUserName('Nikki');
          }
        } catch (error) {
          console.error('Error fetching user info:', error);
          // Fallback to Nikki on error
          setUserName('Nikki');
        }
      } else {
        // Fallback to Nikki if no user logged in
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
      { threshold: 0.3 } // Need 30% visible before triggering
    );

    // Quick actions and recent activity use regular observer
    if (quickActionsRef.current) observer.observe(quickActionsRef.current);
    if (dashboardCardsRef.current) observer.observe(dashboardCardsRef.current);
    if (recentActivityRef.current) observer.observe(recentActivityRef.current);
    
    // Announcements and newsletters need more scroll
    if (announcementsRef.current) delayedObserver.observe(announcementsRef.current);
    if (newslettersRef.current) delayedObserver.observe(newslettersRef.current);

    return () => {
      if (quickActionsRef.current) observer.unobserve(quickActionsRef.current);
      if (dashboardCardsRef.current) observer.unobserve(dashboardCardsRef.current);
      if (recentActivityRef.current) observer.unobserve(recentActivityRef.current);
      if (announcementsRef.current) delayedObserver.unobserve(announcementsRef.current);
      if (newslettersRef.current) delayedObserver.unobserve(newslettersRef.current);
    };
  }, []);

  return (
    <div className="-mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-11 lg:grid-rows-2 gap-4 mb-8">
        {/* Welcome section - spans 5 columns */}
        <div 
          className="relative h-64 rounded-2xl overflow-hidden animate-fadeIn lg:col-span-5"
          style={{ 
            background: 'linear-gradient(to right, #0a1629 0%, #1a2744 25%, #243456 50%, #2e4168 75%, #384e7a 100%)',
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
          
          <div className="relative z-10 px-8 py-5 h-full flex items-center">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-light text-white mb-2 drop-shadow-lg tracking-tight">
                <span className="text-white/90">Welcome</span>
                <span className="text-white font-normal">{loading ? '...' : (userName ? `, ${userName}!` : '!')}</span>
              </h1>
              <p className="text-sm md:text-base text-white/90 mb-3 drop-shadow">
                Access your membership settings, documents, and resources all in one place.
              </p>
              <GradientButton 
                onClick={() => console.log('View membership status')}
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/10"
              >
                View Membership Status
              </GradientButton>
            </div>
          </div>
        </div>

        {/* Diagonal gradient section - spans 3 columns */}
        <div 
          className="relative h-64 rounded-2xl overflow-hidden animate-fadeIn lg:col-span-3"
          style={{ 
            background: '#e0e0e0',
            animation: 'fadeIn 0.8s ease-in-out',
            animationDelay: '0.1s'
          }}
        >
          <div className="relative z-10 px-5 py-5 h-full flex flex-col justify-center">
            <h3 className="text-lg font-medium mb-3 text-gray-800">Quick Stats</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="text-sm font-medium text-gray-800">2024</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tier</span>
                <span className="text-sm font-medium text-gray-800">Premium</span>
              </div>
            </div>
            <button 
              className="w-full py-2 px-4 rounded-lg text-white font-medium text-sm transition-transform hover:scale-105"
              style={{ 
                background: `linear-gradient(135deg, #12233b 0%, #272b4d 10%, #3b345b 20%, #4b3865 30%, #5d4480 40%, #6c5578 50%, #7b5670 60%, #8a5f64 70%, #996b66 80%, #ae7968 85%, #c2876a 88%, #d4a85f 91%, #ddb571 92.5%, #e4c084 94%, #e9ca96 95.5%, #efd3a8 97%, #f7ddb5 98.5%, #ffd4a3 100%)`,
              }}
            >
              View Details
            </button>
          </div>
        </div>

        {/* Latest Updates section - spans 2 rows and 3 columns */}
        <div 
          className="relative h-64 lg:h-[35rem] rounded-2xl overflow-hidden animate-fadeIn lg:row-span-2 lg:col-span-3"
          style={{ 
            background: 'linear-gradient(to right, #0a1629 0%, #1a2744 25%, #243456 50%, #2e4168 75%, #384e7a 100%)',
            animation: 'fadeIn 0.8s ease-in-out',
            animationDelay: '0.2s'
          }}
        >
          <div className="relative z-10 px-4 py-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-normal text-white">Latest Media</h3>
              <svg className="w-6 h-6 text-white/90" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </div>
            <div className="flex-1 flex flex-col gap-5 px-2">
              {/* Podcast Episodes from config */}
              {podcastEpisodes.map((episode, index) => (
                <PodcastCard 
                  key={episode.id}
                  title={episode.title}
                  timeAgo={episode.timeAgo}
                  description={episode.description}
                  link={episode.link}
                  image={podcastImage}
                  className="flex-1"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions - second row, spans 8 columns */}
        <div ref={quickActionsRef} id="quickActions" className="lg:col-span-8 mt-8">
          <h2 className="text-xl font-light text-[#2a2346] mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className={`bg-gray-100 hover:bg-gray-50 hover:scale-105 rounded-lg p-6 transition-all cursor-pointer group duration-300 ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ 
                transitionDelay: '100ms',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div 
                className="w-14 h-14 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden"
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
              <h3 className="font-medium text-xl text-[#2a2346] mb-2">Account Settings</h3>
              <p className="text-sm text-gray-400">Manage your profile and preferences</p>
            </div>
            
            <div 
              className={`bg-gray-100 hover:bg-gray-50 hover:scale-105 rounded-lg p-6 transition-all cursor-pointer group duration-300 ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ 
                transitionDelay: '200ms',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div 
                className="w-14 h-14 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden"
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
              <h3 className="font-medium text-xl text-[#2a2346] mb-2">View Membership</h3>
              <p className="text-sm text-gray-400">Check your membership details</p>
            </div>
            
            <div 
              className={`bg-gray-100 hover:bg-gray-50 hover:scale-105 rounded-lg p-6 transition-all cursor-pointer group duration-300 ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ 
                transitionDelay: '300ms',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div 
                className="w-14 h-14 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden"
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
              <h3 className="font-medium text-xl text-[#2a2346] mb-2">Payment History</h3>
              <p className="text-sm text-gray-400">Review recent transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements Section */}
      {announcements && announcements.length > 0 && (
        <div ref={announcementsRef} id="announcements" className="mt-8">
          <h2 className={`text-2xl font-light text-[#2a2346] mb-6 transition-all duration-1000 ${visibleSections.has('announcements') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>Announcements</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {announcements.slice(0, 2).map((announcement, index) => (
              <div 
                key={announcement.id}
                className={`bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-1000 cursor-pointer ${visibleSections.has('announcements') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
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

      {/* Member Newsletter Section */}
      {memberNewsletters && memberNewsletters.length > 0 && (
        <div ref={newslettersRef} id="newsletters" className="mt-16">
          <h2 className={`text-2xl font-light text-[#2a2346] mb-6 transition-all duration-800 ${visibleSections.has('newsletters') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>Member Newsletters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberNewsletters.slice(0, 3).map((newsletter, index) => (
              <div 
                key={newsletter.id}
                className={`bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-700 cursor-pointer ${visibleSections.has('newsletters') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
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

      {/* Recent Activity */}
      <div ref={recentActivityRef} id="recentActivity" className="mt-16">
        <h2 className={`text-2xl font-light text-[#2a2346] mb-4 transition-all duration-800 ${visibleSections.has('recentActivity') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>Recent Activity</h2>
        <div className="space-y-4">
          <div className={`bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-6 hover:shadow-md transition-all duration-700 ${visibleSections.has('recentActivity') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '100ms' }}>
            <div 
              className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(to right, #806a9c, #796395, #725c8e, #6b5587, #644e80)' }}
            >
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[#2a2346] font-medium">Updated profile information</p>
              <p className="text-sm text-[#4a3d6b]">2 days ago</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          <div className={`bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-6 hover:shadow-md transition-all duration-700 ${visibleSections.has('recentActivity') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '200ms' }}>
            <div 
              className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(to right, #806a9c, #796395, #725c8e, #6b5587, #644e80)' }}
            >
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[#2a2346] font-medium">Downloaded membership contract</p>
              <p className="text-sm text-[#4a3d6b]">1 week ago</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;