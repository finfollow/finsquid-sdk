import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AccountOverview,
  Position,
  ProviderConnectT,
  ProviderT,
} from "../gateway-api/types";

export interface SetGlobalState<T> {
  (state: T | ((prevState: T) => T)): void;
}

const GLOBAL_STATE_KEY_PREFIX = "globalState";

export function useGlobalState<T = undefined>(
  key: string
): [T, SetGlobalState<T>];
export function useGlobalState<T>(
  key: string,
  initialState: T
): [T, SetGlobalState<T>];
export function useGlobalState<T>(
  key: string,
  initialState?: T
): [T | undefined, SetGlobalState<T>] {
  const queryClient = useQueryClient();

  const stateKey = [GLOBAL_STATE_KEY_PREFIX, key];
  const { data } = useQuery(stateKey, () => initialState, {
    initialData: initialState,
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const setData: SetGlobalState<T> = (state) => {
    const newState = state instanceof Function ? state(data as T) : state;
    queryClient.setQueryData(stateKey, newState);
  };

  return [data, setData];
}

export const useLoginProvider = () => {
  return useGlobalState<ProviderConnectT | null>("loginProvider", null);
};

export const useLoginIsSameDevice = () => {
  return useGlobalState<boolean>("loginIsSameDevice", false);
};

export const useIsLoginWithSSN = () => {
  return useGlobalState<boolean>("isLoginWithSSN", false);
};

export const useTransferingProvider = () => {
  return useGlobalState<ProviderT | null>("transferingProvider", null);
};

export const useTransferingAccount = () => {
  return useGlobalState<AccountOverview | null>("transferingAccount", null);
};

export const useReceivingAccount = () => {
  return useGlobalState<AccountOverview | null>("receivingAccount", null);
};

export const useTransferingPrositions = () => {
  return useGlobalState<Position[]>("transferingPrositions", []);
};

export const useConnectionSSN = () => {
  return useGlobalState<string>("connectionSSN", "");
};

export const useConnectedProviders = (initialState = []) => {
  return useGlobalState<ProviderT[]>("connectedProviders", initialState);
};
