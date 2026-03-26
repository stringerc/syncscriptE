/** Shared with pricing.ts — avoids circular imports. */
export type PublicPlan = {
  name: string;
  price: number;
  priceAnnual?: number;
};
