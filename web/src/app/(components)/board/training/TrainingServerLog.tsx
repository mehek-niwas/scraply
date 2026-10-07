"use client";

import { useEffect, useRef, useState } from "react";
import type { TrainingLogLine } from "~/types/training";

function logLineColor(line: string) {
  const lower = line.toLowerCase();
  if (
    lower.includes("error") ||
    lower.includes("fail") ||
    lower.includes("stopped")
  ) {
    return "#EF2929";
  }
  if (
    lower.includes("finished") ||
    lower.includes("completed") ||
    lower.includes("done")
  ) {
    return "#8AE234";
  }
  return "#EEEEEC";
}

function UbuntuPrompt() {
  return (
    <span className="mr-2 shrink-0">
      <span className="text-[#8AE234]">scraply@training</span>
      <span className="text-[#EEEEEC]">:</span>
      <span className="text-[#729FCF]">~</span>
      <span className="text-[#EEEEEC]">$</span>
    </span>
  );
}

function UbuntuCursor() {
  return (
    <span
      className="ml-0.5 inline-block h-3.5 w-2 translate-y-0.5 bg-[#EEEEEC]"
      style={{ animation: "ubuntu-cursor 1.05s steps(1) infinite" }}
    />
  );
}

export default function TrainingServerLog({
  logs,
  active = true,
}: {
  logs: TrainingLogLine[];
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const latest = logs.length > 0 ? logs[logs.length - 1].line : null;

  useEffect(() => {
    const box = scrollRef.current;
    if (!open || !box || !stickToBottomRef.current) {
      return;
    }
    box.scrollTop = box.scrollHeight;
  }, [logs, open]);

  return (
    <div
      className="mt-3 overflow-hidden rounded-lg shadow-lg ring-1 ring-black/40"
      style={{ background: "#300A24" }}
    >
      <style>{`@keyframes ubuntu-cursor { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }`}</style>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid w-full grid-cols-[4.5rem_1fr_4.5rem] items-center px-3 py-1.5 text-left"
        style={{ background: "#2C001E" }}
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#E95420]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#C4A000]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#4E9A06]" />
        </span>
        <span className="truncate text-center font-mono text-[11px] text-[#EEEEEC]/75">
          scraply@training: ~
        </span>
        <span className="text-right font-mono text-[10px] text-[#EEEEEC]/40">
          {open ? "hide" : "show"}
        </span>
      </button>

      {open ? (
        <div
          ref={scrollRef}
          onScroll={() => {
            const box = scrollRef.current;
            if (!box) {
              return;
            }
            stickToBottomRef.current =
              box.scrollHeight - box.scrollTop - box.clientHeight < 24;
          }}
          className="max-h-64 overflow-y-auto px-3 py-2 font-mono text-[12px] leading-5 [scrollbar-color:#5E2750_#300A24] [scrollbar-width:thin]"
        >
          {logs.length === 0 ? (
            <div className="text-[#EEEEEC]/45">Waiting for server output...</div>
          ) : (
            logs.map((entry) => (
              <div
                key={entry.seq}
                className="whitespace-pre-wrap break-all"
                style={{ color: logLineColor(entry.line) }}
              >
                {entry.line}
              </div>
            ))
          )}
          {active && (
            <div className="mt-1 flex items-center">
              <UbuntuPrompt />
              <UbuntuCursor />
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center truncate px-3 py-2 font-mono text-[12px] leading-5">
          {active && <UbuntuPrompt />}
          <span className="truncate text-[#EEEEEC]/80">
            {latest ?? "waiting for server output..."}
          </span>
          {active && <UbuntuCursor />}
        </div>
      )}
    </div>
  );
}
