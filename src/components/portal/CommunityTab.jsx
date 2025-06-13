import React from 'react';

const CommunityTab = () => {
  const upcomingEvents = [
    {
      id: 1,
      title: 'Monthly Member Meetup - Seattle',
      date: 'Feb 15, 2025',
      time: '6:00 PM PST',
      type: 'In-Person',
      location: 'Seattle Community Center',
      attendees: 24
    },
    {
      id: 2,
      title: 'Virtual Q&A with Research Team',
      date: 'Feb 20, 2025',
      time: '5:00 PM PST',
      type: 'Virtual',
      location: 'Zoom',
      attendees: 89
    },
    {
      id: 3,
      title: 'Annual Conference 2025',
      date: 'May 15-17, 2025',
      time: 'All Day',
      type: 'Hybrid',
      location: 'Phoenix, AZ',
      attendees: 156
    }
  ];

  const forumTopics = [
    {
      id: 1,
      title: 'New Member Introduction Thread',
      author: 'Sarah Johnson',
      replies: 45,
      lastActivity: '2 hours ago',
      category: 'Welcome'
    },
    {
      id: 2,
      title: 'Discussion: Latest Research Papers',
      author: 'Dr. Michael Chen',
      replies: 23,
      lastActivity: '5 hours ago',
      category: 'Science'
    },
    {
      id: 3,
      title: 'Share Your Story: Why I Joined Alcor',
      author: 'Emily Rodriguez',
      replies: 67,
      lastActivity: '1 day ago',
      category: 'Stories'
    },
    {
      id: 4,
      title: 'Technical Q&A: Understanding the Process',
      author: 'Technical Team',
      replies: 34,
      lastActivity: '2 days ago',
      category: 'Education'
    }
  ];

  const memberStats = [
    { label: 'Active Members', value: '3,247' },
    { label: 'Countries Represented', value: '42' },
    { label: 'Forum Posts This Month', value: '892' },
    { label: 'Events This Year', value: '36' }
  ];

  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Community</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {memberStats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg p-4 text-center">
            <p className="text-2xl font-light text-[#2a2346]">{stat.value}</p>
            <p className="text-sm text-[#4a3d6b]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-medium text-[#2a2346] mb-6">Upcoming Events</h2>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-[#2a2346]">{event.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    event.type === 'Virtual' 
                      ? 'bg-blue-100 text-blue-700'
                      : event.type === 'In-Person'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {event.type}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-[#4a3d6b]">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{event.location}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-[#4a3d6b]">{event.attendees} attending</span>
                  <button className="bg-[#0a1629] text-white px-4 py-1 rounded hover:bg-[#1e2650] transition-colors text-sm">
                    RSVP
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-medium text-[#2a2346] mb-6">Community Forum</h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-4">
              {forumTopics.map((topic) => (
                <div key={topic.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-[#2a2346] hover:text-[#0a1629] cursor-pointer">
                      {topic.title}
                    </h3>
                    <span className="bg-gray-100 text-[#4a3d6b] px-2 py-1 rounded text-xs">
                      {topic.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#4a3d6b]">
                    <span>by {topic.author}</span>
                    <span>•</span>
                    <span>{topic.replies} replies</span>
                    <span>•</span>
                    <span>{topic.lastActivity}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 bg-gray-100 text-[#2a2346] px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              View All Forum Topics
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-xl font-medium text-[#2a2346] mb-4">Connect with Members</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#0a1629] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3 className="font-medium text-[#2a2346] mb-2">Member Directory</h3>
            <p className="text-sm text-[#4a3d6b] mb-3">Connect with members in your area</p>
            <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors text-sm">
              Browse Directory →
            </button>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-[#0a1629] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
              </svg>
            </div>
            <h3 className="font-medium text-[#2a2346] mb-2">Discussion Groups</h3>
            <p className="text-sm text-[#4a3d6b] mb-3">Join topic-specific conversations</p>
            <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors text-sm">
              Join Groups →
            </button>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-[#0a1629] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <h3 className="font-medium text-[#2a2346] mb-2">Mentorship Program</h3>
            <p className="text-sm text-[#4a3d6b] mb-3">Get guidance from experienced members</p>
            <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors text-sm">
              Learn More →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityTab;