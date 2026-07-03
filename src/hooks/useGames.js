import { useState } from "react";

// Bura / Nardi full-screen game overlay open/closed state.
export function useGames() {
  const [buraOpen, setBuraOpen] = useState(false);
  const [nardiOpen, setNardiOpen] = useState(false);
  return { buraOpen, setBuraOpen, nardiOpen, setNardiOpen };
}
