// Latest Media configuration file
// Update this array to change what appears in the Latest Media section

import podcastImage from '../../assets/images/podcast-image.png';
// Import other media images here as you add them
// import articleImage from '../../assets/images/article-image.png';
// import videoImage from '../../assets/images/video-image.png';
// import researchImage from '../../assets/images/research-image.png';

// Helper function to calculate relative time
const getRelativeTime = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInMs = now - past;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 14) {
    return '1 week ago';
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 60) {
    return '1 month ago';
  } else {
    const months = Math.floor(diffInDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
};

// Media items with actual dates
const mediaData = [
  {
    id: 1,
    title: "Deployment and Recovery: Inside Alcor's DART Team Part 2",
    image: podcastImage,
    date: "2025-06-02", // Specify the actual date
    type: "Podcast"
  },
  {
    id: 2,
    title: "Member Spotlight: 50 Years of Alcor",
    image: podcastImage, // Replace with actual image when available
    date: "2024-12-05",
    type: "Video"
  },
  {
    id: 3,
    title: "Advances in Vitrification Technology",
    image: podcastImage, // Replace with actual image when available
    date: "2024-11-28",
    type: "Research"
  },
  {
    id: 4,
    title: "Annual Conference Highlights 2024",
    image: podcastImage, // Replace with actual image when available
    date: "2024-11-21",
    type: "Event"
  }
];

// Export the items with calculated relative dates
export const latestMediaItems = mediaData.map(item => ({
  ...item,
  date: getRelativeTime(item.date),
  originalDate: item.date // Keep original date in case you need it
}));