import { clubConfig } from "../../club.config";
import type { ClubConfig } from "./club";

/**
 * Get the club configuration
 * This function can be extended in the future to support multiple clubs
 * by checking environment variables or other configuration sources
 */
export function getClubConfig(): ClubConfig {
  return clubConfig;
}

