import { AppTabs, UILayer } from "~/types/index";
import { getBlockMeta } from "~/util/defaultConfigs";

export type TutorialPlacement =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "center"
  | "corner";

/** Which column of the neuron diagram the current step is about. */
export type SketchFocus = "input" | "hidden" | "output";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  /** Every matching `data-tour` element is highlighted; the card is placed next to the first one. */
  target: string[] | null;
  placement: TutorialPlacement;
  /** Switch to this tab when the step is entered. */
  tab?: AppTabs;
  /** Let clicks through the highlight so the canvas can be edited. */
  interactive?: boolean;
  /** Draw the live neuron diagram, emphasizing this column. */
  sketch?: SketchFocus;
}

const LAYER_LESSON_IDS = new Set([
  "layer-inputs",
  "layer-hidden",
  "layer-output",
]);

export const isLayerLessonStep = (id: string | undefined) =>
  !!id && LAYER_LESSON_IDS.has(id);

/** Two-layer network used only by the layer lesson. Not the Pima preset. */
export function createPimaLessonBlocks(): UILayer[] {
  return [
    {
      id: "lesson-linear-hidden",
      ...getBlockMeta("Linear"),
      activationFunction: "ReLU",
      params: { inputNeurons: 8, outputNeurons: 16 },
    },
    {
      id: "lesson-linear-output",
      ...getBlockMeta("Linear"),
      activationFunction: "Sigmoid",
      params: { inputNeurons: 16, outputNeurons: 1 },
    },
  ];
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "dataset",
    title: "Pick a dataset",
    description:
      "Choose what the model learns from. Start from Custom to build your own network, or pick a preset architecture.",
    target: ["dataset", "architecture"],
    placement: "bottom",
    tab: AppTabs.LAYERS,
  },
  {
    id: "layer-inputs",
    title: "Eight numbers in",
    description:
      "Pima describes each patient with 8 measurements, like glucose, BMI, and age. They enter the first layer through In.",
    target: ["layer-canvas"],
    placement: "corner",
    tab: AppTabs.LAYERS,
    interactive: true,
    sketch: "input",
  },
  {
    id: "layer-hidden",
    title: "The hidden layer",
    description:
      "Out is how many neurons this layer has. Change the top block's Out from 16 to 8 and the middle row shrinks. The next layer's In follows.",
    target: ["layer-canvas"],
    placement: "corner",
    tab: AppTabs.LAYERS,
    interactive: true,
    sketch: "hidden",
  },
  {
    id: "layer-output",
    title: "One answer",
    description:
      "The last layer has Out 1. Sigmoid keeps that number between 0 and 1, the probability of diabetes.",
    target: ["layer-canvas"],
    placement: "corner",
    tab: AppTabs.LAYERS,
    interactive: true,
    sketch: "output",
  },
  {
    id: "training-config",
    title: "Training settings",
    description:
      "Set the loss, optimizer, learning rate, epochs, and batch size before you train.",
    target: ["training-config"],
    placement: "right",
    tab: AppTabs.TRAINING,
  },
  {
    id: "train",
    title: "Train and compare",
    description:
      "Start a run and watch loss and accuracy update. Finished runs stay in the history so you can compare them.",
    target: ["start-training", "training-history"],
    placement: "corner",
    tab: AppTabs.TRAINING,
  },
  {
    id: "outputs",
    title: "Read the results",
    description:
      "After a run, the confusion matrix and sample predictions show where the model is right and where it struggles.",
    target: ["outputs-panel", "outputs-empty"],
    placement: "corner",
    tab: AppTabs.OUTPUTS,
  },
  {
    id: "done",
    title: "That's it",
    description:
      "Reopen this tour anytime from the Tutorial button in the navbar.",
    target: null,
    placement: "center",
  },
];

export default TUTORIAL_STEPS;
