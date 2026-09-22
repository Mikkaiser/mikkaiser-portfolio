"use client";

import { Gamepad } from "./icons";

export const OPEN_GAME_EVENT = "mk:open-game";

export function GameButton() {
  return (
    <button
      type="button"
      className="btn btn--ghost btn--icon"
      aria-label="Play Match the stack"
      title="Match the stack"
      onClick={() => window.dispatchEvent(new Event(OPEN_GAME_EVENT))}
    >
      <Gamepad />
    </button>
  );
}
