/**
 * Precision Cross-Platform Notification Dispatcher for Web & PWA
 * Handles Android ServiceWorker, iOS Standalone Web Push, Desktop & In-App Fallbacks
 */
import { soundEngine } from './soundEngine';

export interface NotificationDiagnostic {
  supported: boolean;
  permission: NotificationPermission;
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  hasServiceWorker: boolean;
  serviceWorkerActive: boolean;
  reason?: string;
}

export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /android/.test(window.navigator.userAgent.toLowerCase());
}

export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export async function checkNotificationDiagnostic(): Promise<NotificationDiagnostic> {
  const isIOS = isIOSDevice();
  const isAndroid = isAndroidDevice();
  const isStandalone = isRunningStandalone();
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const hasServiceWorker = typeof window !== 'undefined' && 'serviceWorker' in navigator;

  let serviceWorkerActive = false;
  if (hasServiceWorker) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      serviceWorkerActive = !!reg?.active;
    } catch {
      serviceWorkerActive = false;
    }
  }

  const permission: NotificationPermission = supported
    ? Notification.permission
    : 'default';

  let reason = '';
  if (!supported) {
    if (isIOS && !isStandalone) {
      reason = 'On iPhone, Apple disables notifications in Safari browser tabs. You must tap Share ➔ Add to Home Screen and launch the app from your home screen.';
    } else {
      reason = 'Notification API is not supported on this browser or webview.';
    }
  } else if (permission === 'denied') {
    reason = 'Notifications are blocked in your browser or phone site permissions. Tap the lock icon in the URL bar to allow.';
  } else if (permission === 'default') {
    reason = 'Notification permission has not been requested yet.';
  } else {
    reason = 'Notifications are granted and active.';
  }

  return {
    supported,
    permission,
    isStandalone,
    isIOS,
    isAndroid,
    hasServiceWorker,
    serviceWorkerActive,
    reason,
  };
}

export async function requestDeviceNotificationPermission(): Promise<{
  granted: boolean;
  status: NotificationPermission;
  message: string;
}> {
  if (typeof window === 'undefined') {
    return { granted: false, status: 'denied', message: 'Window is not defined' };
  }

  const isIOS = isIOSDevice();
  const isStandalone = isRunningStandalone();

  if (!('Notification' in window)) {
    if (isIOS && !isStandalone) {
      return {
        granted: false,
        status: 'denied',
        message: 'On iPhone, Apple requires you to Add to Home Screen first. Open Safari ➔ Share ➔ Add to Home Screen.',
      };
    }
    return {
      granted: false,
      status: 'denied',
      message: 'Notifications are not supported in this browser.',
    };
  }

  try {
    const status = await Notification.requestPermission();
    if (status === 'granted') {
      return {
        granted: true,
        status,
        message: 'Notifications successfully allowed! You will now receive task alerts.',
      };
    } else if (status === 'denied') {
      return {
        granted: false,
        status,
        message: 'Notifications were blocked. Tap the lock/tune icon near your address bar to set Notifications to "Allow".',
      };
    }
    return {
      granted: false,
      status,
      message: 'Notification permission dismissed.',
    };
  } catch (err) {
    return {
      granted: false,
      status: 'denied',
      message: `Permission request failed: ${String(err)}`,
    };
  }
}

export async function sendDeviceNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    tag?: string;
    playSound?: boolean;
  }
): Promise<{ success: boolean; method: string; message: string }> {
  // 1. Play audio chime if requested
  if (options.playSound !== false) {
    soundEngine.playReminderAlarm();
  }

  // 2. Try vibrating on mobile devices
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch {}
  }

  const notifOptions: NotificationOptions = {
    body: options.body,
    icon: options.icon || './icon-192.png',
    badge: './icon-192.png',
    tag: options.tag || `ticktick-${Date.now()}`,
  };

  // If Notification API is available and granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    // A. Priority 1: Service Worker Registration (Required for Android & iOS PWA)
    if ('serviceWorker' in navigator) {
      try {
        const reg = await Promise.race([
          navigator.serviceWorker.getRegistration(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200)),
        ]);

        if (reg && reg.showNotification) {
          await reg.showNotification(title, notifOptions);
          return {
            success: true,
            method: 'service-worker',
            message: 'Native notification displayed via Service Worker.',
          };
        }
      } catch (err) {
        console.warn('[NotificationEngine] ServiceWorker showNotification failed, trying fallback:', err);
      }
    }

    // B. Priority 2: Standard Window Notification (Desktop browsers)
    try {
      new Notification(title, notifOptions);
      return {
        success: true,
        method: 'window-notification',
        message: 'Native notification displayed via Window Notification.',
      };
    } catch (err) {
      console.warn('[NotificationEngine] Window Notification failed:', err);
    }
  }

  const diag = await checkNotificationDiagnostic();
  return {
    success: false,
    method: 'none',
    message: diag.reason || 'Could not display system notification.',
  };
}
