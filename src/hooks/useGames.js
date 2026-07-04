import { useState } from "react";

// Bura / Nardi / Chess full-screen game overlay open/closed state.
export function useGames() {
  const [buraOpen, setBuraOpen] = useState(false);
  const [nardiOpen, setNardiOpen] = useState(false);
  const [chessOpen, setChessOpen] = useState(false);
  return { buraOpen, setBuraOpen, nardiOpen, setNardiOpen, chessOpen, setChessOpen };
}
