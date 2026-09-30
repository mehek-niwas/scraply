import { forwardRef } from "react";
import { motion } from "framer-motion";
import {
  RxCross2 as CrossIcon,
  RxArrowLeft as LeftIcon,
  RxArrowRight as RightIcon,
} from "react-icons/rx";
import NeuronSketch from "./NeuronSketch";
import type { SketchFocus } from "~/util/TUTORIAL_STEPS";

const NavigationButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
}> = ({ children, onClick, title }) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className="mx-1 rounded-lg bg-zinc-600 px-2 py-1 transition-colors hover:bg-zinc-500"
    >
      {children}
    </button>
  );
};

interface DemoCardProps {
  title: string;
  description: string;
  currIdx: number;
  maxIdx: number;
  prev: boolean;
  onPrev: () => void;
  next: boolean;
  onNext: () => void;
  top: number;
  left: number;
  closeDemo: () => void;
  sketch?: SketchFocus;
}

const DemoCard = forwardRef<HTMLDivElement, DemoCardProps>(
  (
    {
      title,
      description,
      currIdx,
      maxIdx,
      prev,
      onPrev,
      next,
      onNext,
      top,
      left,
      closeDemo,
      sketch,
    },
    ref,
  ) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, top, left }}
        animate={{ opacity: 1, top, left }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="fixed z-[1001] w-80 rounded-xl bg-zinc-700 px-3 py-2 text-white shadow-2xl ring ring-zinc-600"
      >
        <div className="mb-2 flex items-start justify-between">
          <div className="text-lg font-semibold">{title}</div>
          <NavigationButton onClick={closeDemo} title="Close tutorial">
            <CrossIcon />
          </NavigationButton>
        </div>
        <div className="text-sm text-zinc-200">{description}</div>
        {sketch && <NeuronSketch focus={sketch} />}
        <div className="my-4 flex items-center justify-center text-sm">
          {prev && (
            <NavigationButton onClick={onPrev} title="Previous">
              <LeftIcon />
            </NavigationButton>
          )}
          <div className="mx-2 py-1">
            {currIdx + 1} of {maxIdx + 1}
          </div>
          {next ? (
            <NavigationButton onClick={onNext} title="Next">
              <RightIcon />
            </NavigationButton>
          ) : (
            <NavigationButton onClick={closeDemo} title="Finish">
              <CrossIcon />
            </NavigationButton>
          )}
        </div>
        <div className="-mt-2 mb-1 text-center">
          <button
            onClick={closeDemo}
            className="text-xs text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
          >
            Skip
          </button>
        </div>
      </motion.div>
    );
  },
);

DemoCard.displayName = "DemoCard";

export default DemoCard;
