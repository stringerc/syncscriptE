export async function requireBiometricForCriticalApproval(reason: string): Promise<boolean> {
  const hasCapacitorRuntime = typeof window !== 'undefined' && Boolean((window as any).Capacitor);
  if (!hasCapacitorRuntime) return true;

  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    const available = await BiometricAuth.checkBiometry();
    if (!available?.isAvailable) return false;
    await BiometricAuth.authenticate({
      reason,
      cancelTitle: 'Cancel',
      allowDeviceCredential: true,
    });
    return true;
  } catch {
    return false;
  }
}
