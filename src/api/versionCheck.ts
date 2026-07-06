// @ts-ignore
import VersionCheck from 'react-native-version-check';
import { Platform } from 'react-native';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.bhima.pure';

const APP_STORE_URL =
  'https://apps.apple.com/app/id123456789'; // Replace with actual App Store ID

export interface VersionCheckResponse {
  current_version: string;
  latest_version: string;
  needs_update: boolean;
  store_url: string;
}

/**
 * Compare semantic versions.
 * Returns:
 * -1 => current < latest
 *  0 => equal
 *  1 => current > latest
 */
export const compareVersions = (
  currentVersion: string,
  latestVersion: string,
): number => {
  const current = currentVersion.split('.').map(Number);
  const latest = latestVersion.split('.').map(Number);

  const length = Math.max(current.length, latest.length);

  for (let i = 0; i < length; i++) {
    const curr = current[i] ?? 0;
    const lat = latest[i] ?? 0;

    if (curr < lat) {
      return -1;
    }

    if (curr > lat) {
      return 1;
    }
  }

  return 0;
};

export async function checkAppVersion(): Promise<VersionCheckResponse | null> {
  try {
    const currentVersion = VersionCheck.getCurrentVersion();

    console.log(
      '[Version Check] Current Version:',
      currentVersion,
    );

    const latestVersion = await VersionCheck.getLatestVersion({
      provider: Platform.OS === 'ios' ? 'appStore' : 'playStore',
    });

    console.log(
      '[Version Check] Store Version:',
      latestVersion,
    );

    if (!latestVersion) {
      console.warn(
        '[Version Check] Unable to fetch latest version',
      );
      return null;
    }

    const needsUpdate =
      compareVersions(currentVersion, latestVersion) < 0;

    return {
      current_version: currentVersion,
      latest_version: latestVersion,
      needs_update: needsUpdate,
      store_url:
        Platform.OS === 'ios'
          ? APP_STORE_URL
          : PLAY_STORE_URL,
    };
  } catch (error) {
    console.error(
      '[Version Check] Error:',
      error,
    );

    return null;
  }
}