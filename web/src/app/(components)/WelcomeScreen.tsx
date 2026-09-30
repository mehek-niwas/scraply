"use client";
import { useEffect } from "react";
import { useDemo } from "~/state/DemoContext";

const points = [
  "Pick a dataset for the model to learn from.",
  "Drag layers onto the canvas to build a network.",
  "Train it, then read how it did.",
];

const WelcomeScreen = () => {
  const { welcomeOpen, start, dismissWelcome } = useDemo();

  useEffect(() => {
    if (!welcomeOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismissWelcome();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [welcomeOpen, dismissWelcome]);

  if (!welcomeOpen) return null;

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-md rounded-2xl bg-zinc-800 px-6 py-6 text-white shadow-2xl ring ring-zinc-600">
        <h1 className="text-2xl font-semibold">Welcome to Scraply</h1>
        <p className="mt-2 text-sm text-zinc-300">
          A playground for small neural networks. A short tour shows how to
          build one.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-200">
          {points.map((point) => (
            <li key={point} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={start}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-blue-500"
          >
            Start tutorial
          </button>
          <button
            type="button"
            onClick={dismissWelcome}
            className="rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
