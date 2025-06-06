// File: data/FundingCardsData.js
import insuranceImage from "../../assets/images/policy-purple.png";
import prepayImage from "../../assets/images/bank-purple.png";
import laterImage from "../../assets/images/decision-tree-purple.png";

// Define funding options with all card content
export const fundingOptions = {
  insurance: {
    id: "insurance",
    title: "Life Insurance",
    description: "Most affordable option with manageable monthly premiums",
    icon: insuranceImage,
    badge: {
      text: "MOST POPULAR",
      bgColor: "bg-[#15263f]",
      textColor: "text-white"
    },
    pricing: {
      cost: "$25-250/month",
      complexity: "Simple",
      costColor: "text-[#49355B]"
    },
    benefits: [
      "Low monthly payments",
      "Term or Whole Life Options"
    ],
    detailsSection: {
      title: "Life Insurance Details",
      subtitle: "Select your preferred insurance option:",
      subOptions: {
        new: {
          id: "new",
          title: "New Policy",
          description: "We'll connect you with specialized insurance providers for your cryonics arrangement.",
          icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
          resources: {
            title: "Find a policy now",
            badge: "GET STARTED",
            items: [
              "Insurance Guide (PDF)",
              "Provider Directory"
            ]
          }
        },
        existing: {
          id: "existing",
          title: "Existing Policy",
          description: "Please provide details about your existing policy to add Alcor as a beneficiary.",
          icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
          form: {
            fields: [
              {
                id: "insuranceCompany",
                label: "Insurance Company *",
                type: "text",
                placeholder: "e.g. Prudential, New York Life",
                required: true
              },
              {
                id: "policyNumber",
                label: "Policy Number",
                type: "text",
                placeholder: "Optional - Your policy number",
                required: false
              },
              {
                id: "coverageAmount",
                label: "Coverage Amount",
                type: "currency",
                placeholder: "Optional - Total coverage amount",
                required: false
              }
            ],
            helpText: "Our team will help you add Alcor as a beneficiary to your policy."
          }
        }
      }
    }
  },
  prepay: {
    id: "prepay",
    title: "Prepayment",
    description: "Pay upfront for the full cryopreservation amount",
    icon: prepayImage,
    badge: {
      text: "EASIEST",
      bgColor: "bg-white border border-gray-300",
      textColor: "text-gray-700"
    },
    pricing: {
      cost: "One-time", // Will be dynamic based on package
      complexity: "Very Simple",
      costColor: "text-[#2D3050]",
      costLabel: "Cost"
    },
    benefits: [
      "Single payment covers all costs",
      "No ongoing insurance payments"
    ],
    detailsSection: {
      title: "Prepayment Process",
      subtitle: "Here's what to expect with the prepayment option:",
      steps: [
        "Complete your membership signup",
        "Our team will contact you within 2 days",
        "You'll receive payment instructions",
        "We'll confirm your funded status"
      ]
    }
  },
  later: {
    id: "later",
    title: "Decide Later",
    description: "Start your membership today, decide on funding method later",
    icon: laterImage,
    badge: {
      text: "MOST FLEXIBLE",
      bgColor: "bg-white border border-gray-300",
      textColor: "text-gray-700"
    },
    pricing: {
      cost: "Cryopreservation",
      complexity: "At Your Own Pace",
      costLabel: "Intent:",
      complexityLabel: "Funding:",
      costColor: "text-[#13233e]"
    },
    benefits: [
      "Start cryopreservation contract",
      "Decide after more information"
    ],
    detailsSection: {
      title: "Basic Membership & Future Funding",
      subtitle: "",
      description: "By selecting this option, you'll start the process of a cryopreservation contract, taking time to decide on your preferred funding method. We'll connect you with our team that can help you consider your funding options."
    }
  }
};

// Basic membership specific content
export const basicMembershipContent = {
  title: "Basic Membership",
  annualCost: "$540/year", // Default, will be dynamic
  cards: {
    whatHappensNext: {
      title: "What happens next?",
      bgGradient: "bg-gradient-to-l from-[#323053] to-[#454575]",
      iconBg: "bg-[#575790]",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      description: "After completing your Basic Membership, you'll receive information about upgrading to cryopreservation. Your Alcor advisor will guide you through options when you're ready.",
      futureOptions: [
        {
          icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
          text: "Life Insurance (monthly premiums)"
        },
        {
          icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
          text: "Prepayment (one-time payment)"
        }
      ]
    },
    fundingNotice: {
      title: "Funding Notice",
      bgGradient: "bg-gradient-to-l from-[#11243a] to-[#1c324c]",
      iconBg: "bg-[#293253]",
      icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      description: "With a Basic Membership, you don't need to set up life insurance or prepayment for cryopreservation at this time. Your membership begins with annual dues only.",
      includedFeatures: [
        "Member Events & Resources",
        "Pet Preservation Options",
        "Add On Cryopreservation Anytime",
        "Consultation Services"
      ]
    }
  }
};

// Helper function to get available funding options based on package type
export const getAvailableFundingOptions = (packageInfo) => {
  if (!packageInfo) return ["insurance", "prepay", "later"];
  
  // For basic membership, only show "later" option
  if (packageInfo.preservationType === "basic") {
    return ["later"];
  }
  
  return ["insurance", "prepay", "later"];
};

// Helper function to format currency
export const formatCurrency = (amount) => {
  if (!amount) return "";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper function to get dynamic pricing text
export const getDynamicPricing = (optionId, packageInfo) => {
  if (optionId === "prepay" && packageInfo && packageInfo.preservationType !== "basic") {
    return formatCurrency(packageInfo.preservationEstimate);
  }
  return fundingOptions[optionId].pricing.cost;
};