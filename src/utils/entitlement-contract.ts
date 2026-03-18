export type AccessType =
  | 'beta'
  | 'subscription'
  | 'trial'
  | 'free_trial'
  | 'reverse_trial'
  | 'free_lite'
  | 'free'
  | 'none';

export interface EntitlementLimits {
  tasksPerDay: number;
  calendarIntegrations: number;
  scriptsLimit: number;
  aiAssistant: boolean;
  voiceCalls: boolean;
  customScripts: boolean;
  teamMembers: number;
  marketplace: boolean;
}

export interface EntitlementFeatures {
  marketplace: boolean;
  scriptsTemplates: boolean;
  integrations: boolean;
}

export interface AccessStatus {
  hasAccess: boolean;
  accessType: AccessType;
  plan?: string;
  memberNumber?: number;
  trialEnd?: string;
  daysRemaining?: number;
  expiresAt?: string | null;
  limits?: EntitlementLimits;
  features?: EntitlementFeatures;
  reverseTrialActive?: boolean;
}

export const LITE_TIER_LIMITS: EntitlementLimits = {
  tasksPerDay: 10,
  calendarIntegrations: 1,
  scriptsLimit: 3,
  aiAssistant: false,
  voiceCalls: false,
  customScripts: false,
  teamMembers: 1,
  marketplace: false,
};

const FULL_ACCESS_LIMITS: EntitlementLimits = {
  tasksPerDay: 999999,
  calendarIntegrations: 999999,
  scriptsLimit: 999999,
  aiAssistant: true,
  voiceCalls: true,
  customScripts: true,
  teamMembers: 999999,
  marketplace: true,
};

export function resolveEntitlementFeatures(access: AccessStatus): EntitlementFeatures {
  const accessType = access.accessType;
  const hasPaidLikeAccess =
    accessType === 'beta' ||
    accessType === 'subscription' ||
    accessType === 'trial' ||
    accessType === 'free_trial' ||
    accessType === 'reverse_trial';
  const hasMarketplace = hasPaidLikeAccess || Boolean(access.limits?.marketplace);

  return {
    marketplace: hasMarketplace,
    scriptsTemplates: hasMarketplace,
    integrations: hasPaidLikeAccess || accessType === 'free' || accessType === 'free_lite',
  };
}

export function normalizeAccessStatus(input: Partial<AccessStatus> | null | undefined): AccessStatus {
  const accessType = (input?.accessType || 'none') as AccessType;
  const hasPaidLikeAccess =
    accessType === 'beta' ||
    accessType === 'subscription' ||
    accessType === 'trial' ||
    accessType === 'free_trial' ||
    accessType === 'reverse_trial';

  const limits = input?.limits
    ? {
        ...LITE_TIER_LIMITS,
        ...input.limits,
      }
    : hasPaidLikeAccess
      ? FULL_ACCESS_LIMITS
      : accessType === 'free' || accessType === 'free_lite'
        ? LITE_TIER_LIMITS
        : undefined;

  const normalized: AccessStatus = {
    hasAccess: Boolean(input?.hasAccess),
    accessType,
    plan: input?.plan,
    memberNumber: input?.memberNumber,
    trialEnd: input?.trialEnd,
    daysRemaining: input?.daysRemaining,
    expiresAt: input?.expiresAt ?? null,
    limits,
    reverseTrialActive: input?.reverseTrialActive,
  };
  normalized.features = resolveEntitlementFeatures(normalized);
  return normalized;
}

export function hasEntitlementFeature(access: AccessStatus, feature: keyof EntitlementFeatures): boolean {
  return Boolean(access.features?.[feature]);
}
