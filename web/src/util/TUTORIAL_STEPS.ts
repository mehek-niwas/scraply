import { AppTabs, UILayer } from "~/types/index";
import { getBlockMeta } from "~/util/defaultConfigs";

export type TutorialPlacement =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "center"
  | "corner";

/** Which of the two layers the diagram should emphasize. */
export type SketchFocus = "layer1" | "layer2";

/** One ghost action. It plays once and does not block Next. */
export type TutorialHint = "drag" | "sizes" | "sigmoid";

/** Canvas staged while the ghost builds the two-layer lesson. */
export type LessonStage = "empty" | "one" | "two" | "sized" | "sigmoid";

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
  /** Draw the live neuron diagram, emphasizing this layer. */
  sketch?: SketchFocus;
  hint?: TutorialHint;
  /** Canvas to show when the step opens, before the ghost finishes. */
  lessonBefore?: LessonStage;
  /** Canvas to show once the ghost finishes, or when leaving the step forward. */
  lessonAfter?: LessonStage;
}

const lessonLinear = (
  id: string,
  activation: "ReLU" | "Sigmoid",
  inputNeurons: number,
  outputNeurons: number,
): UILayer => ({
  id,
  ...getBlockMeta("Linear"),
  activationFunction: activation,
  params: { inputNeurons, outputNeurons },
});

/** Stages of the two-layer lesson. Not the Pima preset. */
export function lessonBlocks(stage: LessonStage): UILayer[] {
  if (stage === "empty") return [];
  if (stage === "one") return [lessonLinear("lesson-linear-1", "ReLU", 8, 8)];
  if (stage === "two") {
    return [
      lessonLinear("lesson-linear-1", "ReLU", 8, 8),
      lessonLinear("lesson-linear-2", "ReLU", 8, 8),
    ];
  }
  if (stage === "sized") {
    return [
      lessonLinear("lesson-linear-1", "ReLU", 8, 16),
      lessonLinear("lesson-linear-2", "ReLU", 16, 1),
    ];
  }
  return [
    lessonLinear("lesson-linear-1", "ReLU", 8, 16),
    lessonLinear("lesson-linear-2", "Sigmoid", 16, 1),
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
    id: "layer-one",
    title: "Layer 1",
    description:
      "Drag Linear onto the canvas. That block is layer 1. In is how many numbers come in, and Out is how many neurons. The diagram shows the layer when it lands.",
    target: ["layer-toolbox", "layer-canvas"],
    placement: "corner",
    tab: AppTabs.LAYERS,
    interactive: true,
    hint: "drag",
    lessonBefore: "empty",
    lessonAfter: "one",
    sketch: "layer1",
  },
  {
    id: "layer-two",
    title: "Layer 2",
    description:
      "Drag Linear again so it sits under the first. That is layer 2. Its In matches layer 1's Out, which connects the two layers.",
    target: ["layer-toolbox", "layer-canvas"],
    placement: "corner",
    tab: AppTabs.LAYERS,
    interactive: true,
    hint: "drag",
    lessonBefore: "one",
    lessonAfter: "two",
    sketch: "layer2",
  },
  {
    id: "layer-sizes",
    title: "Set In and Out",
    description:
      "Pima has 8 measurements, so layer 1's In stays 8. Set its Out to 16. Layer 2's Out is 1: one answer for each patient. Layer 2's In follows layer 1.",
    target: ["layer-canvas"],
    placement: "corner",
    tab: AppTabs.LAYERS,
    interactive: true,
    hint: "sizes",
    lessonBefore: "two",
    lessonAfter: "sized",
    sketch: "layer1",
  },
  {
    id: "layer-sigmoid",
    title: "Sigmoid on layer 2",
    description:
      "On the last layer, change Activation to Sigmoid. That keeps the answer between 0 and 1.",
    target: ["layer-canvas"],
    placement: "corner",
    tab: AppTabs.LAYERS,
    interactive: true,
    hint: "sigmoid",
    lessonBefore: "sized",
    lessonAfter: "sigmoid",
    sketch: "layer2",
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
