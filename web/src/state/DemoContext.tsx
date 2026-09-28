"use client";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppTabs } from "~/types/index";
import TUTORIAL_STEPS from "~/util/TUTORIAL_STEPS";

const TUTORIAL_SEEN_KEY = "scraply_tutorial_seen";

interface DemoContextValue {
  isDemoing: boolean;
  stepIdx: number;
  start: () => void;
  next: () => void;
  prev: () => void;
  close: () => void;
  tab: AppTabs;
  setTab: (tab: AppTabs) => void;
}

const DemoContext = createContext<DemoContextValue>({
  isDemoing: false,
  stepIdx: 0,
  start: () => {},
  next: () => {},
  prev: () => {},
  close: () => {},
  tab: AppTabs.LAYERS,
  setTab: () => {},
});

const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDemoing, setIsDemoing] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [tab, setTab] = useState<AppTabs>(AppTabs.LAYERS);

  const goToStep = useCallback((idx: number) => {
    const step = TUTORIAL_STEPS[idx];
    if (!step) return;
    if (step.tab) setTab(step.tab);
    step.onEnter?.();
    setStepIdx(idx);
  }, []);

  const start = useCallback(() => {
    goToStep(0);
    setIsDemoing(true);
  }, [goToStep]);

  const close = useCallback(() => {
    setIsDemoing(false);
    try {
      localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
    } catch {}
  }, []);

  const next = useCallback(() => {
    if (stepIdx >= TUTORIAL_STEPS.length - 1) close();
    else goToStep(stepIdx + 1);
  }, [stepIdx, goToStep, close]);

  const prev = useCallback(() => {
    if (stepIdx > 0) goToStep(stepIdx - 1);
  }, [stepIdx, goToStep]);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TUTORIAL_SEEN_KEY)) start();
    } catch {}
  }, [start]);

  return (
    <DemoContext.Provider
      value={{ isDemoing, stepIdx, start, next, prev, close, tab, setTab }}
    >
      {children}
    </DemoContext.Provider>
  );
};

const useDemo = () => useContext(DemoContext);

export { DemoProvider, useDemo };
