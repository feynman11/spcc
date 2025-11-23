"use client";

import { useEffect } from "react";
import { useClubConfig } from "@/lib/config/useClubConfig";

export function ConsoleWelcome() {
  const clubConfig = useClubConfig();

  useEffect(() => {
    console.log(
      `%cWelcome to ${clubConfig.name}! 🚴`,
      `color: ${clubConfig.colors.primary}; font-size: 20px; font-weight: bold; padding: 10px;`
    );
    if (clubConfig.github) {
      console.log(
        "%cCheck out our code on GitHub:",
        "color: #374151; font-size: 14px; padding: 5px;"
      );
      console.log(clubConfig.github);
    }
    console.log(
      "%cHappy coding! 🚀",
      "color: #059669; font-size: 14px; font-weight: bold; padding: 5px;"
    );
  }, [clubConfig]);

  return null;
}

