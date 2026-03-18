export interface NativeRuntimeStatus {
  isCapacitor: boolean;
  isIOS: boolean;
  isStandalonePwa: boolean;
  surface: 'ios-native' | 'pwa' | 'web';
}

export function getNativeRuntimeStatus(): NativeRuntimeStatus {
  const hasWindow = typeof window !== 'undefined';
  const hasNavigator = typeof navigator !== 'undefined';
  const capacitor = hasWindow && Boolean((window as any).Capacitor);
  const ua = hasNavigator ? String(navigator.userAgent || '') : '';
  const isiOS = /iPhone|iPad|iPod/i.test(ua);
  const standalone = hasWindow
    && (window.matchMedia?.('(display-mode: standalone)').matches
      || (navigator as any)?.standalone === true);

  if (capacitor) {
    return {
      isCapacitor: true,
      isIOS: isiOS,
      isStandalonePwa: false,
      surface: 'ios-native',
    };
  }

  if (standalone) {
    return {
      isCapacitor: false,
      isIOS: isiOS,
      isStandalonePwa: true,
      surface: 'pwa',
    };
  }

  return {
    isCapacitor: false,
    isIOS: isiOS,
    isStandalonePwa: false,
    surface: 'web',
  };
}
