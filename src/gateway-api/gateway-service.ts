import axios, { AxiosInstance } from "axios";
import {
  AccountDetails,
  AccountsOverview,
  AccountsWithProviderT,
  BankIdInitQueryParams,
  BankIdRes,
  BankIdStatus,
  LoanPartWithProviderT,
  LoanWithProviderT,
  LoginStatus,
  PerfTick,
  Position,
  Provider,
  ProviderT,
  Transaction,
  UserAccount,
} from "./types";
import { useQuery } from "@tanstack/react-query";
import { dummyReceivingAccounts } from "../utils/constants";
import { handleProvidersRejections } from "../utils/helpers";

const apiUrl = new URLSearchParams(document.location.search).get("api_url");
const url =
  apiUrl || import.meta.env.VITE_GATEWAY_URL || "http://localhost:8787";

export const httpClient: AxiosInstance = axios.create({
  url,
  timeout: 10000, // Timeout in milliseconds
  headers: {
    "Content-Type": "application/json",
  },
});

export function useProviders() {
  return useQuery<Provider[]>({
    queryKey: ["providersList"],
    queryFn: () =>
      httpClient(`${url}/v1/providers`)
        .then((res) => res.data)
        .catch((err) => {
          throw err?.response?.data || err;
        }),
  });
}

export async function bankIdInit(
  provider: string,
  ssn?: string,
  sameDevice = true,
  includeRawData = false
): Promise<Partial<BankIdRes>> {
  try {
    const data: BankIdInitQueryParams = {
      includeRawData: includeRawData,
      sameDevice: sameDevice,
    };
    if (ssn) data.userId = ssn;

    const res = await httpClient.post(
      `${url}/v1/login/${provider}/bankid/init
      `,
      data
    );

    const sid = res.headers["sid"];

    return {
      autostartToken: res.data.autostartToken,
      imageChallengeData: res.data.imageChallengeData,
      sid: sid,
      success: true,
    };
  } catch (error: any) {
    console.log("BankID init failed with error: ", error);
    throw error?.response?.data ?? error;
  }
}

export async function pollBankIdStatus(
  sid: string,
  sameDevice: boolean,
  includeRawData = false
): Promise<BankIdStatus> {
  try {
    console.log("pollBankIdStatus params: ", {
      sid,
      sameDevice,
      includeRawData,
    });
    const res = await httpClient(
      `${url}/v1/login/bankid/status?includeRawData=${includeRawData}&sameDevice=${sameDevice}`,
      { headers: { sid } }
    );
    console.log("BankID status", res.data.status);

    return {
      status: res.data.status,
      raw: res.data.raw,
      imageChallengeData: res.data.imageChallengeData,
    };
  } catch (error: any) {
    console.error("BankID status failed", error);
    throw error?.response?.data ?? error;
  }
}

export async function getUserAccounts(
  sid: string,
  includeRawData = false
): Promise<UserAccount[]> {
  try {
    const headers = {
      sid: sid,
    };
    const res = await httpClient(
      `${url}/v1/login/useraccounts?includeRawData=${includeRawData}`,
      { headers: headers }
    );
    return res.data;
  } catch (error: any) {
    console.error("getUserAccounts", error);
    throw error?.response?.data ?? error;
  }
}

export async function selectUserAccount(
  sid: string,
  userAccountId: string,
  includeRawData = false
): Promise<LoginStatus> {
  try {
    const res = await httpClient(
      `${url}/v1/login/useraccounts/select/${userAccountId}?includeRawData=${includeRawData}`,
      { headers: { sid } }
    );
    return res.data;
  } catch (error: any) {
    console.error("getUserAccounts", error);
    throw error?.response?.data ?? error;
  }
}

export function useAccount(
  sid: string,
  accountId: string,
  includeRawData = false
) {
  return useQuery<AccountDetails>({
    queryKey: ["accounts", sid, accountId],
    queryFn: () =>
      httpClient(
        `${url}/v1/accounts/${accountId}?includeRawData=${includeRawData}`,
        { headers: { sid } }
      )
        .then((res) => res.data)
        .catch((err) => {
          throw err?.response?.data || err;
        }),
  });
}

export function useAccounts(sid?: string | null, includeRawData = false) {
  return useQuery<AccountsOverview>({
    queryKey: ["accounts", sid],
    queryFn: () =>
      httpClient(`${url}/v1/accounts?includeRawData=${includeRawData}`, {
        headers: { sid: sid as string },
      })
        .then((res) => res.data)
        .catch((err) => {
          throw err?.response?.data || err;
        }),
    enabled: !!sid,
  });
}

export function usePerformance(
  sid: string,
  accountId: string,
  includeRawData = false
) {
  return useQuery<PerfTick[]>({
    queryKey: ["performance", sid, accountId],
    queryFn: () =>
      httpClient(
        `${url}/v1/accounts/${accountId}/performance?includeRawData=${includeRawData}`,
        { headers: { sid } }
      )
        .then((res) => res.data)
        .catch((err) => {
          throw err?.response?.data || err;
        }),
  });
}

export function useAccountPositions(
  sid: string,
  accountId: string,
  includeRawData = false
) {
  return useQuery<Position[]>({
    queryKey: ["positions", sid, accountId],
    queryFn: () =>
      httpClient(
        `${url}/v1/accounts/${accountId}/positions?includeRawData=${includeRawData}`,
        { headers: { sid: sid } }
      )
        .then((res) => res.data)
        .catch((err) => {
          throw err?.response?.data || err;
        }),
  });
}

export function useAccountTransactions(
  sid: string,
  accountId: string,
  accountType = "",
  includeRawData = false
) {
  return useQuery<Transaction[]>(
    ["accounts", sid, accountId, "transactions", accountType],
    () =>
      httpClient(
        `${url}/v1/accounts/${accountId}/transactions?includeRawData=${includeRawData}`,
        { headers: { sid: sid } }
      )
        .then((res) => res.data)
        .catch((err) => {
          throw err?.response?.data || err;
        })
  );
}

//dummy receiving request
export function useReceivingAccounts() {
  return useQuery<AccountsOverview>({
    queryKey: ["receivingAccounts"],
    queryFn: () =>
      new Promise((resolve) => {
        setTimeout(() => {
          const data = { accounts: dummyReceivingAccounts };
          resolve(data);
        }, 1000);
      }),
  });
}

const fetchProvidersAccounts = async (
  providers: ProviderT[],
  includeRawData = false
) => {
  try {
    const getAccounts = (provider: ProviderT): Promise<AccountsWithProviderT> =>
      httpClient(`${url}/v1/accounts?includeRawData=${includeRawData}`, {
        headers: { sid: provider.sid },
      }).then((res) => ({ ...res.data, provider }));

    const res = await Promise.allSettled(
      providers?.map((provider) => getAccounts(provider))
    );

    const rejectedRes = res.filter(
      (el) => el.status === "rejected"
    ) as PromiseRejectedResult[];

    const fulfilledRes = res.filter(
      (el) => el.status === "fulfilled"
    ) as PromiseFulfilledResult<AccountsWithProviderT>[];

    if (fulfilledRes.length && rejectedRes.length)
      handleProvidersRejections(
        rejectedRes,
        providers,
        // t("error.accounts fetch error")
        "Accounts fetch error"
      );

    if (!fulfilledRes.length) throw res;

    const accounts = fulfilledRes.flatMap((el) =>
      el.value.accounts.map((acc) =>
        Object.assign(acc, { provider: el.value.provider })
      )
    );

    return accounts;
  } catch (err) {
    throw err;
  }
};

export function useMultipleProvidersAccounts(
  providers: ProviderT[],
  includeRawData = false
) {
  const queryKey = JSON.stringify(providers.sort().map((el) => el.sid));

  return useQuery({
    queryKey: ["accountsCategorized", queryKey],
    queryFn: () => fetchProvidersAccounts(providers, includeRawData),
    enabled: !!providers?.filter((el) => el.sid)?.length,
  });
}

export function useMultipleLoanParts(
  providers: ProviderT[],
  includeRawData = false
) {
  const queryKey = JSON.stringify(providers.sort().map((el) => el.sid));
  return useQuery<LoanPartWithProviderT[]>({
    queryKey: ["loans", queryKey],
    queryFn: () => fetchProvidersLoanParts(providers, includeRawData),
    enabled: !!providers?.filter((el) => el.sid)?.length,
  });
}

const fetchProvidersLoanParts = async (
  providers: ProviderT[],
  includeRawData = false
) => {
  try {
    const getLoans = (provider: ProviderT): Promise<LoanWithProviderT[]> =>
      httpClient(`${url}/v1/loans?includeRawData=${includeRawData}`, {
        headers: { sid: provider.sid },
      }).then((res) =>
        res.data?.map((el: LoanWithProviderT) => ({ ...el, provider }))
      );

    const res = await Promise.allSettled(
      providers?.map((provider) => getLoans(provider))
    );

    const rejectedRes = res.filter(
      (el) => el.status === "rejected"
    ) as PromiseRejectedResult[];
    const fulfilledRes = res.filter(
      (el) => el.status === "fulfilled"
    ) as PromiseFulfilledResult<LoanWithProviderT[]>[];

    if (fulfilledRes.length && rejectedRes.length)
      handleProvidersRejections(
        rejectedRes,
        providers,
        // t("error.loans fetch error")
        "Loans fetch error"
      );

    if (!fulfilledRes.length) throw res;

    const loans = fulfilledRes
      .flatMap((result) => result.value)
      .flatMap((loan) =>
        loan.loanParts?.length
          ? loan.loanParts.map((part) => ({
              ...part,
              provider: loan.provider,
              type: loan.type,
            }))
          : []
      );

    return loans;
  } catch (err) {
    throw err;
  }
};

export const keepAliveSessions = async (sids: string[]) => {
  try {
    const getKeepAlive = (sid: string): Promise<AccountsWithProviderT> =>
      httpClient(`${url}/v1/login/alive`, {
        headers: { sid },
      }).then((res) => ({ ...res.data, sid }));
    const res = await Promise.allSettled(sids?.map((sid) => getKeepAlive(sid)));
    console.log("keep alive res: ", res);

    return res;
  } catch (err) {
    throw err;
  }
};
