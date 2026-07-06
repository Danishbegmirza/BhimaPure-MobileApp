declare module 'react-native-version-check' {
  interface NeedUpdateResult {
    isNeeded: boolean;
    currentVersion: string;
    latestVersion: string;
  }

  interface VersionCheckOptions {
    provider?: 'appStore' | 'playStore';
    packageName?: string;
    country?: string;
  }

  interface NeedUpdateOptions {
    currentVersion: string;
    latestVersion: string;
    depth?: number;
  }

  const VersionCheck: {
    getCurrentVersion(): string;
    getCurrentBuildNumber(): string;
    getLatestVersion(options?: VersionCheckOptions): Promise<string>;
    needUpdate(options: NeedUpdateOptions): Promise<NeedUpdateResult>;
    getPackageName(): string;
    getCountry(): string;
  };

  export default VersionCheck;
}
