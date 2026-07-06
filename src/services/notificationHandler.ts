import { Linking } from 'react-native';
import { navigationRef } from '../navigation/navigationRef';
import type { NotificationMessage } from './notifications';

// Notification action types
export type NotificationActionType = 'scheme' | 'in_app' | 'external_url' | 'payment_reminder';

// Notification data structure from FCM
export interface NotificationData {
  notification_id?: string;
  action_type?: NotificationActionType;
  scheme_id?: string;
  external_url?: string;
  customer_scheme_id?: string;
  image?: string;
}

/**
 * Extract notification data from FCM message
 */
export function extractNotificationData(message: NotificationMessage): NotificationData {
  return {
    notification_id: message.data?.notification_id as string | undefined,
    action_type: message.data?.action_type as NotificationActionType | undefined,
    scheme_id: message.data?.scheme_id as string | undefined,
    external_url: message.data?.external_url as string | undefined,
    customer_scheme_id: message.data?.customer_scheme_id as string | undefined,
    image: message.data?.image as string | undefined,
  };
}

/**
 * Handle notification based on action type
 * @param message - The FCM notification message
 * @param fromQuitState - Whether app was opened from quit state
 */
export function handleNotificationAction(
  message: NotificationMessage,
  fromQuitState: boolean = false
): void {
  const data = extractNotificationData(message);
  
  if (!data.action_type) {
    console.log('No action_type in notification data');
    return;
  }

  // Wait for navigation to be ready if from quit state
  const executeNavigation = () => {
    if (!navigationRef.isReady()) {
      // Retry after a short delay if navigation isn't ready
      setTimeout(() => executeNavigation(), 500);
      return;
    }

    switch (data.action_type) {
      case 'scheme':
        handleSchemeNotification(data);
        break;
      case 'in_app':
        handleInAppNotification(data);
        break;
      case 'external_url':
        handleExternalUrlNotification(data);
        break;
      case 'payment_reminder':
        handlePaymentReminderNotification(data);
        break;
      default:
        console.log('Unknown notification action type:', data.action_type);
    }
  };

  if (fromQuitState) {
    // Give the app time to initialize before navigating
    setTimeout(() => executeNavigation(), 1000);
  } else {
    executeNavigation();
  }
}

/**
 * Handle promotional scheme notification
 * Navigate to SchemeDetails screen with scheme_id
 */
function handleSchemeNotification(data: NotificationData): void {
  if (!data.scheme_id) {
    console.log('No scheme_id in notification data');
    return;
  }

  console.log('Navigating to SchemeDetails with scheme_id:', data.scheme_id);
  navigationRef.navigate('SchemeDetails', { schemeId: data.scheme_id });
}

/**
 * Handle in-app notification
 * Navigate to NotificationDetail screen with notification_id
 */
function handleInAppNotification(data: NotificationData): void {
  if (!data.notification_id) {
    console.log('No notification_id in notification data');
    return;
  }

  console.log('Navigating to NotificationDetail with notification_id:', data.notification_id);
  navigationRef.navigate('NotificationDetail', { notificationId: data.notification_id });
}

/**
 * Handle external URL notification
 * Open URL in device's default browser
 */
function handleExternalUrlNotification(data: NotificationData): void {
  if (!data.external_url) {
    console.log('No external_url in notification data');
    return;
  }

  console.log('Opening external URL:', data.external_url);
  Linking.openURL(data.external_url).catch(err => {
    console.error('Failed to open URL:', err);
  });
}

/**
 * Handle payment reminder notification
 * Navigate to MySchemes and then to specific customer scheme
 */
function handlePaymentReminderNotification(data: NotificationData): void {
  if (!data.customer_scheme_id) {
    // If no specific scheme, just go to MySchemes
    console.log('Navigating to MySchemes');
    navigationRef.navigate('MySchemes');
    return;
  }

  console.log('Navigating to MySchemeDetails with customer_scheme_id:', data.customer_scheme_id);
  // Navigate to MySchemeDetails with the customer scheme ID
  navigationRef.navigate('MySchemeDetails', { schemeId: data.customer_scheme_id });
}

/**
 * Store pending notification for handling after app is ready
 */
let pendingNotification: NotificationMessage | null = null;

export function setPendingNotification(message: NotificationMessage | null): void {
  pendingNotification = message;
}

export function getPendingNotification(): NotificationMessage | null {
  return pendingNotification;
}

export function clearPendingNotification(): void {
  pendingNotification = null;
}

/**
 * Process pending notification if any
 */
export function processPendingNotification(): void {
  if (pendingNotification) {
    handleNotificationAction(pendingNotification, true);
    clearPendingNotification();
  }
}
