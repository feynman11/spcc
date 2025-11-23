export interface ClubConfig {
  name: string;
  shortName: string;
  location: string;
  description: string;
  logo: string;
  colors: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
  };
  social: {
    strava?: string;
    instagram?: string;
    email: string;
  };
  metadata: {
    title: string;
    description: string;
  };
  welcomeText: {
    home: string;
    signin: string;
    welcome: string;
  };
  github?: string;
}

