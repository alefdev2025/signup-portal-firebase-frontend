// Announcements configuration file
// Update this array to manage announcements displayed on the portal

// Import announcement images
import boardRoomImage from '../../assets/images/annoucements/alcor-board-room.png';
import texasDowntownImage from '../../assets/images/annoucements/texas-downtown.png';

// Helper function to format dates
const formatDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
};

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
  } else {
    return formatDate(date);
  }
};

// Announcement data
const announcementData = [
  {
    id: 1,
    title: "Alcor Public Board Meeting",
    subtitle: "June 14th at 11am MST",
    image: boardRoomImage,
    date: "2024-12-10",
    description: "Join us for our public board meeting where we'll discuss organizational updates and future initiatives",
    link: "https://www.reddit.com/r/cryonics/comments/1jxg6l8/reminder_alcor_public_board_meeting_today_at_11am/",
    eventDate: "June 14, 2025",
    eventTime: "11:00 AM MST"
  },
  {
    id: 2,
    title: "Alcor is Visiting Members in Texas",
    subtitle: "June 27th to June 29th",
    image: texasDowntownImage,
    date: "2024-12-05",
    description: "Meet with Alcor representatives during our Texas member visit. Connect with fellow members and learn about our latest developments",
    link: "https://www.reddit.com/r/cryonics/comments/1l4z197/alcor_is_visiting_members_in_texas_june_27th_to/",
    eventDate: "June 27-29, 2025",
    location: "Texas"
  }
];

// Export announcements with formatted dates
export const announcements = announcementData.map(announcement => ({
  ...announcement,
  formattedDate: getRelativeTime(announcement.date),
  fullDate: formatDate(announcement.date)
}));

// Get the latest announcements
export const latestAnnouncements = announcements.slice(0, 2);