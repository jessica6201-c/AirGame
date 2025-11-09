"use client";

import { BaseGame } from "@/app/types/game";

interface GameSelectionProps {
  games: BaseGame[];
  onSelectGame: (game: BaseGame) => void;
}

export default function GameSelection({ games, onSelectGame }: GameSelectionProps) {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-6xl px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-black dark:text-white mb-4">
          Air Game
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Select a game to play using pose detection
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {games.map((game) => (
          <button
            key={game.metadata.id}
            onClick={() => onSelectGame(game)}
            className="group relative overflow-hidden rounded-lg border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 transition-all hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-lg"
          >
            {game.metadata.splashArt && (
              <div className="w-full h-48 mb-4 bg-zinc-200 dark:bg-zinc-800 rounded-md overflow-hidden">
                <img
                  src={game.metadata.splashArt}
                  alt={game.metadata.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="text-left">
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {game.metadata.name}
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                {game.metadata.description}
              </p>
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Play
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
