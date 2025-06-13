import React from 'react';

const FinancialDocumentsTab = () => {
  const documents = [
    { id: 1, name: 'Annual Statement 2024', date: 'Dec 31, 2024', size: '245 KB', type: 'PDF' },
    { id: 2, name: 'Tax Receipt 2024', date: 'Jan 15, 2025', size: '156 KB', type: 'PDF' },
    { id: 3, name: 'Payment History 2024', date: 'Dec 31, 2024', size: '89 KB', type: 'PDF' },
    { id: 4, name: 'Investment Summary', date: 'Nov 30, 2024', size: '312 KB', type: 'PDF' },
    { id: 5, name: 'Fee Schedule 2025', date: 'Jan 1, 2025', size: '67 KB', type: 'PDF' }
  ];

  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Financial Documents</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-[#2a2346]">Your Financial Records</h2>
          <button className="bg-[#0a1629] text-white px-4 py-2 rounded-lg hover:bg-[#1e2650] transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Upload Document
          </button>
        </div>

        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,11V19H8V11H10M14,11V19H12V11H14M16,13V19H14V13H16Z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#2a2346]">{doc.name}</h3>
                    <p className="text-sm text-[#4a3d6b]">Uploaded on {doc.date} • {doc.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-[#2a2346] mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#4a3d6b]">Total Documents</span>
              <span className="font-medium text-[#2a2346]">5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#4a3d6b]">Last Updated</span>
              <span className="font-medium text-[#2a2346]">Jan 15, 2025</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#4a3d6b]">Total Size</span>
              <span className="font-medium text-[#2a2346]">869 KB</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-[#2a2346] mb-4">Document Categories</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#4a3d6b]">Statements</span>
              <span className="bg-gray-100 text-[#2a2346] px-2 py-1 rounded text-sm">2</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#4a3d6b]">Tax Documents</span>
              <span className="bg-gray-100 text-[#2a2346] px-2 py-1 rounded text-sm">1</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#4a3d6b]">Other</span>
              <span className="bg-gray-100 text-[#2a2346] px-2 py-1 rounded text-sm">2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDocumentsTab;