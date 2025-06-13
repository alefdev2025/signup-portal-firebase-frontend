import React from 'react';

const ContractsTab = () => {
  const contracts = [
    { 
      id: 1, 
      name: 'Membership Agreement', 
      status: 'Active',
      signedDate: 'Jan 15, 2025',
      expiryDate: 'Jan 15, 2026',
      type: 'Primary'
    },
    { 
      id: 2, 
      name: 'Cryopreservation Agreement', 
      status: 'Active',
      signedDate: 'Jan 15, 2020',
      expiryDate: 'Lifetime',
      type: 'Primary'
    },
    { 
      id: 3, 
      name: 'Standby Service Agreement', 
      status: 'Active',
      signedDate: 'Mar 1, 2023',
      expiryDate: 'Mar 1, 2026',
      type: 'Supplemental'
    },
    { 
      id: 4, 
      name: 'Privacy Agreement', 
      status: 'Active',
      signedDate: 'Jan 15, 2020',
      expiryDate: 'N/A',
      type: 'Legal'
    }
  ];

  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Contracts</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-yellow-800">
            Your Standby Service Agreement will expire in 60 days. 
            <button className="underline ml-1 font-medium">Renew now</button>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Active Contracts</h2>
        
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div key={contract.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-[#2a2346] mb-1">{contract.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-[#4a3d6b]">
                    <span>Signed: {contract.signedDate}</span>
                    <span>•</span>
                    <span>Expires: {contract.expiryDate}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  contract.status === 'Active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {contract.status}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="bg-gray-100 text-[#2a2346] px-3 py-1 rounded text-sm">
                  {contract.type} Contract
                </span>
                <div className="flex items-center gap-3">
                  <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                  <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-4">Contract History</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium text-[#2a2346]">Membership Agreement - 2024</p>
              <p className="text-[#4a3d6b]">Expired Jan 14, 2025</p>
            </div>
            <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors">
              View Archive
            </button>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium text-[#2a2346]">Membership Agreement - 2023</p>
              <p className="text-[#4a3d6b]">Expired Jan 14, 2024</p>
            </div>
            <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors">
              View Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractsTab;