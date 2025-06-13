import React, { useState, useEffect } from 'react';
import { getContactInfo } from '../../services/contact';
import { useUser } from '../../contexts/UserContext';
import { latestMediaItems } from './LatestMedia';
import { memberNewsletters } from './MemberNewsletters';
import { announcements } from './Announcements';
import GradientButton from './GradientButton';

const OverviewTab = () => {
  const { currentUser } = useUser();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="-mt-4">
      <div 
        className="relative h-64 rounded-lg overflow-hidden mb-12"
        style={{ background: 'radial-gradient(ellipse at top left, #2a3670 0%, #1e2650 35%, #13263f 60%, #0a1629 100%)' }}
      >
        {/* Mesh gradient overlay for complexity */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 80% 20%, rgba(42, 54, 112, 0.3) 0%, transparent 50%)',
          }}
        />
        
        {/* Additional accent gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(115deg, transparent 40%, rgba(19, 38, 63, 0.4) 70%, rgba(10, 22, 41, 0.6) 100%)',
          }}
        />
        
        <div className="relative z-10 px-8 py-6 h-full flex items-center">
          <div className="flex items-center gap-12 w-full">
            {/* Welcome message on the left */}
            <div className="flex-1 -mt-4">
              <h1 className="text-3xl md:text-[2.625rem] font-light text-white mb-4 drop-shadow-lg tracking-tight">
                <span className="text-white/90">Welcome Back</span>
                <span className="text-white font-normal">{loading ? '...' : (userName ? `, ${userName}!` : '!')}</span>
              </h1>
              <p className="text-base md:text-lg text-white/90 mb-5 drop-shadow">
                Access your membership benefits, documents, and resources all in one place.
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
            
            {/* Latest Media on the right */}
            {latestMediaItems[0] && (
              <div className="hidden lg:block bg-white/15 backdrop-blur-sm rounded-lg p-5 max-w-md border border-white/20">
                <h3 className="text-white text-base font-medium mb-3 drop-shadow">Latest Media</h3>
                <div className="flex items-start gap-3">
                  <img 
                    src={latestMediaItems[0].image} 
                    alt={latestMediaItems[0].title}
                    className="w-28 h-20 object-cover rounded-md shadow-lg flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-white/25 text-white px-2 py-0.5 rounded backdrop-blur-sm">
                        {latestMediaItems[0].type}
                      </span>
                      <span className="text-xs text-white/70">
                        {latestMediaItems[0].date}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-white line-clamp-2 mb-2 drop-shadow">
                      {latestMediaItems[0].title}
                    </h4>
                    <button className="text-xs text-white/90 hover:text-white transition-colors font-medium">
                      Learn More →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-light text-[#2a2346] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-100 hover:bg-gray-200 rounded-lg p-6 transition-all cursor-pointer group">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-110 relative overflow-hidden"
            >
              <div 
                className="absolute inset-0" 
                style={{ 
                  background: 'linear-gradient(to right, #b8a2d4, #b19bcd, #aa94c6, #a38dbf, #9c86b8)',
                }}
              />
              <svg className="w-6 h-6 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <h3 className="font-medium text-[#2a2346] mb-2">Account Settings</h3>
            <p className="text-sm text-[#4a3d6b]">Manage your profile and preferences</p>
          </div>
          
          <div className="bg-gray-100 hover:bg-gray-200 rounded-lg p-6 transition-all cursor-pointer group">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-110 relative overflow-hidden"
            >
              <div 
                className="absolute inset-0" 
                style={{ 
                  background: 'linear-gradient(to right, #9c86b8, #957fb1, #8e78aa, #8771a3, #806a9c)',
                }}
              />
              <svg className="w-6 h-6 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
              </svg>
            </div>
            <h3 className="font-medium text-[#2a2346] mb-2">View Membership</h3>
            <p className="text-sm text-[#4a3d6b]">Check your membership details</p>
          </div>
          
          <div className="bg-gray-100 hover:bg-gray-200 rounded-lg p-6 transition-all cursor-pointer group">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-110 relative overflow-hidden"
            >
              <div 
                className="absolute inset-0" 
                style={{ 
                  background: 'linear-gradient(to right, #806a9c, #796395, #725c8e, #6b5587, #644e80)',
                }}
              />
              <svg className="w-6 h-6 text-white relative z-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="font-medium text-[#2a2346] mb-2">Payment History</h3>
            <p className="text-sm text-[#4a3d6b]">Review recent transactions</p>
          </div>
          
          <div className="bg-gray-100 hover:bg-gray-200 rounded-lg p-6 transition-all cursor-pointer group">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-110 relative overflow-hidden"
            >
              <div 
                className="absolute inset-0" 
                style={{ 
                  background: 'linear-gradient(to right, #644e80, #5d4779, #564072, #4f396b, #483264)',
                }}
              />
              <svg className="w-6 h-6 text-white relative z-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-[#2a2346] mb-2">Support Center</h3>
            <p className="text-sm text-[#4a3d6b]">Get help when you need it</p>
          </div>
        </div>
      </div>

      {/* Announcements Section */}
      {announcements && announcements.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-light text-[#2a2346] mb-6">Announcements</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {announcements.slice(0, 2).map((announcement) => (
              <div 
                key={announcement.id}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
              >
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={announcement.image}
                    alt={announcement.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Full overlay with gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />
                  
                  {/* Dark band strip for text area */}
                  <div className="absolute bottom-0 left-0 right-0 h-28 bg-purple-900/40" />
                  
                  {/* Text overlay content */}
                  <div className="absolute inset-0 p-5 flex flex-col justify-end text-white">
                    <h3 className="text-xl font-medium mb-1">{announcement.title}</h3>
                    {announcement.subtitle && (
                      <p className="text-base mb-2 text-white/90">{announcement.subtitle}</p>
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
        <div className="mt-8">
          <h2 className="text-2xl font-light text-[#2a2346] mb-6">Member Newsletters</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {memberNewsletters.slice(0, 2).map((newsletter) => (
              <div 
                key={newsletter.id}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
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
      <div className="mt-8">
        <h2 className="text-2xl font-light text-[#2a2346] mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #e6b89c 0%, #d09163 100%)' }}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
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
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #9b7fa6 0%, #6b5b7e 100%)' }}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
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