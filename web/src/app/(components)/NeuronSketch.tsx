"use client";
import { useBoardStore } from "~/state/boardStore";
import { hasActivationFunction, hasNeurons } from "~/types/index";
import type { SketchFocus } from "~/util/TUTORIAL_STEPS";

const MAX_DOTS = 16;

interface Column {
  key: string;
  count: number;
  caption: string;
  activation?: string;
  role: SketchFocus;
}

const NeuronSketch = ({ focus }: { focus: SketchFocus }) => {
  const canvasBlocks = useBoardStore((state) => state.canvasBlocks);
  const linear = canvasBlocks.filter(
    (block) => block?.label === "Linear" && hasNeurons(block),
  );
  const first = linear[0];
  if (!first) return null;

  const columns: Column[] = [
    {
      key: "inputs",
      count: first.params.inputNeurons,
      caption: "inputs",
      role: "input",
    },
    ...linear.map((block, index) => {
      const last = index === linear.length - 1;
      return {
        key: block.id as string,
        count: block.params.outputNeurons as number,
        caption: last ? "answer" : "neurons",
        activation: hasActivationFunction(block)
          ? block.activationFunction
          : undefined,
        role: (last ? "output" : "hidden") as SketchFocus,
      };
    }),
  ];

  return (
    <div className="mt-3 flex items-end justify-center gap-1 overflow-x-auto rounded-lg bg-zinc-800/80 px-2 py-3">
      {columns.map((column, index) => {
        const active = column.role === focus;
        const shown = Math.min(Math.max(column.count || 0, 0), MAX_DOTS);
        return (
          <div key={column.key} className="flex items-end">
            {index > 0 && (
              <div className="mb-10 px-0.5 text-xs text-zinc-500">→</div>
            )}
            <div
              className={`flex w-16 flex-col items-center gap-1 ${
                active ? "text-blue-200" : "text-zinc-400"
              }`}
            >
              <div className="flex min-h-10 max-w-16 flex-wrap content-end justify-center gap-1">
                {Array.from({ length: shown }, (_, dot) => (
                  <span
                    key={dot}
                    className={`h-2 w-2 rounded-full ${
                      active ? "bg-blue-300" : "bg-zinc-500"
                    }`}
                  />
                ))}
              </div>
              <div
                className={`text-sm font-semibold ${
                  active ? "text-white" : "text-zinc-300"
                }`}
              >
                {column.count}
              </div>
              <div className="text-[10px] uppercase tracking-wide">
                {column.caption}
              </div>
              {column.activation && (
                <div className="text-[10px] text-zinc-400">
                  {column.activation}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NeuronSketch;
