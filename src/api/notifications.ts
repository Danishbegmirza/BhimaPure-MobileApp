const BASE_URL = 'http://bhimaadmin.smacononline.com/api';

// ─── Notification Detail Response ─────────────────────────────────────────────

export interface NotificationDetailResponse {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    title: string;
    description: string;
    image?: string | null;
    created_at?: string;
    action_type?: string;
    action_data?: Record<string, unknown>;
  };
}

/**
 * Fetch notification details by ID
 * GET /api/push-notifications/{notification_id}
 */
export async function fetchNotificationDetail(
  notificationId: string | number,
): Promise<NotificationDetailResponse> {
  try {
    const response = await fetch(`${BASE_URL}/push-notifications/${notificationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to fetch notification: ${response.status}`,
      };
    }

    const data = await response.json();
    
    // Handle different response formats
    if (data.success !== undefined) {
      return data;
    }
    
    // If API returns data directly without success wrapper
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Error fetching notification detail:', error);
    return {
      success: false,
      message: 'Failed to fetch notification details. Please try again.',
    };
  }
}

// ─── Mark Notification as Read ────────────────────────────────────────────────

export interface MarkReadResponse {
  success: boolean;
  message?: string;
}

/**
 * Mark a notification as read
 * POST /api/push-notifications/{notification_id}/read
 */
export async function markNotificationAsRead(
  token: string,
  notificationId: string | number,
): Promise<MarkReadResponse> {
  try {
    const response = await fetch(`${BASE_URL}/push-notifications/${notificationId}/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return {
      success: response.ok,
      message: data.message,
    };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return {
      success: false,
      message: 'Failed to mark notification as read.',
    };
  }
}

// ─── Register FCM Token ───────────────────────────────────────────────────────

export interface RegisterTokenResponse {
  success: boolean;
  message?: string;
}

/**
 * Register FCM token with backend
 * POST /api/device-tokens
 */
export async function registerFCMToken(
  token: string,
  fcmToken: string,
  platform: 'android' | 'ios',
): Promise<RegisterTokenResponse> {
  try {
    const response = await fetch(`${BASE_URL}/device-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fcm_token: fcmToken,
        platform: platform,
      }),
    });

    const data = await response.json();
    return {
      success: response.ok,
      message: data.message,
    };
  } catch (error) {
    console.error('Error registering FCM token:', error);
    return {
      success: false,
      message: 'Failed to register device token.',
    };
  }
}
