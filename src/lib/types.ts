export type OutputKind = "plan" | "numbers" | "creative";

export interface IntakeForm {
  businessName: string;
  industry: string;
  problem: string;
  goals: string;
  location: string;
  monthlyBudget: string;
}

export interface OutputCardMeta {
  kind: OutputKind;
  title: string;
  description: string;
  cost: number;
}

export const OUTPUT_CARDS: OutputCardMeta[] = [
  {
    kind: "plan",
    title: "Mini Marketing Plan",
    description:
      "A short positioning angle, content ideas, and next steps built from your answers.",
    cost: 1,
  },
  {
    kind: "numbers",
    title: "Numbers Projection",
    description:
      "A budget-to-reach-to-sales estimate, personalized to your industry, budget, and location.",
    cost: 1,
  },
  {
    kind: "creative",
    title: "Sample Creative",
    description:
      "A draft reel hook and caption you could post this week — proof of quality, not just a plan.",
    cost: 1,
  },
];

export const STARTING_CREDITS = 3;
