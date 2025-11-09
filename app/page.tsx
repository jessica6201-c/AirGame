"use client";

import { useState } from "react";
import GameContainer from "./components/GameContainer";
import GameSelection from "./components/GameSelection";
import { getAllGames } from "./games";
import { BaseGame } from "./types/game";

export default function Home() {
  const [selectedGame, setSelectedGame] = useState<BaseGame | null>(null);
  const games = getAllGames();

  const handleBackToMenu = () => {
    setSelectedGame(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full flex-col items-center py-8 px-4 bg-white dark:bg-black">
        {selectedGame ? (
          <div className="w-full flex flex-col items-center gap-4">
            <button
              onClick={handleBackToMenu}
              className="self-start px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              ← Back to Menu
            </button>
            <GameContainer game={selectedGame} />
          </div>
        ) : (
          <GameSelection games={games} onSelectGame={setSelectedGame} />
        )}
      </main>
    </div>
  );
}
