import React, { useState } from 'react';

const SupportTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const faqs = [
    {
      id: 1,
      question: 'How do I update my contact information?',
      answer: 'You can update your contact information by going to Account > Profile Settings. Make sure to save your changes after updating.',
      category: 'account'
    },
    {
      id: 2,
      question: 'When is my membership renewal due?',
      answer: 'You can view your renewal date in the Membership > Status section. We\'ll also send email reminders 30 days before renewal.',
      category: 'membership'
    },
    {
      id: 3,
      question: 'How do I download my documents?',
      answer: 'Navigate to the Documents section and click the download icon next to any document you wish to save.',
      category: 'documents'
    },
    {
      id: 4,
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and ACH bank transfers for US members.',
      category: 'payments'
    },
    {
      id: 5,
      question: 'How do I contact emergency support?',
      answer: 'For medical emergencies, call 911 immediately. For Alcor standby services, call our 24/7 hotline at 1-877-GO-ALCOR.',
      category: 'emergency'
    },
    {
      id: 6,
      question: 'Can I add family members to my plan?',
      answer: 'Yes, you can add family members through the Membership > Upgrade section or contact our support team for assistance.',
      category: 'membership'
    }
  ];

  const supportChannels = [
    {
      icon: '📧',
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      action: 'support@alcor.org',
      available: 'Mon-Fri 9AM-5PM PST'
    },
    {
      icon: '💬',
      title: 'Live Chat',
      description: 'Chat with our support team instantly',
      action: 'Start Chat',
      available: 'Mon-Fri 8AM-6PM PST'
    },
    {
      icon: '📞',
      title: 'Phone Support',
      description: 'Speak directly with a representative',
      action: '1-877-GO-ALCOR',
      available: '24/7 Emergency • Business Hours'
    },
    {
      icon: '📅',
      title: 'Schedule Call',
      description: 'Book a time that works for you',
      action: 'Book Appointment',
      available: 'Next available: Tomorrow 2PM'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Support Center</h1>
      
      <div className="bg-gradient-to-r from-[#0a1629] to-[#1e2650] rounded-lg p-8 text-white mb-8">
        <h2 className="text-2xl font-light mb-4">How can we help you today?</h2>
        <div className="max-w-2xl">
          <input 
            type="search"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-3 rounded-lg text-[#2a2346] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {supportChannels.map((channel, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">{channel.icon}</div>
            <h3 className="font-medium text-[#2a2346] mb-2">{channel.title}</h3>
            <p className="text-sm text-[#4a3d6b] mb-3">{channel.description}</p>
            <p className="font-medium text-[#0a1629] mb-1">{channel.action}</p>
            <p className="text-xs text-[#4a3d6b]">{channel.available}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Frequently Asked Questions</h2>
        
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#0a1629] text-white'
                : 'bg-gray-100 text-[#4a3d6b] hover:bg-gray-200'
            }`}
          >
            All Topics
          </button>
          <button
            onClick={() => setSelectedCategory('account')}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedCategory === 'account'
                ? 'bg-[#0a1629] text-white'
                : 'bg-gray-100 text-[#4a3d6b] hover:bg-gray-200'
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setSelectedCategory('membership')}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedCategory === 'membership'
                ? 'bg-[#0a1629] text-white'
                : 'bg-gray-100 text-[#4a3d6b] hover:bg-gray-200'
            }`}
          >
            Membership
          </button>
          <button
            onClick={() => setSelectedCategory('payments')}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedCategory === 'payments'
                ? 'bg-[#0a1629] text-white'
                : 'bg-gray-100 text-[#4a3d6b] hover:bg-gray-200'
            }`}
          >
            Payments
          </button>
        </div>

        <div className="space-y-4">
          {filteredFaqs.map((faq) => (
            <details key={faq.id} className="border border-gray-200 rounded-lg">
              <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 font-medium text-[#2a2346]">
                {faq.question}
              </summary>
              <div className="px-6 pb-4">
                <p className="text-[#4a3d6b]">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-[#2a2346] mb-4">Quick Links</h3>
          <div className="space-y-3">
            <a href="#" className="flex items-center gap-2 text-[#0a1629] hover:text-[#1e2650] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              Member Handbook (PDF)
            </a>
            <a href="#" className="flex items-center gap-2 text-[#0a1629] hover:text-[#1e2650] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              Video Tutorials
            </a>
            <a href="#" className="flex items-center gap-2 text-[#0a1629] hover:text-[#1e2650] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              Terms of Service
            </a>
            <a href="#" className="flex items-center gap-2 text-[#0a1629] hover:text-[#1e2650] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              Privacy Policy
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-[#2a2346] mb-4">Emergency Contacts</h3>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-1">24/7 Emergency Hotline</h4>
              <p className="text-2xl font-medium text-red-800">1-877-GO-ALCOR</p>
              <p className="text-sm text-red-700 mt-1">For medical emergencies, always call 911 first</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[#2a2346] mb-1">Business Hours Support</p>
              <p className="text-[#4a3d6b]">(480) 905-1906</p>
              <p className="text-sm text-[#4a3d6b]">Mon-Fri 9AM-5PM PST</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportTab;