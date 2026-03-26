import type { PublicPlan } from './load-brain.types';
import { loadNexusBrain } from './load-brain';

export const PRICING_INTENT_RE =
  /\b(price|pricing|plan|plans|cost|how much|monthly|annual|annually|billing|subscription|starter|professional|enterprise|free|pro|team)\b/i;

function plans(): PublicPlan[] {
  return loadNexusBrain().publicPlans;
}

function trialPhrase(): string {
  const days = loadNexusBrain().trialDays;
  const word =
    days === 14
      ? 'fourteen day'
      : days === 7
        ? 'seven day'
        : `${days} day`;
  return `All paid plans include a ${word} free trial, no credit card needed.`;
}

/** Voice-friendly closing sentence (matches prior nexus-guest copy). */
function trialClosing(): string {
  const days = loadNexusBrain().trialDays;
  const n = days === 14 ? 'fourteen' : days === 7 ? 'seven' : String(days);
  return `All paid plans include a ${n} day free trial with no credit card needed.`;
}

export function buildPricingKnowledge(): string {
  const PLANS = plans();
  const free = PLANS.find((p) => p.name.toLowerCase() === 'free');
  const starter = PLANS.find((p) => p.name.toLowerCase() === 'starter');
  const professional = PLANS.find((p) => p.name.toLowerCase() === 'professional');
  const enterprise = PLANS.find((p) => p.name.toLowerCase() === 'enterprise');
  const trial = trialPhrase();

  return `PRICING (single source of truth from nexus-brain knowledge):
Free is ${free?.price ?? 0} dollars.
Starter is ${starter?.price ?? 19} dollars per month, or ${starter?.priceAnnual ?? 15} dollars per month billed annually.
Professional is ${professional?.price ?? 49} dollars per month, or ${professional?.priceAnnual ?? 39} dollars per month billed annually.
Enterprise is ${enterprise?.price ?? 99} dollars per month, or ${enterprise?.priceAnnual ?? 79} dollars per month billed annually.
${trial}`;
}

export function buildPricingReply(userText: string): string {
  const PLANS = plans();
  const trialSuffix = trialClosing();

  const q = userText.toLowerCase();
  if (/\bstarter\b/.test(q)) {
    const starter = PLANS.find((p) => p.name.toLowerCase() === 'starter');
    return `Starter is ${starter?.price ?? 19} dollars per month, or ${starter?.priceAnnual ?? 15} dollars per month billed annually. ${trialSuffix}`;
  }
  if (/\bprofessional\b|\bpro\b/.test(q)) {
    const professional = PLANS.find((p) => p.name.toLowerCase() === 'professional');
    return `Professional is ${professional?.price ?? 49} dollars per month, or ${professional?.priceAnnual ?? 39} dollars per month billed annually. ${trialSuffix}`;
  }
  if (/\benterprise\b/.test(q)) {
    const enterprise = PLANS.find((p) => p.name.toLowerCase() === 'enterprise');
    return `Enterprise is ${enterprise?.price ?? 99} dollars per month, or ${enterprise?.priceAnnual ?? 79} dollars per month billed annually. ${trialSuffix}`;
  }
  if (/\bteam\b/.test(q)) {
    const enterprise = PLANS.find((p) => p.name.toLowerCase() === 'enterprise');
    return `We no longer list a separate Team tier. The current top tier is Enterprise at ${enterprise?.price ?? 99} dollars per month, or ${enterprise?.priceAnnual ?? 79} dollars per month billed annually. ${trialSuffix}`;
  }

  const free = PLANS.find((p) => p.name.toLowerCase() === 'free');
  const starter = PLANS.find((p) => p.name.toLowerCase() === 'starter');
  const professional = PLANS.find((p) => p.name.toLowerCase() === 'professional');
  const enterprise = PLANS.find((p) => p.name.toLowerCase() === 'enterprise');
  return `Current pricing is: Free is ${free?.price ?? 0} dollars. Starter is ${starter?.price ?? 19} dollars per month, or ${starter?.priceAnnual ?? 15} dollars per month billed annually. Professional is ${professional?.price ?? 49} dollars per month, or ${professional?.priceAnnual ?? 39} dollars per month billed annually. Enterprise is ${enterprise?.price ?? 99} dollars per month, or ${enterprise?.priceAnnual ?? 79} dollars per month billed annually. ${trialSuffix}`;
}
