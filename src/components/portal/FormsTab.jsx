import React from 'react';

const FormsTab = () => {
  const forms = [
    {
      category: 'Medical Forms',
      icon: '🏥',
      items: [
        { name: 'Advance Directive', status: 'Completed', date: 'Nov 15, 2024' },
        { name: 'Medical Power of Attorney', status: 'Completed', date: 'Nov 15, 2024' },
        { name: 'Do Not Resuscitate (DNR)', status: 'Not Started', date: null },
        { name: 'Health Information Release', status: 'Completed', date: 'Jan 20, 2020' }
      ]
    },
    {
      category: 'Legal Forms',
      icon: '⚖️',
      items: [
        { name: 'Last Will and Testament', status: 'In Progress', date: null },
        { name: 'Living Trust', status: 'Not Started', date: null },
        { name: 'Financial Power of Attorney', status: 'Completed', date: 'Jun 10, 2023' },
        { name: 'Beneficiary Designation', status: 'Completed', date: 'Jan 15, 2025' }
      ]
    },
    {
      category: 'Membership Forms',
      icon: '📋',
      items: [
        { name: 'Emergency Contact Form', status: 'Completed', date: 'Jan 15, 2025' },
        { name: 'Personal Information Update', status: 'Completed', date: 'Dec 1, 2024' },
        { name: 'Consent Forms', status: 'Completed', date: 'Jan 15, 2020' },
        { name: 'Photo Release', status: 'Not Started', date: null }
      ]
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'Not Started':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Forms</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-600 font-medium">Completed</span>
            <span className="text-2xl font-light text-[#2a2346]">8</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '66%' }}></div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-600 font-medium">In Progress</span>
            <span className="text-2xl font-light text-[#2a2346]">1</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '8%' }}></div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 font-medium">Not Started</span>
            <span className="text-2xl font-light text-[#2a2346]">3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gray-400 h-2 rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {forms.map((category, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{category.icon}</span>
              <h2 className="text-xl font-medium text-[#2a2346]">{category.category}</h2>
            </div>
            
            <div className="space-y-3">
              {category.items.map((form, formIdx) => (
                <div key={formIdx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-[#2a2346] mb-1">{form.name}</h3>
                      {form.date && (
                        <p className="text-sm text-[#4a3d6b]">Last updated: {form.date}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(form.status)}`}>
                        {form.status}
                      </span>
                      {form.status === 'Completed' ? (
                        <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors">
                          View
                        </button>
                      ) : form.status === 'In Progress' ? (
                        <button className="bg-[#0a1629] text-white px-4 py-1 rounded hover:bg-[#1e2650] transition-colors">
                          Continue
                        </button>
                      ) : (
                        <button className="bg-gray-100 text-[#2a2346] px-4 py-1 rounded hover:bg-gray-200 transition-colors">
                          Start
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-[#2a2346] mb-2">Need Help with Forms?</h3>
        <p className="text-[#4a3d6b] mb-4">
          Our support team can assist you with completing any forms or answer questions about required documentation.
        </p>
        <button className="bg-[#0a1629] text-white px-6 py-2 rounded-lg hover:bg-[#1e2650] transition-colors">
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default FormsTab;