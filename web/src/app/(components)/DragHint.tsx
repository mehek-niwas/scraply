"use client";
import { animate, type AnimationPlaybackControls } from "framer-motion";
import { useEffect, useRef } from "react";
import { useBoardStore } from "~/state/boardStore";
import type { TutorialHint } from "~/util/TUTORIAL_STEPS";

const LAYER_ONE = "lesson-linear-1";
const LAYER_TWO = "lesson-linear-2";

const DragHint = ({
  kind,
  onDone,
}: {
  kind: TutorialHint;
  onDone: () => void;
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const cursor = cursorRef.current;
    const ghost = ghostRef.current;
    const bubble = bubbleRef.current;
    if (!cursor || !ghost || !bubble) return;

    let cancelled = false;
    let active = true;
    const running = new Set<AnimationPlaybackControls>();
    const timers = new Set<number>();

    const stop = () => {
      cancelled = true;
      running.forEach((controls) => controls.stop());
      timers.forEach((id) => window.clearTimeout(id));
    };

    const tween = (
      el: Element,
      keyframes: Record<string, number>,
      options: { duration: number; ease?: "easeInOut" },
    ) => {
      if (cancelled) return Promise.reject(new Error("cancelled"));
      const controls = animate(el, keyframes, options);
      running.add(controls);
      return controls.then(() => {
        running.delete(controls);
        if (cancelled) throw new Error("cancelled");
      });
    };

    const sleep = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const id = window.setTimeout(() => {
          timers.delete(id);
          if (cancelled) reject(new Error("cancelled"));
          else resolve();
        }, ms);
        timers.add(id);
      });

    const finish = () => {
      if (active && !cancelled) onDoneRef.current();
    };

    const fields = (name: string) =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          `[data-tour="layer-canvas"] [data-field="${name}"]`,
        ),
      );

    const setOutput = (id: string, outputNeurons: number) => {
      const block = useBoardStore
        .getState()
        .canvasBlocks.find((entry) => entry?.id === id);
      if (!block?.params) return;
      useBoardStore.getState().updateBlock(id, {
        params: { ...block.params, outputNeurons },
      });
    };

    const showValue = async (el: HTMLElement, text: string) => {
      el.scrollIntoView({ block: "center", inline: "nearest" });
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      await tween(
        cursor,
        { x, y, opacity: 1, scale: 1 },
        { duration: 0.4, ease: "easeInOut" },
      );
      await tween(cursor, { scale: 0.86 }, { duration: 0.1 });
      await tween(cursor, { scale: 1 }, { duration: 0.1 });
      bubble.style.left = `${rect.left}px`;
      bubble.style.top = `${rect.top}px`;
      bubble.style.width = `${rect.width}px`;
      bubble.style.height = `${rect.height}px`;
      bubble.textContent = "";
      await tween(bubble, { opacity: 1 }, { duration: 0.08 });
      for (const char of text) {
        bubble.textContent += char;
        await sleep(70);
      }
      await sleep(280);
    };

    const hideBubble = () => tween(bubble, { opacity: 0 }, { duration: 0.12 });

    const dragLayer = async () => {
      const src = document.querySelector<HTMLElement>(
        '[data-toolbox-block="linear"]',
      );
      const canvas = document.querySelector<HTMLElement>(
        '[data-tour="layer-canvas"]',
      );
      const slot = document.querySelector<HTMLElement>(
        '[data-tour="layer-drop-slot"]',
      );
      if (!src || !canvas) return;

      window.scrollTo(0, 0);
      canvas.scrollTop = 0;
      src.scrollIntoView({ block: "nearest", inline: "nearest" });
      (slot ?? canvas).scrollIntoView({ block: "nearest", inline: "nearest" });

      const sr = src.getBoundingClientRect();
      const cr = canvas.getBoundingClientRect();
      const slotRect = slot?.getBoundingClientRect();
      const from = { x: sr.left + sr.width / 2, y: sr.top + sr.height / 2 };
      const dropY = slotRect
        ? slotRect.top + slotRect.height / 2
        : cr.top + 80;
      const to = {
        x: slotRect
          ? slotRect.left + slotRect.width / 2
          : cr.left + cr.width / 2,
        y: Math.min(Math.max(dropY, cr.top + 36), cr.bottom - 36),
      };

      const clone = src.cloneNode(true) as HTMLElement;
      clone.style.margin = "0";
      clone.style.transform = "none";
      ghost.replaceChildren(clone);
      ghost.style.width = `${sr.width}px`;

      const carry = { duration: 0.9, ease: "easeInOut" } as const;
      await tween(
        cursor,
        { x: from.x + 24, y: from.y + 24, opacity: 0, scale: 1 },
        { duration: 0 },
      );
      await tween(
        ghost,
        { x: sr.left, y: sr.top, opacity: 0, scale: 1 },
        { duration: 0 },
      );
      await tween(cursor, { opacity: 1 }, { duration: 0.15 });
      await tween(
        cursor,
        { x: from.x, y: from.y, scale: 0.86 },
        { duration: 0.35, ease: "easeInOut" },
      );
      await tween(ghost, { opacity: 0.9, scale: 1.03 }, { duration: 0.12 });
      await Promise.all([
        tween(cursor, { x: to.x, y: to.y, scale: 1 }, carry),
        tween(
          ghost,
          { x: to.x - sr.width / 2, y: to.y - sr.height / 2 },
          carry,
        ),
      ]);
      await tween(ghost, { opacity: 0, scale: 0.98 }, { duration: 0.25 });
      await tween(cursor, { opacity: 0 }, { duration: 0.2 });
    };

    const setSizes = async () => {
      const ins = fields("in");
      const outs = fields("out");
      if (ins[0]) {
        await showValue(ins[0], "8");
        useBoardStore.getState().updateInputNeurons(LAYER_ONE, 8);
        await hideBubble();
      }
      if (outs[0]) {
        await showValue(outs[0], "16");
        setOutput(LAYER_ONE, 16);
        await hideBubble();
      }
      if (outs[1]) {
        await showValue(outs[1], "1");
        setOutput(LAYER_TWO, 1);
        await hideBubble();
      }
      await tween(cursor, { opacity: 0 }, { duration: 0.2 });
    };

    const setSigmoid = async () => {
      const activations = fields("activation");
      const last = activations[activations.length - 1];
      if (last) {
        await showValue(last, "Sigmoid");
        useBoardStore
          .getState()
          .updateBlock(LAYER_TWO, { activationFunction: "Sigmoid" });
        await hideBubble();
      }
      await tween(cursor, { opacity: 0 }, { duration: 0.2 });
    };

    const run = async () => {
      await sleep(600);
      if (kind === "drag") await dragLayer();
      else if (kind === "sizes") await setSizes();
      else await setSigmoid();
      finish();
    };

    void run().catch(() => {});
    window.addEventListener("pointerdown", stop, true);

    return () => {
      active = false;
      stop();
      window.removeEventListener("pointerdown", stop, true);
      ghost.replaceChildren();
    };
  }, [kind]);

  return (
    <>
      <div
        ref={ghostRef}
        className="pointer-events-none fixed left-0 top-0 z-[1002] opacity-0 drop-shadow-2xl"
      />
      <div
        ref={bubbleRef}
        className="pointer-events-none fixed z-[1003] flex items-center justify-center rounded-md border border-blue-500 bg-white text-sm font-semibold text-gray-900 opacity-0 shadow-lg"
      />
      <div
        ref={cursorRef}
        className="pointer-events-none fixed left-0 top-0 z-[1004] opacity-0"
        style={{ transformOrigin: "0 0" }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          className="drop-shadow-lg"
        >
          <path
            d="M4 2.5 L4 19.5 L8.6 15.2 L11.6 21.6 L14.6 20.2 L11.6 13.9 L17.8 13.9 Z"
            fill="white"
            stroke="#1d4ed8"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  );
};

export default DragHint;
