"use client";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppTabs, UILayer } from "~/types/index";
import { useBoardStore } from "~/state/boardStore";
import TUTORIAL_STEPS, {
  lessonBlocks,
  type LessonStage,
} from "~/util/TUTORIAL_STEPS";

interface CanvasSnapshot {
  blocks: UILayer[];
  dataset: string;
  architecture: string;
}

interface DemoContextValue {
  isDemoing: boolean;
  welcomeOpen: boolean;
  stepIdx: number;
  start: () => void;
  dismissWelcome: () => void;
  next: () => void;
  prev: () => void;
  close: () => void;
  showLesson: (stage: LessonStage) => void;
  tab: AppTabs;
  setTab: (tab: AppTabs) => void;
}

const DemoContext = createContext<DemoContextValue>({
  isDemoing: false,
  welcomeOpen: false,
  stepIdx: 0,
  start: () => {},
  dismissWelcome: () => {},
  next: () => {},
  prev: () => {},
  close: () => {},
  showLesson: () => {},
  tab: AppTabs.LAYERS,
  setTab: () => {},
});

const TUTORIAL_SEEN_KEY = "scraply_tutorial_seen";

const hasSeenTutorial = () => {
  try {
    return localStorage.getItem(TUTORIAL_SEEN_KEY) === "1";
  } catch {
    return false;
  }
};

const markTutorialSeen = () => {
  try {
    localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
  } catch {
    // Private browsing can block storage. The tour still closes.
  }
};

const applyCanvas = (
  dataset: string,
  architecture: string,
  blocks: UILayer[],
) => {
  const store = useBoardStore.getState();
  const willSync =
    store.selectedDataset !== dataset ||
    store.selectedArchitecture !== architecture;
  if (willSync) store.armArchitectureSyncSuppress();
  store.setSelectedDataset(dataset);
  store.setSelectedArchitecture(architecture);
  store.loadDefaultConfig(blocks);
};

const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDemoing, setIsDemoing] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [tab, setTab] = useState<AppTabs>(AppTabs.LAYERS);
  const stepIdxRef = useRef(0);
  const snapshotRef = useRef<CanvasSnapshot | null>(null);
  stepIdxRef.current = stepIdx;

  const showLesson = useCallback((stage: LessonStage) => {
    const store = useBoardStore.getState();
    if (!snapshotRef.current) {
      snapshotRef.current = {
        blocks: structuredClone(store.canvasBlocks) as UILayer[],
        dataset: store.selectedDataset,
        architecture: store.selectedArchitecture,
      };
    }
    applyCanvas("pima", "custom", lessonBlocks(stage));
  }, []);

  const restoreSnapshot = useCallback(() => {
    const snap = snapshotRef.current;
    snapshotRef.current = null;
    if (!snap) return;
    applyCanvas(snap.dataset, snap.architecture, snap.blocks);
  }, []);

  const goToStep = useCallback(
    (idx: number) => {
      const step = TUTORIAL_STEPS[idx];
      if (!step) return;
      const prev = TUTORIAL_STEPS[stepIdxRef.current];
      const forward = idx > stepIdxRef.current;
      if (step.tab) setTab(step.tab);
      if (step.lessonBefore) {
        showLesson(step.lessonBefore);
      } else if (forward && snapshotRef.current && prev?.lessonAfter) {
        applyCanvas("pima", "custom", lessonBlocks(prev.lessonAfter));
      }
      setStepIdx(idx);
    },
    [showLesson],
  );

  const start = useCallback(() => {
    markTutorialSeen();
    setWelcomeOpen(false);
    goToStep(0);
    setIsDemoing(true);
  }, [goToStep]);

  const dismissWelcome = useCallback(() => {
    markTutorialSeen();
    setWelcomeOpen(false);
  }, []);

  useEffect(() => {
    if (!hasSeenTutorial()) setWelcomeOpen(true);
  }, []);

  const close = useCallback(() => {
    markTutorialSeen();
    setIsDemoing(false);
    restoreSnapshot();
  }, [restoreSnapshot]);

  const next = useCallback(() => {
    if (stepIdx >= TUTORIAL_STEPS.length - 1) close();
    else goToStep(stepIdx + 1);
  }, [stepIdx, goToStep, close]);

  const prev = useCallback(() => {
    if (stepIdx > 0) goToStep(stepIdx - 1);
  }, [stepIdx, goToStep]);

  return (
    <DemoContext.Provider
      value={{
        isDemoing,
        welcomeOpen,
        stepIdx,
        start,
        dismissWelcome,
        next,
        prev,
        close,
        showLesson,
        tab,
        setTab,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

const useDemo = () => useContext(DemoContext);

export { DemoProvider, useDemo };
