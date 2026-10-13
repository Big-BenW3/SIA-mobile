// ─── Push registration (Expo Push Service) ──────────────────────────
// Expo Go (SDK 53+) REMOVED remote-push native code: even a static
// `import 'expo-notifications'` throws at bundle-eval time and kills
// _layout. So this module must NEVER statically import it — lazy
// require() only, guarded by appOwnership + try/catch. Returns null
// in Expo Go / simulators / missing credentials; app works fully
// except remote buzz.
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

let handlerSet = false;

function getNotifications(): NotificationsModule | null {
  try {
    // Expo Go has no remote-push native module — bail before require.
    if (Constants.appOwnership === 'expo') return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-notifications') as NotificationsModule;
    return mod ?? null;
  } catch {
    return null;
  }
}

function ensureHandler(Notifications: NotificationsModule) {
  if (handlerSet) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    handlerSet = true;
  } catch {
    // handler setup is best-effort in odd runtimes
  }
}

export async function registerPushToken(): Promise<string | null> {
  try {
    const Notifications = getNotifications();
    if (!Notifications) return null;
    if (!Device.isDevice) return null;
    ensureHandler(Notifications);
    const { status: existing } = await Notifications.getPermissionsAsync();
    const status =
      existing === 'granted' ? existing : (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return null;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data ?? null;
  } catch {
    // Expo Go / missing credentials: push quietly unavailable.
    return null;
  }
}
