import type { ClubConfig } from "./lib/config/club";

export const clubConfig: ClubConfig = {
  name: "South Peaks Cycling Club",
  shortName: "South Peaks",
  location: "Borrowash, Derbyshire",
  description:
    "Based in the heart of Borrowash, Derbyshire, we're a passionate community of cyclists exploring the beautiful Peak District and surrounding countryside. Whether you're a beginner looking to build confidence or an experienced rider seeking new challenges, SPCC welcomes cyclists of all abilities.",
  logo: "/spcc_logo.jpg",
  colors: {
    primary: "#dc2626",
    primaryHover: "#b91c1c",
    primaryLight: "#fef2f2",
  },
  social: {
    strava: "https://www.strava.com/clubs/451869",
    instagram: "https://www.instagram.com/southpeakscc/#",
    email: "info@southpeakscc.co.uk",
  },
  metadata: {
    title: "South Peaks Cycle Club",
    description: "Join our community of passionate cyclists",
  },
  welcomeText: {
    home: "Welcome to South Peaks Cycling Club",
    signin: "Join our community of passionate cyclists",
    welcome: "Thank you for signing up!",
  },
  github: "https://github.com/feynman11/spcc",
};

