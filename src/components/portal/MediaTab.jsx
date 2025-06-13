import React, { useState } from 'react';

const MediaTab = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const mediaItems = [
    {
      id: 1,
      title: 'Understanding Cryonics: A Beginner\'s Guide',
      type: 'video',
      duration: '12:45',
      category: 'educational',
      thumbnail: 'https://via.placeholder.com/300x200',
      date: 'Jan 10, 2025'
    },
    {
      id: 2,
      title: 'Annual Conference 2024 Highlights',
      type: 'video',
      duration: '45:30',
      category: 'events',
      thumbnail: 'https://via.placeholder.com/300x200',
      date: 'Dec 20, 2024'
    },
    {
      id: 3,
      title: 'Member Spotlight: Success Stories',
      type: 'article',
      readTime: '5 min read',
      category: 'stories',
      thumbnail: 'https://via.placeholder.com/300x200',
      date: 'Dec 15, 2024'
    },
    {
      id: 4,
      title: 'The Science Behind Preservation',
      type: 'podcast',
      duration: '32:15',
      category: 'educational',
      thumbnail: 'https://via.placeholder.com/300x200',
      date: 'Nov 28, 2024'
    },
    {
      id: 5,
      title: 'Facility Tour Virtual Experience',
      type: 'video',
      duration: '18:22',
      category: 'tours',
      thumbnail: 'https://via.placeholder.com/300x200',
      date: 'Nov 15, 2024'
    },
    {
      id: 6,
      title: 'Q4 2024 Newsletter',
      type: 'newsletter',
      readTime: '8 min read',
      category: 'updates',
      thumbnail: 'https://via.placeholder.com/300x200',
      date: 'Oct 1, 2024'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Media', count: mediaItems.length },
    { id: 'educational', label: 'Educational', count: 2 },
    { id: 'events', label: 'Events', count: 1 },
    { id: 'stories', label: 'Member Stories', count: 1 },
    { id: 'tours', label: 'Virtual Tours', count: 1 },
    { id: 'updates', label: 'Updates', count: 1 }
  ];

  const filteredMedia = selectedCategory === 'all' 
    ? mediaItems 
    : mediaItems.filter(item => item.category === selectedCategory);

  const getTypeIcon = (type) => {
    switch(type) {
      case 'video':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
        );
      case 'podcast':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
          </svg>
        );
      case 'article':
      case 'newsletter':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Media Library</h1>
      
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedCategory === category.id
                ? 'bg-[#0a1629] text-white'
                : 'bg-white text-[#4a3d6b] hover:bg-gray-100'
            }`}
          >
            {category.label} ({category.count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMedia.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
            <div className="relative">
              <img 
                src={item.thumbnail} 
                alt={item.title}
                className="w-full h-48 object-cover"
              />
              {item.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-black/70 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              )}
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                {getTypeIcon(item.type)}
                <span>{item.type}</span>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-medium text-[#2a2346] mb-2 line-clamp-2">{item.title}</h3>
              <div className="flex items-center justify-between text-sm text-[#4a3d6b]">
                <span>{item.date}</span>
                <span>{item.duration || item.readTime}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-gradient-to-r from-[#0a1629] to-[#1e2650] rounded-lg p-8 text-white">
        <h2 className="text-2xl font-light mb-4">Featured: 2025 Research Update</h2>
        <p className="text-white/90 mb-6">
          Join our Chief Science Officer for an in-depth look at the latest breakthroughs in cryonic preservation technology.
        </p>
        <button className="bg-white text-[#0a1629] px-6 py-2 rounded-lg hover:bg-white/90 transition-colors font-medium">
          Watch Now
        </button>
      </div>
    </div>
  );
};

export default MediaTab;