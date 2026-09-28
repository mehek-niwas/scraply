"use client";
import {
  animate,
  type AnimationOptions,
  type DOMKeyframesDefinition,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { DemoAction, Point } from "~/util/TUTORIAL_STEPS";

const FIRST_PLAY_DELAY_MS = 700;
const IDLE_BEFORE_REPLAY_MS = 2500;
const LOOP_PAUSE_MS = 1400;
const TYPE_INTERVAL_MS = 110;
const MOVE = { duration: 0.7, ease: "easeInOut" } as const;
const INSTANT = { duration: 0 } as const;

class Cancelled extends Error {}

const centerOf = (el: HTMLElement): Point => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

interface TutorialDemoProps {
  actions?: DemoAction[];
  active: boolean;
  maxLoops: number;
}

const TutorialDemo = ({ actions, active, maxLoops }: TutorialDemoProps) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const fieldTextRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const chevronRef = useRef<HTMLSpanElement>(null);
  const [interruptions, setInterruptions] = useState(0);

  // Any real press or keystroke stops the demo so it never competes with the
  // user; it replays once they've been idle for a moment.
  useEffect(() => {
    if (!active) return;
    const interrupt = () => setInterruptions((n) => n + 1);
    window.addEventListener("pointerdown", interrupt, true);
    window.addEventListener("keydown", interrupt, true);
    return () => {
      window.removeEventListener("pointerdown", interrupt, true);
      window.removeEventListener("keydown", interrupt, true);
    };
  }, [active]);

  useEffect(() => {
    const cursor = cursorRef.current;
    const ripple = rippleRef.current;
    const ghost = ghostRef.current;
    const field = fieldRef.current;
    const fieldText = fieldTextRef.current;
    const caret = caretRef.current;
    const chevron = chevronRef.current;
    if (!active || !actions?.length) return;
    if (!cursor || !ripple || !ghost || !field || !fieldText || !caret || !chevron)
      return;

    let cancelled = false;
    let cursorVisible = false;
    const running = new Set<{ stop: () => void }>();

    const guard = () => {
      if (cancelled) throw new Cancelled();
    };
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms)).then(guard);
    const tween = async (
      el: Element,
      keyframes: DOMKeyframesDefinition,
      options: AnimationOptions,
    ) => {
      const controls = animate(el, keyframes, options);
      running.add(controls);
      await controls;
      running.delete(controls);
      guard();
    };

    const moveTo = async (p: Point) => {
      if (!cursorVisible) {
        await tween(cursor, { x: p.x + 70, y: p.y + 60, scale: 1, opacity: 0 }, INSTANT);
        await tween(cursor, { opacity: 1 }, { duration: 0.2 });
        cursorVisible = true;
      }
      await tween(cursor, { x: p.x, y: p.y }, MOVE);
    };

    const pulse = (p: Point) => {
      void tween(ripple, { x: p.x - 20, y: p.y - 20, scale: 0.3, opacity: 0.7 }, INSTANT)
        .then(() => tween(ripple, { scale: 1.6, opacity: 0 }, { duration: 0.5 }))
        .catch(() => {});
    };

    const press = async (p: Point) => {
      await tween(cursor, { scale: 0.82 }, { duration: 0.1 });
      pulse(p);
    };

    const release = async () => {
      await tween(cursor, { scale: 1 }, { duration: 0.1 });
    };

    const click = async (el: HTMLElement) => {
      const p = centerOf(el);
      await moveTo(p);
      await press(p);
      await release();
    };

    const showField = async (el: HTMLElement, text: string, typing: boolean) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      Object.assign(field.style, {
        left: `${r.left}px`,
        top: `${r.top}px`,
        width: `${r.width}px`,
        height: `${r.height}px`,
        fontSize: cs.fontSize,
        borderRadius: cs.borderRadius,
        backgroundColor: cs.backgroundColor,
        color: cs.color,
        justifyContent: cs.textAlign === "center" ? "center" : "flex-start",
        paddingLeft: cs.textAlign === "center" ? "0px" : cs.paddingLeft,
        paddingRight: cs.paddingRight,
      });
      caret.style.display = typing ? "inline" : "none";
      chevron.style.display = typing ? "none" : "inline";
      fieldText.textContent = typing ? "" : text;
      await tween(field, { opacity: 1 }, { duration: 0.12 });
      if (typing) {
        for (const ch of text) {
          fieldText.textContent += ch;
          await sleep(TYPE_INTERVAL_MS);
        }
      }
      await sleep(900);
      await tween(field, { opacity: 0 }, { duration: 0.25 });
    };

    const drag = async (action: Extract<DemoAction, { kind: "drag" }>) => {
      const src = action.from();
      const dest = action.to();
      if (!src || !dest) return sleep(500);

      const r = src.getBoundingClientRect();
      const grab =
        action.grab === "header"
          ? { x: r.left + 48, y: r.top + 24 }
          : centerOf(src);
      await moveTo(grab);
      await press(grab);

      const clone = src.cloneNode(true) as HTMLElement;
      clone.style.margin = "0";
      clone.style.transform = "none";
      clone.style.opacity = "1";
      ghost.replaceChildren(clone);
      ghost.style.width = `${r.width}px`;
      await tween(ghost, { x: r.left, y: r.top, scale: 1, opacity: 0 }, INSTANT);
      await tween(ghost, { opacity: 0.85, scale: 1.04 }, { duration: 0.15 });

      const offset = { x: grab.x - r.left, y: grab.y - r.top };
      const carry = { duration: 1.1, ease: "easeInOut" } as const;
      await Promise.all([
        tween(cursor, { x: dest.x, y: dest.y }, carry),
        tween(ghost, { x: dest.x - offset.x, y: dest.y - offset.y }, carry),
      ]);

      await release();
      pulse(dest);
      await tween(ghost, { opacity: 0, scale: 0.96 }, { duration: 0.35 });
      ghost.replaceChildren();
    };

    const play = async (action: DemoAction) => {
      if (action.kind === "drag") return drag(action);
      const el = action.target();
      if (!el) return sleep(500);
      await click(el);
      if (action.kind === "type") await showField(el, action.text, true);
      else if (action.kind === "choose") await showField(el, action.text, false);
      else await sleep(400);
    };

    const run = async () => {
      try {
        await sleep(interruptions > 0 ? IDLE_BEFORE_REPLAY_MS : FIRST_PLAY_DELAY_MS);
        for (let loop = 0; loop < maxLoops; loop++) {
          for (const action of actions) await play(action);
          await tween(cursor, { opacity: 0 }, { duration: 0.3 });
          cursorVisible = false;
          await sleep(LOOP_PAUSE_MS);
        }
      } catch (e) {
        if (!(e instanceof Cancelled)) throw e;
      }
    };
    void run();

    return () => {
      cancelled = true;
      running.forEach((controls) => controls.stop());
      for (const el of [cursor, ripple, ghost, field]) {
        animate(el, { opacity: 0 }, { duration: 0.15 });
      }
      setTimeout(() => ghost.replaceChildren(), 150);
    };
  }, [actions, active, maxLoops, interruptions]);

  return (
    <>
      <div
        ref={fieldRef}
        className="pointer-events-none fixed z-[1000] flex items-center overflow-hidden whitespace-nowrap opacity-0 ring-2 ring-blue-400"
      >
        <span ref={fieldTextRef} />
        <span ref={caretRef} className="animate-pulse">
          |
        </span>
        <span ref={chevronRef} className="ml-auto pr-2 text-xs opacity-70">
          ▾
        </span>
      </div>
      <div
        ref={ghostRef}
        className="pointer-events-none fixed left-0 top-0 z-[1002] opacity-0 drop-shadow-2xl"
      />
      <div
        ref={rippleRef}
        className="pointer-events-none fixed left-0 top-0 z-[1003] h-10 w-10 rounded-full bg-blue-400 opacity-0"
      />
      <div
        ref={cursorRef}
        className="pointer-events-none fixed left-0 top-0 z-[1004] opacity-0"
        style={{ transformOrigin: "0 0" }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" className="drop-shadow-lg">
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

export default TutorialDemo;
