// Member Newsletters configuration file
// Update this array to manage newsletters displayed on the portal

import februaryNewsletter from '../../assets/images/newsletters/february-newsletter.png';
import springNewsletter from '../../assets/images/newsletters/spring-newsletter.png';
// Import additional newsletter images here as you add them
// import summerNewsletter from '../../assets/images/newsletters/summer-newsletter.png';

// Helper function to format dates
const formatDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
};

// Newsletter data with actual dates
const newsletterData = [
  {
    id: 1,
    title: "March 2024 Newsletter",
    image: februaryNewsletter,
    date: "2024-02-01",
    description: "Latest updates on research, member stories, and upcoming events"
  },
  {
    id: 2,
    title: "April 2024 Newsletter",
    image: springNewsletter,
    date: "2024-03-20",
    description: "Spring conference highlights and new technology developments"
  }
];

// Export newsletters with formatted dates
export const memberNewsletters = newsletterData.map(newsletter => ({
  ...newsletter,
  formattedDate: formatDate(newsletter.date)
}));

// Get the most recent newsletter
export const latestNewsletter = memberNewsletters[0];