"use client";

import { useMemo } from "react";
import { getClubConfig } from "./getClubConfig";
import type { ClubConfig } from "./club";

/**
 * React hook to access club configuration in client components
 */
export function useClubConfig(): ClubConfig {
  return useMemo(() => getClubConfig(), []);
}

