import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

type NetworkContextType = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  retry: () => Promise<void>;
};

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  retry: async () => {},
});

export function useNetwork() {
  return useContext(NetworkContext);
}

type NetworkProviderProps = {
  children: ReactNode;
};

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable);
    });

    NetInfo.fetch().then((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);

  const retry = useCallback(async () => {
    const state = await NetInfo.fetch();
    setIsConnected(state.isConnected ?? false);
    setIsInternetReachable(state.isInternetReachable);
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected, isInternetReachable, retry }}>
      {children}
    </NetworkContext.Provider>
  );
}
