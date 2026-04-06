import { foodAndDrinkItems } from "./foodAndDrink";
import { householdItems } from "./household";
import { largerPurchasesItems } from "./largerPurchases";
import { transportAndServicesItems } from "./transportAndServices";

export const everydayItems = [
  ...foodAndDrinkItems,
  ...householdItems,
  ...transportAndServicesItems,
  ...largerPurchasesItems,
];

export const featuredEverydayItems = everydayItems.filter(
  (item) => item.featuredOnTimeline,
);

export const quizOnlyEverydayItems = everydayItems.filter(
  (item) => !item.featuredOnTimeline,
);

export const totalEverydayItemCount = everydayItems.length;
