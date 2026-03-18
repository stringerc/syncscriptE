export interface EnterpriseFeatureFlags {
  enterpriseMissionControlEnabled: boolean;
  enterpriseCloudRunsEnabled: boolean;
  enterpriseDesktopExpansionEnabled: boolean;
}

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

export function getEnterpriseFeatureFlags(): EnterpriseFeatureFlags {
  return {
    enterpriseMissionControlEnabled: toBool(
      import.meta.env.VITE_FEATURE_ENTERPRISE_MISSION_CONTROL,
      true
    ),
    enterpriseCloudRunsEnabled: toBool(
      import.meta.env.VITE_FEATURE_ENTERPRISE_CLOUD_RUNS,
      true
    ),
    enterpriseDesktopExpansionEnabled: toBool(
      import.meta.env.VITE_FEATURE_ENTERPRISE_DESKTOP_EXPANSION,
      false
    ),
  };
}
