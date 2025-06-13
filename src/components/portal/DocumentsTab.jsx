import React from 'react';

const DocumentsTab = () => {
  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Documents</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">📄</div>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">3 files</span>
          </div>
          <h3 className="text-lg font-medium text-[#2a2346] mb-2">Contracts</h3>
          <p className="text-sm text-[#4a3d6b]">Most recent: Membership Agreement</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">🏥</div>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">2 files</span>
          </div>
          <h3 className="text-lg font-medium text-[#2a2346] mb-2">Medical Directives</h3>
          <p className="text-sm text-[#4a3d6b]">Most recent: Advance Directive</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">⚖️</div>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">5 files</span>
          </div>
          <h3 className="text-lg font-medium text-[#2a2346] mb-2">Legal Forms</h3>
          <p className="text-sm text-[#4a3d6b]">Most recent: Power of Attorney</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">📚</div>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">12 files</span>
          </div>
          <h3 className="text-lg font-medium text-[#2a2346] mb-2">Educational Materials</h3>
          <p className="text-sm text-[#4a3d6b]">Most recent: Member Handbook</p>
        </div>
      </div>
    </div>
  );
};

export default DocumentsTab;