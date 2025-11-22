"use client";

import { useEffect } from "react";

export function ConsoleWelcome() {
  useEffect(() => {
    console.log(
      "%cWelcome to South Peaks Cycle Club! 🚴",
      "color: #dc2626; font-size: 20px; font-weight: bold; padding: 10px;"
    );
    console.log(
      "%cCheck out our code on GitHub:",
      "color: #374151; font-size: 14px; padding: 5px;"
    );
    console.log("https://github.com/feynman11/spcc");
    console.log(
      "%cHappy coding! 🚀",
      "color: #059669; font-size: 14px; font-weight: bold; padding: 5px;"
    );
  }, []);

  return null;
}

