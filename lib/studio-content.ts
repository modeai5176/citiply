// Content for the homepage "Citiply Studio" section and the site's social links.
//
// Video files: drop raw exports into `video-source/studio/`, add an entry to the
// MANIFEST in `scripts/optimize-studio-videos.py`, then run
//   python scripts/optimize-studio-videos.py
// which writes web-ready muted loops + posters to `public/videos/studio/`.

export type SocialPlatform = "instagram" | "youtube" | "facebook";

export type SocialChannel = {
  platform: SocialPlatform;
  label: string;
  handle: string;
  url: string;
  blurb: string;
};

export const SOCIAL_CHANNELS: SocialChannel[] = [
  { platform: "instagram", label: "Instagram", handle: "@citi.ply", url: "https://www.instagram.com/citi.ply/", blurb: "Reels, textures and showroom moments" },
  { platform: "youtube", label: "YouTube", handle: "@CitiplyPune", url: "https://www.youtube.com/@CitiplyPune/shorts", blurb: "Podcasts, shorts and factory visits" },
  { platform: "facebook", label: "Facebook", handle: "Citiply", url: "https://www.facebook.com/profile.php?id=61577983087681", blurb: "Showroom news and events" }
];

export const INSTAGRAM = SOCIAL_CHANNELS[0];
export const YOUTUBE = SOCIAL_CHANNELS[1];

export type StudioEpisode = {
  id: string;
  series: string;
  episode: string;
  title: string;
  guest?: string;
  description?: string;
  duration: string;
  url: string;
  /** Muted highlights loop that autoplays in the featured player. */
  highlights: string;
  poster: string;
};

export const FEATURED_EPISODE: StudioEpisode = {
  id: "reflect-and-design-ep1",
  series: "Reflect & Design",
  episode: "Ep. 1",
  title: "The Way of TAO: Architecture That Heals, Inspires & Connects",
  guest: "Manish Banker",
  description: "A conversation on healing spaces, ancient wisdom and designing for the way people actually live.",
  duration: "39:35",
  url: "https://youtu.be/2SckpGsrkoo",
  highlights: "/videos/studio/reflect-and-design-ep1.mp4",
  poster: "/videos/studio/reflect-and-design-ep1.jpg"
};

export type ShortCategory = "Showroom" | "Materials" | "Events" | "Factory" | "Client stories";

export type StudioShort = {
  id: string;
  title: string;
  category: ShortCategory;
  source: "youtube" | "instagram";
  url: string;
  video: string;
  poster: string;
};

const clip = (name: string) => ({ video: `/videos/studio/${name}.mp4`, poster: `/videos/studio/${name}.jpg` });

// TODO: swap the YouTube shorts' channel link for each short's own URL when available.
export const STUDIO_SHORTS: StudioShort[] = [
  { id: "pune-showroom", title: "The Citiply experience at our Pune showroom", category: "Showroom", source: "youtube", url: YOUTUBE.url, ...clip("short-pune-showroom") },
  { id: "texture-is-design", title: "Texture is design: embossed wooden veneers", category: "Materials", source: "instagram", url: "https://www.instagram.com/reel/DV-va0gDA4e/", ...clip("reel-texture-is-design") },
  { id: "ai-digest", title: "Citiply at A&I Digest Design Exhibition 2025", category: "Events", source: "youtube", url: YOUTUBE.url, ...clip("short-ai-digest-exhibition") },
  { id: "veneer-factory", title: "Inside the natural veneers factory", category: "Factory", source: "youtube", url: YOUTUBE.url, ...clip("short-veneer-factory") },
  { id: "joshi-buildcon", title: "Amol & Rajas Joshi of Joshi Buildcon on sourcing with Citiply", category: "Client stories", source: "instagram", url: "https://www.instagram.com/reel/DWGlkufEm6I/", ...clip("reel-joshi-buildcon") },
  { id: "just-a-showroom", title: "It's just a showroom in Pune… or is it?", category: "Showroom", source: "instagram", url: "https://www.instagram.com/reel/DWOJPuGjK9b/", ...clip("reel-just-a-showroom") },
  { id: "more-than-a-surface", title: "More than a surface", category: "Materials", source: "instagram", url: INSTAGRAM.url, ...clip("reel-more-than-a-surface") },
  { id: "showroom-tour", title: "A walk past our carved doors and veneer walls", category: "Showroom", source: "instagram", url: "https://www.instagram.com/reel/DVU6xI0kgRx/", ...clip("reel-showroom-tour") }
];
