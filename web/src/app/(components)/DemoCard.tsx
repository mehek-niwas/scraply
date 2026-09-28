import { forwardRef } from "react";
import { motion, useDragControls } from "framer-motion";
import {
  RxCross2 as CrossIcon,
  RxArrowLeft as LeftIcon,
  RxArrowRight as RightIcon,
  RxDragHandleDots2 as GripIcon,
} from "react-icons/rx";
import { FaCheckCircle as CheckIcon } from "react-icons/fa";

const NavigationButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  highlight?: boolean;
}> = ({ children, onClick, title, disabled, highlight }) => {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`mx-1 rounded-lg px-2 py-1 transition-colors ${
        disabled
          ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
          : highlight
            ? "bg-blue-600 hover:bg-blue-500"
            : "bg-zinc-600 hover:bg-zinc-500"
      }`}
    >
      {children}
    </button>
  );
};

interface DemoCardProps {
  title: string;
  description: string;
  task?: string;
  taskRequired: boolean;
  taskDone: boolean;
  currIdx: number;
  maxIdx: number;
  prev: boolean;
  onPrev: () => void;
  next: boolean;
  onNext: () => void;
  top: number;
  left: number;
  closeDemo: () => void;
}

const DemoCard = forwardRef<HTMLDivElement, DemoCardProps>(
  (
    {
      title,
      description,
      task,
      taskRequired,
      taskDone,
      currIdx,
      maxIdx,
      prev,
      onPrev,
      next,
      onNext,
      top,
      left,
      closeDemo,
    },
    ref,
  ) => {
    const dragControls = useDragControls();
    const locked = taskRequired && !taskDone;

    return (
      <motion.div
        ref={ref}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        initial={{ opacity: 0, top, left }}
        animate={{ opacity: 1, top, left }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="fixed z-[1001] w-80 rounded-xl bg-zinc-700 px-3 py-2 text-white shadow-2xl ring ring-zinc-600"
      >
        <div
          className="mb-2 flex cursor-move touch-none select-none items-start justify-between"
          onPointerDown={(e) => dragControls.start(e)}
          title="Drag to move"
        >
          <div className="flex items-start gap-1">
            <GripIcon className="mt-1.5 shrink-0 text-zinc-400" />
            <div className="text-lg font-semibold">{title}</div>
          </div>
          <NavigationButton onClick={closeDemo} title="Close tutorial">
            <CrossIcon />
          </NavigationButton>
        </div>
        <div className="text-sm text-zinc-200">{description}</div>
        {task && (
          <div
            className={`mt-3 flex items-start gap-2 rounded-lg p-2 text-sm ring-1 transition-colors ${
              taskDone && taskRequired
                ? "bg-emerald-900/40 text-emerald-100 ring-emerald-600/60"
                : "bg-blue-900/40 text-blue-100 ring-blue-600/60"
            }`}
          >
            {taskRequired && taskDone ? (
              <CheckIcon className="mt-0.5 shrink-0 text-emerald-400" />
            ) : (
              <span className="mt-1 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-blue-400" />
            )}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
                {taskRequired && taskDone
                  ? "Done!"
                  : taskRequired
                    ? "Your turn"
                    : "Try it"}
              </div>
              {task}
            </div>
          </div>
        )}
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
            <NavigationButton
              onClick={onNext}
              title={locked ? "Complete the task to continue" : "Next"}
              disabled={locked}
              highlight={taskRequired && taskDone}
            >
              <RightIcon />
            </NavigationButton>
          ) : (
            <NavigationButton onClick={closeDemo} title="Finish">
              <CrossIcon />
            </NavigationButton>
          )}
        </div>
        {locked && next && (
          <div className="-mt-2 mb-1 text-center">
            <button
              onClick={onNext}
              className="text-xs text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
            >
              Skip this step
            </button>
          </div>
        )}
      </motion.div>
    );
  },
);

DemoCard.displayName = "DemoCard";

export default DemoCard;
