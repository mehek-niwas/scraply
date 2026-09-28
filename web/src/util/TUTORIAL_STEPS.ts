import { AppTabs } from "~/types/index";
import { useBoardStore } from "~/state/boardStore";
import { useTrainingStore } from "~/state/trainingStore";

export type TutorialPlacement =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "center"
  | "corner";

export interface TutorialContext {
  tab: AppTabs;
}

export interface Point {
  x: number;
  y: number;
}

type Find = () => HTMLElement | null;

/** A ghost re-enactment of the task. It never touches the real app state. */
export type DemoAction =
  | { kind: "click"; target: Find }
  | { kind: "type"; target: Find; text: string }
  | { kind: "choose"; target: Find; text: string }
  | { kind: "drag"; from: Find; to: () => Point | null; grab?: "center" | "header" };

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  /** Every matching `data-tour` element is highlighted; the card is placed next to the first one. */
  target: string[] | null;
  placement: TutorialPlacement;
  /** Switch to this tab when the step is entered. */
  tab?: AppTabs;
  /** Let the user click, type and drag inside the highlighted areas. */
  interactive?: boolean;
  task?: string;
  /** When set, Next stays locked until this returns true. */
  isComplete?: (ctx: TutorialContext) => boolean;
  onEnter?: () => void;
  /** Replays until the task is complete (twice for optional tasks). */
  demo?: DemoAction[];
}

const blocks = () => useBoardStore.getState().canvasBlocks;
const training = () => useTrainingStore.getState();

const isLinear = (block: any) => block?.label === "Linear";
const isDropout = (block: any) => block?.label === "Dropout";

let historyLengthAtStart = 0;

const LAYER_WORKSPACE = ["layer-toolbox", "layer-canvas"];

const q = (selector: string) => document.querySelector<HTMLElement>(selector);

const toolboxBlock = (id: string) => () => q(`[data-toolbox-block="${id}"]`);

const canvasLayers = (label: string) =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      `[data-tour="layer-canvas"] [data-layer-label="${label}"]`,
    ),
  );

const layerField = (label: string, which: "first" | "last", field: string) => () => {
  const layers = canvasLayers(label);
  const layer = which === "first" ? layers[0] : layers.at(-1);
  return layer?.querySelector<HTMLElement>(`[data-field="${field}"]`) ?? null;
};

const tabOption = (label: string) => () =>
  Array.from(
    document.querySelectorAll<HTMLElement>('[data-tour="tab-toggle"] div'),
  ).find(
    (el) =>
      el.children.length === 0 &&
      el.textContent?.trim().toLowerCase() === label.toLowerCase(),
  ) ?? null;

// The empty "+" slot is where new layers land; it can scroll below the
// visible part of the canvas, so keep the drop point inside it.
const canvasDropPoint = (): Point | null => {
  const canvas = q('[data-tour="layer-canvas"]');
  const slot = q('[data-tour="layer-drop-slot"]');
  if (!canvas || !slot) return null;
  const c = canvas.getBoundingClientRect();
  const s = slot.getBoundingClientRect();
  return {
    x: s.left + s.width / 2,
    y: Math.min(s.top + s.height / 2, c.bottom - 60),
  };
};

const belowFirstLinear = (): Point | null => {
  const first = canvasLayers("Linear")[0];
  if (!first) return null;
  const r = first.getBoundingClientRect();
  return { x: r.left + 48, y: r.bottom + 4 };
};

const dragToCanvas = (id: string): DemoAction => ({
  kind: "drag",
  from: toolboxBlock(id),
  to: canvasDropPoint,
});

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to scraply 👋",
    description:
      "In this tutorial you'll build a small neural network, train it and look at the results. Some steps ask you to do something yourself. A ghost cursor shows you how, then it's your turn, and the Next button unlocks once you've done it. You can drag this card by its title bar, and press Esc to leave at any time.",
    target: null,
    placement: "center",
    tab: AppTabs.LAYERS,
    onEnter: () => {
      historyLengthAtStart = training().trainingHistory.length;
    },
  },
  {
    id: "dataset",
    title: "1. Pick a dataset",
    description:
      "The dataset is what your model learns from. Pima Diabetes has 8 health measurements per patient (glucose, BMI, age, ...), and the model predicts one thing: does the patient have diabetes, yes or no?",
    target: ["dataset", "dataset-menu"],
    placement: "right",
    tab: AppTabs.LAYERS,
    interactive: true,
    task: 'Open the Dataset menu and choose "Pima Diabetes".',
    isComplete: () => useBoardStore.getState().selectedDataset === "pima",
    demo: [
      {
        kind: "choose",
        target: () => q('[data-tour="dataset"] button'),
        text: "Pima Diabetes",
      },
    ],
  },
  {
    id: "architecture",
    title: "2. Start from scratch",
    description:
      "Architectures like Default, LeNet and ResNet load a ready-made model you can study or tweak. Custom gives you an empty canvas so you can build your own.",
    target: ["architecture"],
    placement: "bottom",
    tab: AppTabs.LAYERS,
    interactive: true,
    task: 'Set Architecture to "Custom".',
    isComplete: () =>
      useBoardStore.getState().selectedArchitecture === "custom",
    demo: [
      {
        kind: "choose",
        target: () => q('[data-tour="architecture"] select'),
        text: "Custom",
      },
    ],
  },
  {
    id: "layers-overview",
    title: "3. The layer builder",
    description:
      "On the left is the toolbox of layer types. On the right is the canvas, which holds your model. Data flows through the canvas from top to bottom, so the top layer gets the raw input and the bottom layer makes the prediction.",
    target: LAYER_WORKSPACE,
    placement: "corner",
    tab: AppTabs.LAYERS,
  },
  {
    id: "drag-first-layer",
    title: "4. Drag in your first layer",
    description:
      "A Linear layer connects every input to every neuron. It's the basic building block of a neural network. Hold the mouse down on a toolbox block, drag it over, and let go.",
    target: LAYER_WORKSPACE,
    placement: "corner",
    tab: AppTabs.LAYERS,
    interactive: true,
    task: "Drag a Linear block from the toolbox and drop it on the dashed canvas.",
    isComplete: () => blocks().some(isLinear),
    demo: [dragToCanvas("linear")],
  },
  {
    id: "first-layer-args",
    title: "5. Set the layer's arguments",
    description:
      "In is how many numbers go into the layer. Pima has 8 features, so the first layer's In must be 8. Out is how many neurons the layer has, which is how many patterns it can learn. Activation (ReLU) lets the network learn curves instead of straight lines.",
    target: LAYER_WORKSPACE,
    placement: "corner",
    tab: AppTabs.LAYERS,
    interactive: true,
    task: "On the first Linear layer, keep In at 8 and change Out to 16.",
    isComplete: () => {
      const first = blocks()[0];
      return (
        isLinear(first) &&
        first.params.inputNeurons === 8 &&
        first.params.outputNeurons === 16
      );
    },
    demo: [
      { kind: "type", target: layerField("Linear", "first", "out"), text: "16" },
    ],
  },
  {
    id: "add-output-layer",
    title: "6. Add a new layer",
    description:
      "New layers are always added to the bottom of the canvas. Watch the new layer's In: it's filled in automatically to match the previous layer's Out, so the layers stay connected.",
    target: LAYER_WORKSPACE,
    placement: "corner",
    tab: AppTabs.LAYERS,
    interactive: true,
    task: "Drag a second Linear block onto the canvas. Its In should become 16.",
    isComplete: () => blocks().filter(isLinear).length >= 2,
    demo: [dragToCanvas("linear")],
  },
  {
    id: "output-layer-args",
    title: "7. Make it an output layer",
    description:
      "The last layer produces the answer. We want one number, the probability of diabetes. Sigmoid squashes any value into the 0 to 1 range, which is exactly what a probability needs.",
    target: LAYER_WORKSPACE,
    placement: "corner",
    tab: AppTabs.LAYERS,
    interactive: true,
    task: 'On the bottom Linear layer, set Out to 1 and change Activation to "Sigmoid".',
    isComplete: () => {
      const last = blocks().filter(isLinear).at(-1);
      return (
        !!last &&
        last.params.outputNeurons === 1 &&
        last.activationFunction === "Sigmoid"
      );
    },
    demo: [
      { kind: "type", target: layerField("Linear", "last", "out"), text: "1" },
      {
        kind: "choose",
        target: layerField("Linear", "last", "activation"),
        text: "Sigmoid",
      },
    ],
  },
  {
    id: "add-dropout",
    title: "8. Add a Dropout layer",
    description:
      "During training, Dropout randomly switches off a fraction of neurons (0.25 means 25%). This makes the network less likely to memorize the training data. You can change that number on the block.",
    target: LAYER_WORKSPACE,
    placement: "corner",
    tab: AppTabs.LAYERS,
    interactive: true,
    task: "Drag a Dropout block onto the canvas.",
    isComplete: () => blocks().some(isDropout),
    demo: [dragToCanvas("dropout")],
  },
  {
    id: "reorder",
    title: "9. Reorder layers by dragging",
    description:
      "Dropout landed at the bottom, but the output layer has to stay last. You can grab any block on the canvas and drag it to a new position. To remove a layer, hover over it and click the × on its right.",
    target: LAYER_WORKSPACE,
    placement: "corner",
    tab: AppTabs.LAYERS,
    interactive: true,
    task: "Drag the Dropout block up so it sits between the two Linear layers.",
    isComplete: () => {
      const all = blocks();
      const idx = all.findIndex(isDropout);
      return (
        idx > 0 &&
        all.slice(0, idx).some(isLinear) &&
        all.slice(idx + 1).some(isLinear)
      );
    },
    demo: [
      {
        kind: "drag",
        from: () => canvasLayers("Dropout")[0] ?? null,
        to: belowFirstLinear,
        grab: "header",
      },
    ],
  },
  {
    id: "minimap",
    title: "10. Peek at the code",
    description:
      "Every block maps to real PyTorch code. The </> button shows the model you just built as PyTorch. Click it again to close.",
    target: ["pytorch-minimap-panel", "pytorch-minimap"],
    placement: "left",
    tab: AppTabs.LAYERS,
    interactive: true,
    task: "Optional: click the </> button to see your model in PyTorch.",
    demo: [{ kind: "click", target: () => q('[data-tour="pytorch-minimap"]') }],
  },
  {
    id: "go-to-training",
    title: "11. Head to Training",
    description:
      "Your model is built. Next, choose how it learns. Use these tabs to move between building, training and viewing outputs.",
    target: ["tab-toggle"],
    placement: "bottom",
    interactive: true,
    task: "Click the TRAINING tab.",
    isComplete: ({ tab }) => tab === AppTabs.TRAINING,
    demo: [{ kind: "click", target: tabOption("Training") }],
  },
  {
    id: "training-config",
    title: "12. Fill in the training arguments",
    description:
      "Loss measures how wrong the model is. BCE is the right choice for yes/no problems. The Optimizer (Adam) decides how to adjust the model's weights. Learning Rate sets how big each adjustment is. Epochs is how many times the model sees the whole dataset. Batch Size is how many examples it looks at before each adjustment. The ↺ button next to a field resets it to its default.",
    target: ["training-config"],
    placement: "right",
    tab: AppTabs.TRAINING,
    interactive: true,
    task: 'Give your run a name (e.g. "My first model"). You can also try changing Epochs.',
    isComplete: () => training().runName.trim().length > 0,
    demo: [
      {
        kind: "type",
        target: () => q('[data-tour="training-config"] input[type="text"]'),
        text: "My first model",
      },
    ],
  },
  {
    id: "start-training",
    title: "13. Submit for training",
    description:
      "Start Training sends your layers and training arguments to the server, which builds the PyTorch model and starts training it. The first run can take a few seconds while the dataset loads. If you see \"Not connected\", check the server status dot in the top bar and try again.",
    target: ["start-training", "training-error"],
    placement: "bottom",
    tab: AppTabs.TRAINING,
    interactive: true,
    task: "Click Start Training.",
    isComplete: () => {
      const t = training();
      return (
        t.isTraining ||
        t.isLiveTraining ||
        t.trainingHistory.length > historyLengthAtStart
      );
    },
    demo: [{ kind: "click", target: () => q('[data-tour="start-training"] button') }],
  },
  {
    id: "watch-training",
    title: "14. Watch it learn",
    description:
      "This panel updates live: the progress bar, a loss graph that should trend down, and train/test accuracy. Test accuracy is measured on data the model never trained on, so it's the most honest score. You can Pause, Resume or Stop at any time. If an error appears or the server is offline, use Skip.",
    target: ["training-history", "start-training", "training-error"],
    placement: "left",
    tab: AppTabs.TRAINING,
    interactive: true,
    task: "Wait for training to finish.",
    isComplete: () =>
      training().trainingHistory.length > historyLengthAtStart,
  },
  {
    id: "training-history",
    title: "15. Your training history",
    description:
      "Every finished run is saved here. Click a run's title to expand its full loss graph and a diagram of the model. Python Notebook downloads runnable code for it. If you change your model and train again, each new run shows green/red +/-% compared with the previous one.",
    target: ["training-history"],
    placement: "left",
    tab: AppTabs.TRAINING,
    interactive: true,
    task: "Optional: click your run's title to expand it.",
  },
  {
    id: "go-to-outputs",
    title: "16. View the outputs",
    description:
      "The Outputs tab takes a deeper look at the predictions from your most recent run.",
    target: ["tab-toggle"],
    placement: "bottom",
    interactive: true,
    task: "Click the OUTPUTS tab.",
    isComplete: ({ tab }) => tab === AppTabs.OUTPUTS,
    demo: [{ kind: "click", target: tabOption("Outputs") }],
  },
  {
    id: "outputs",
    title: "17. Read the results",
    description:
      "The Confusion Matrix shows how often each true class was predicted as each class. Correct predictions sit on the diagonal. Accuracy, F1, Precision and Recall summarize it overall and per class. Random Samples and Misclassified show individual predictions, which helps you see where the model struggles.",
    target: ["outputs-panel", "outputs-empty"],
    placement: "corner",
    tab: AppTabs.OUTPUTS,
    interactive: true,
    task: "Optional: switch between the three sections.",
  },
  {
    id: "finish",
    title: "You trained a neural network! 🎉",
    description:
      "Next, go back to Layers and experiment: add layers, change Out sizes or activations, retrain, and compare runs in the history. Or pick MNIST with the LeNet architecture to try an image model. You can replay this tutorial at any time from here.",
    target: ["tutorial-button"],
    placement: "bottom",
  },
];

export default TUTORIAL_STEPS;
