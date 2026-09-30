"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDemo } from "~/state/DemoContext";
import TUTORIAL_STEPS, { TutorialPlacement } from "~/util/TUTORIAL_STEPS";
import DemoCard from "./DemoCard";
import DragHint from "./DragHint";

const HIGHLIGHT_PADDING = 6;
const HIGHLIGHT_RADIUS = 12;
const CARD_GAP = 14;
const VIEWPORT_MARGIN = 12;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const findTargets = (targets: string[] | null): HTMLElement[] => {
  if (!targets) return [];
  return targets
    .map((target) =>
      document.querySelector<HTMLElement>(`[data-tour="${target}"]`),
    )
    .filter((el): el is HTMLElement => !!el && el.getClientRects().length > 0);
};

const padRect = (el: HTMLElement): Rect => {
  const r = el.getBoundingClientRect();
  return {
    top: r.top - HIGHLIGHT_PADDING,
    left: r.left - HIGHLIGHT_PADDING,
    width: r.width + HIGHLIGHT_PADDING * 2,
    height: r.height + HIGHLIGHT_PADDING * 2,
  };
};

const intersects = (a: Rect, b: Rect) =>
  a.left < b.left + b.width &&
  b.left < a.left + a.width &&
  a.top < b.top + b.height &&
  b.top < a.top + a.height;

const union = (a: Rect, b: Rect): Rect => {
  const top = Math.min(a.top, b.top);
  const left = Math.min(a.left, b.left);
  return {
    top,
    left,
    width: Math.max(a.left + a.width, b.left + b.width) - left,
    height: Math.max(a.top + a.height, b.top + b.height) - top,
  };
};

// Overlapping holes would cancel each other out under the even-odd fill rule.
const mergeOverlapping = (rects: Rect[]): Rect[] => {
  const result = [...rects];
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      if (intersects(result[i]!, result[j]!)) {
        result[i] = union(result[i]!, result[j]!);
        result.splice(j, 1);
        j = i;
      }
    }
  }
  return result;
};

const sameRects = (a: Rect[], b: Rect[]) =>
  a.length === b.length &&
  a.every(
    (r, i) =>
      r.top === b[i]!.top &&
      r.left === b[i]!.left &&
      r.width === b[i]!.width &&
      r.height === b[i]!.height,
  );

const roundedRectPath = ({ top: y, left: x, width: w, height: h }: Rect) => {
  const r = Math.min(HIGHLIGHT_RADIUS, w / 2, h / 2);
  return `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;
};

const placeCard = (
  target: Rect | null,
  placement: TutorialPlacement,
  cardWidth: number,
  cardHeight: number,
) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (placement === "corner") {
    return {
      top: vh - cardHeight - VIEWPORT_MARGIN * 2,
      left: vw - cardWidth - VIEWPORT_MARGIN * 2,
    };
  }

  if (!target || placement === "center") {
    return { top: (vh - cardHeight) / 2, left: (vw - cardWidth) / 2 };
  }

  let top: number;
  let left: number;
  switch (placement) {
    case "top":
      top = target.top - cardHeight - CARD_GAP;
      left = target.left + target.width / 2 - cardWidth / 2;
      break;
    case "left":
      top = target.top + target.height / 2 - cardHeight / 2;
      left = target.left - cardWidth - CARD_GAP;
      break;
    case "right":
      top = target.top + target.height / 2 - cardHeight / 2;
      left = target.left + target.width + CARD_GAP;
      break;
    case "bottom":
    default:
      top = target.top + target.height + CARD_GAP;
      left = target.left + target.width / 2 - cardWidth / 2;
  }

  const clamp = (value: number, max: number) =>
    Math.min(Math.max(value, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, max));

  return {
    top: clamp(top, vh - cardHeight - VIEWPORT_MARGIN),
    left: clamp(left, vw - cardWidth - VIEWPORT_MARGIN),
  };
};

const isTypingTarget = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

const TourOverlay = () => {
  const { isDemoing, stepIdx, next, prev, close, showLesson } = useDemo();
  const [primaryRect, setPrimaryRect] = useState<Rect | null>(null);
  const [holes, setHoles] = useState<Rect[]>([]);
  const [cardSize, setCardSize] = useState({ width: 320, height: 180 });
  const cardRef = useRef<HTMLDivElement>(null);

  const step = TUTORIAL_STEPS[stepIdx];

  const measure = useCallback(() => {
    const rects = findTargets(step?.target ?? null).map(padRect);
    const primary = rects[0] ?? null;
    setPrimaryRect((prev) =>
      prev && primary && sameRects([prev], [primary]) ? prev : primary,
    );
    const merged = mergeOverlapping(rects);
    setHoles((prev) => (sameRects(prev, merged) ? prev : merged));
  }, [step]);

  // The target may live on a tab that is only mounted after this step's tab
  // switch renders, so measure once that layout has settled.
  useEffect(() => {
    if (!isDemoing || !step) return;

    const frame = requestAnimationFrame(() => {
      const canvas = document.querySelector<HTMLElement>(
        '[data-tour="layer-canvas"]',
      );
      if (canvas && step.lessonBefore) canvas.scrollTop = 0;
      findTargets(step.target)[0]?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
      measure();
    });
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [isDemoing, step, measure]);

  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const { offsetWidth: width, offsetHeight: height } = cardRef.current;
    setCardSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  });

  useEffect(() => {
    if (!isDemoing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (isTypingTarget(e.target)) return;
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDemoing, next, prev, close]);

  if (!isDemoing || !step) return null;

  const { top, left } = placeCard(
    primaryRect,
    step.placement,
    cardSize.width,
    cardSize.height,
  );

  const clipPath = holes.length
    ? `path(evenodd, "M0 0 H${window.innerWidth} V${window.innerHeight} H0 Z ${holes
        .map(roundedRectPath)
        .join(" ")}")`
    : undefined;

  return (
    <>
      <div
        className="fixed inset-0 z-[998] bg-black/60"
        style={{ clipPath }}
      />
      {!step.interactive && <div className="fixed inset-0 z-[999]" />}
      {holes.map((hole, i) => (
        <div
          key={i}
          className="pointer-events-none fixed z-[1000] rounded-xl ring-2 ring-blue-500 transition-all duration-200 ease-out"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
          }}
        />
      ))}
      {step.hint && (
        <DragHint
          key={`hint-${step.id}`}
          kind={step.hint}
          onDone={() => {
            if (step.lessonAfter) showLesson(step.lessonAfter);
          }}
        />
      )}
      <DemoCard
        ref={cardRef}
        key={`card-${step.id}`}
        title={step.title}
        description={step.description}
        currIdx={stepIdx}
        maxIdx={TUTORIAL_STEPS.length - 1}
        prev={stepIdx > 0}
        onPrev={prev}
        next={stepIdx < TUTORIAL_STEPS.length - 1}
        onNext={next}
        top={top}
        left={left}
        closeDemo={close}
        sketch={step.sketch}
      />
    </>
  );
};

export default TourOverlay;
