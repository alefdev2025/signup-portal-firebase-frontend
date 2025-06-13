import React from 'react';

const ResourcesTab = () => {
  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Resources</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600" />
          <div className="p-6">
            <h3 className="text-lg font-medium text-[#2a2346] mb-2">Video Library</h3>
            <p className="text-sm text-[#4a3d6b] mb-4">Educational videos and tutorials</p>
            <p className="text-sm font-medium text-[#0a1629]">24 videos</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
          <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600" />
          <div className="p-6">
            <h3 className="text-lg font-medium text-[#2a2346] mb-2">Knowledge Base</h3>
            <p className="text-sm text-[#4a3d6b] mb-4">Articles and guides</p>
            <p className="text-sm font-medium text-[#0a1629]">156 articles</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
          <div className="h-2 bg-gradient-to-r from-green-500 to-green-600" />
          <div className="p-6">
            <h3 className="text-lg font-medium text-[#2a2346] mb-2">Webinar Archive</h3>
            <p className="text-sm text-[#4a3d6b] mb-4">Past webinar recordings</p>
            <p className="text-sm font-medium text-[#0a1629]">18 webinars</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesTab;