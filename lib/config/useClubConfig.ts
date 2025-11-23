"use client";

import { useMemo } from "react";
import { getClubConfig, type ClubConfig } from "./getClubConfig";

/**
 * React hook to access club configuration in client components
 */
export function useClubConfig(): ClubConfig {
  return useMemo(() => getClubConfig(), []);
}

