import { openPhoneRouteWithFallback } from '../utils/native-link';

export async function requestWebPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function showLocalAgentNotification(title: string, body: string, deepLink?: string): void {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  const notification = new Notification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { deepLink },
    tag: `agent:${Date.now()}`,
  });
  notification.onclick = () => {
    if (deepLink) {
      openPhoneRouteWithFallback(deepLink, { origin: window.location.origin });
    } else {
      window.focus();
    }
  };
}
