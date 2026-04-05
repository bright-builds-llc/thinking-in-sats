export const itemCategories = [
  "food-drink",
  "groceries-household",
  "transport",
  "subscriptions-digital",
  "clothing-personal-care",
  "services-errands",
  "travel-experiences",
  "larger-purchases",
] as const;

export type ItemCategory = (typeof itemCategories)[number];

export const itemCategoryLabels: Record<ItemCategory, string> = {
  "food-drink": "Food & drink",
  "groceries-household": "Groceries & household",
  transport: "Transport",
  "subscriptions-digital": "Subscriptions & digital life",
  "clothing-personal-care": "Clothing & personal care",
  "services-errands": "Services & errands",
  "travel-experiences": "Travel & experiences",
  "larger-purchases": "Larger purchases",
};

export type EverydayItem = {
  id: string;
  name: string;
  category: ItemCategory;
  approxUsdCents: number;
  description: string;
  featuredOnTimeline: boolean;
};

export type EverydayItemWithSats = EverydayItem & {
  satValue: number;
  btcValue: number;
  categoryLabel: string;
};

export type TimelineLane = "left" | "right" | "center";

export type TimelineMark = {
  valueSats: number;
  label: string;
  position: number;
};

export type TimelinePlacement = {
  item: EverydayItemWithSats;
  exactPosition: number;
  displayPosition: number;
  lane: TimelineLane;
};

export type QuizChoiceView = {
  id: string;
  sats: number;
  label: string;
  supportingText: string;
  isCorrect: boolean;
};

export type QuizQuestion = {
  item: EverydayItemWithSats;
  choices: QuizChoiceView[];
  correctChoiceId: string;
  correctChoiceSatAmount: number;
};

export type QuizQuestionResult = {
  isCorrect: boolean;
  selectedChoice: QuizChoiceView;
  correctChoice: QuizChoiceView;
};

export type ItemSnapshot = EverydayItemWithSats;
