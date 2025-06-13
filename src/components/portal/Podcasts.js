// Podcasts configuration file
// Update this array to manage podcasts displayed on the portal

// Import podcast image (you can update this path to your actual podcast image)
import podcastImage from '../../assets/images/podcast-image.png';
// Fallback to media image if podcast image doesn't exist
import { latestMediaItems } from './LatestMedia';

const podcastCoverImage = podcastImage || latestMediaItems[0]?.image || '/podcast-placeholder.jpg';

// Podcast data
export const podcasts = [
  {
    id: 1,
    title: "Deployment and Recovery: Inside Alcor's DART Team - Part 2",
    episode: 5,
    duration: "1:15:31",
    image: podcastCoverImage,
    date: "2025-06-02",
    description: "This is Part 2 of our DART series with Alcor's Medical Response Director, Shelby Calkins. If you haven't listened to Part 1, you should"
  },
  {
    id: 2,
    title: "Deployment and Recovery: Inside Alcor's DART Team - Part 1", 
    episode: 4,
    duration: "55:35",
    image: podcastCoverImage,
    date: "2025-04-23",
    description: "Episode Overview In this very important episode, Alcor pulls back the curtain on one of its most critical operations: the Deployment and Recovery Team (DART). Join medical response director Shelby Calkins as she provides an in-dept..."
  },
  {
    id: 3,
    title: "Bringing DART to Your Doorstep",
    episode: 3,
    duration: "1:03:17", 
    image: podcastCoverImage,
    date: "2025-02-27",
    description: "In this episode of The Alcor Podcast, we take a look at how the newly formed Alcor Canada is making cryonics more accessible. Their donor-supported model isn't just for Canada—it's an approach that could work anywhere, bringing cryonics resourc..."
  },
  {
    id: 4,
    title: "Making Alcor Europe a Reality",
    episode: 2,
    duration: "49:03",
    image: podcastCoverImage,
    date: "2025-01-17",
    description: "In this episode of The Alcor Podcast, I sit down with Alcor's new International Development Coordinator, Jeremy Wiggins, and Alcor CEO, James Arrowood, to discuss the recently announced Alcor Europe."
  },
  {
    id: 5,
    title: "Big Changes at Alcor",
    episode: 1,
    duration: "1:09:38",
    image: podcastCoverImage,
    date: "2024-12-13",
    description: "In this inaugural episode of The Alcor Podcast, I sit down with Alcor CEO James Arrowood to discuss the organization's largest expansion in its history. From a growing research team to international development, we explore the significant chang..."
  }
];

// Get the latest podcasts
export const latestPodcasts = podcasts.slice(0, 5);