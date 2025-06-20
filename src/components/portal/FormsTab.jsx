import React from 'react';
import { Download, FileText, Heart, Shield, Users, Clipboard } from 'lucide-react';

const FormsTab = () => {
  const gradientColors = [
    { color: '#12233b', stop: 0 },
    { color: '#272b4d', stop: 10 },
    { color: '#3b345b', stop: 20 },
    { color: '#4b3865', stop: 30 },
    { color: '#5d4480', stop: 40 },
    { color: '#6c5578', stop: 50 },
    { color: '#7b5670', stop: 60 },
    { color: '#8a5f64', stop: 70 },
    { color: '#996b66', stop: 80 },
    { color: '#ae7968', stop: 85 },
    { color: '#c2876a', stop: 88 },
    { color: '#d4a85f', stop: 91 },
    { color: '#ddb571', stop: 92.5 },
    { color: '#e4c084', stop: 94 },
    { color: '#e9ca96', stop: 95.5 },
    { color: '#efd3a8', stop: 97 },
    { color: '#f7ddb5', stop: 98.5 },
    { color: '#ffd4a3', stop: 100 }
  ];

  const formCategories = [
    {
      title: "Essential Membership Forms",
      icon: FileText,
      gradientId: "gradient-essential",
      description: "Core documents for Alcor membership",
      forms: [
        {
          title: "Membership Overview",
          description: "Complete guide to becoming an Alcor member.",
          fileName: "Membership_Overview.pdf",
          pages: 2
        },
        {
          title: "Alcor Health Survey 2024",
          description: "Health information form for cryopreservation preparation.",
          fileName: "Health_Survey_2024.pdf",
          pages: 3
        },
        {
          title: "Preservation Options",
          description: "Comparison of neuropreservation vs whole-body.",
          fileName: "Neuro_vs_WholBody_Options.pdf",
          pages: 2
        }
      ]
    },
    {
      title: "Medical & Legal Directives",
      icon: Shield,
      gradientId: "gradient-medical",
      description: "Legal documents for healthcare decisions",
      forms: [
        {
          title: "Advance Directive & POA",
          description: "Legal document for medical treatment wishes.",
          fileName: "POA_Healthcare_Directive.docx",
          pages: 8
        },
        {
          title: "Hospital Information Sheet",
          description: "One-page summary for medical professionals.",
          fileName: "Hospital_Info_Sheet.pdf",
          pages: 1
        },
        {
          title: "Emergency Notification Guide",
          description: "When and how to notify Alcor.",
          fileName: "Emergency_Notification.pdf",
          pages: 2
        }
      ]
    },
    {
      title: "Future Planning Documents",
      icon: Heart,
      gradientId: "gradient-future",
      description: "Preferences for revival preparation",
      forms: [
        {
          title: "Revival Preferences",
          description: "Express your revival timing and coordination wishes.",
          fileName: "Revival_Preferences.docx",
          pages: 4
        },
        {
          title: "Memory Box Information",
          description: "Guide to creating a personal time capsule.",
          fileName: "Memory_Box_Guide.pdf",
          pages: 3
        }
      ]
    },
    {
      title: "Insurance & Financial",
      icon: Users,
      gradientId: "gradient-insurance",
      description: "Funding your cryopreservation",
      forms: [
        {
          title: "Insurance Agent Directory",
          description: "Agents experienced with cryonics funding.",
          fileName: "Insurance_Agent_Directory.docx",
          pages: 2
        },
        {
          title: "Costs Breakdown",
          description: "Membership fees and preservation costs.",
          fileName: "Costs_Breakdown.pdf",
          pages: 2
        }
      ]
    },
    {
      title: "Scientific & Educational Resources",
      icon: Clipboard,
      gradientId: "gradient-scientific",
      description: "Research and educational materials",
      forms: [
        {
          title: "Why Cryonics Makes Sense",
          description: "Tim Urban's comprehensive article.",
          fileName: "Why_Cryonics_Makes_Sense.pdf",
          pages: 16
        },
        {
          title: "Memory Persistence Research",
          description: "Scientific paper on memory retention.",
          fileName: "Memory_Persistence_Research.pdf",
          pages: 6
        }
      ]
    }
  ];

  const handleDownload = (fileName) => {
    // In a real implementation, this would trigger the actual file download
    console.log(`Downloading ${fileName}`);
    // You can replace this with actual download logic
    // For example: window.open(`/api/download/${fileName}`, '_blank');
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* SVG Gradient Definitions */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {formCategories.map((category) => (
            <linearGradient key={category.gradientId} id={category.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {gradientColors.map((color, index) => (
                <stop key={index} offset={`${color.stop}%`} stopColor={color.color} />
              ))}
            </linearGradient>
          ))}
        </defs>
      </svg>

      {/* Form Categories */}
      <div className="space-y-12">
        {formCategories.map((category, categoryIndex) => {
          const IconComponent = category.icon;
          return (
            <div key={categoryIndex}>
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-8">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, #4b3865 0%, #5d4480 25%, #6c5578 50%, #7b5670 75%, #8a5f64 100%)` }}
                >
                  <IconComponent 
                    className="w-5 h-5 text-white" 
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{category.title}</h2>
                  <p className="text-gray-500 text-sm mt-1 font-light">{category.description}</p>
                </div>
              </div>

              {/* Form Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {category.forms.map((form, formIndex) => (
                  <div 
                    key={formIndex} 
                    className="bg-white rounded-xl p-6 transition-all duration-300 hover:shadow-md flex flex-col h-full relative border border-gray-100"
                  >
                    <button
                      onClick={() => handleDownload(form.fileName)}
                      className="absolute top-5 right-5 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                      aria-label={`Download ${form.title}`}
                    >
                      <Download className="w-5 h-5" style={{ color: '#5d4480' }} strokeWidth={1.5} />
                    </button>
                    <div className="flex items-start justify-between mb-4 pr-12">
                      <h3 className="text-lg font-medium text-gray-800 flex-1">{form.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed flex-grow font-light">{form.description}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default FormsTab;