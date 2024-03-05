import { notification } from "antd";
import { ArgsProps } from "antd/es/notification/interface";
import {
  Account,
  AccountWithProviderT,
  CategorizedAccounts,
  InstrumentType,
  LoanType,
  Money,
  Position,
  ProviderT,
  TransactionType,
} from "../gateway-api/types";
import i18n from "../translations/i18n";
import { t } from "i18next";

export const currencyValue = (
  m: Money | null | undefined,
  options?: Intl.NumberFormatOptions & { fractionDigits?: number }
) => {
  return m?.amt
    ? Intl.NumberFormat(i18n.resolvedLanguage, {
        style: m?.cy ? "currency" : "decimal",
        currency: m?.cy || undefined,
        maximumFractionDigits: options?.fractionDigits ?? 2,
        minimumFractionDigits: options?.fractionDigits ?? 2,
        currencyDisplay: "code",
        notation: (m?.amt || 0) > 99999999 ? "compact" : "standard",
        ...options,
      }).format(m?.amt || 0)
    : "-";
};

export const percentValue = (
  val: number | null | undefined,
  options?: Intl.NumberFormatOptions & { fractionDigits?: number }
) => {
  return Intl.NumberFormat(i18n.resolvedLanguage, {
    style: "percent",
    maximumFractionDigits: options?.fractionDigits ?? 2,
    minimumFractionDigits: options?.fractionDigits ?? 2,
    currencyDisplay: "code",
    ...options,
  }).format(val || 0);
};

export function getNameFromTwoValues(
  val1: string | null | undefined,
  val2: string | null | undefined
): string {
  if (val1 === val2) return val1 || "";

  const name1 = !!val1 ? val1 : val2;
  if (!name1) return "";

  const name2 = val1 === name1 ? val2 : val1;
  return [name1, name2].filter(Boolean).join(" ");
}

export function tablesSort(
  a: string | number | null | undefined,
  b: string | number | null | undefined
) {
  if ((a === undefined && b === undefined) || (a === null && b === null))
    return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;

  return a > b ? 1 : -1;
}

export function isDateInRange(
  dateString: string,
  range: [string, string]
): boolean {
  const [startDateString, endDateString] = range;
  const dateToCheck = !!dateString && new Date(dateString);
  const startDate = !!startDateString && new Date(startDateString);
  const endDate = !!endDateString && new Date(endDateString);

  if (!dateToCheck) return false;
  if (!startDate && !endDate) return true;
  if (!startDate) return dateToCheck <= endDate;
  if (!endDate) return dateToCheck >= startDate;

  return dateToCheck >= startDate && dateToCheck <= endDate;
}

export const transformAccountSubType = (
  type: Account["subType"] | null | undefined
) => {
  switch (type) {
    case "CHECKING":
      return "CHK";
    case "SAVINGS":
      return "SV";
    case "OTHER":
      return "O";
    default:
      return type;
  }
};

export const getColorByValue = (value?: number | null) =>
  (value || 0) > 0 ? "#4DA343" : (value || 0) < 0 ? "#E64C2C" : "black";

export const formatTypeText = (
  type?: InstrumentType | TransactionType | LoanType
): string =>
  type
    ? type
        .split("_")
        .map((t) =>
          t === "ETF" ? t : t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
        )
        .join(" ")
    : "";

export const transformLoanType = (type: LoanType): string => {
  switch (type) {
    case "MORTGAGE":
      return "M";
    case "BLANCO":
      return "B";
    case "MEMBERSHIP":
      return "MS";
    case "VEHICLE":
      return "V";
    case "LAND":
      return "L";
    case "STUDENT":
      return "S";
    case "CREDIT":
      return "C";
    case "OTHER":
      return "O";
    default:
      return "";
  }
};

export const categorizeAccountsByType: (
  accounts?: AccountWithProviderT[]
) => CategorizedAccounts = (accounts?: AccountWithProviderT[]) =>
  accounts
    ?.map((el) => el.type)
    .filter((el, i, array) => array.indexOf(el) === i)
    .map((category) => ({
      category,
      accounts: accounts.filter((el) => el.type === category),
    })) ?? [
    { category: "INVESTMENT", accounts: [] },
    { category: "BANKACCOUNT", accounts: [] },
  ];

export const categorizePositionsByType = (positions?: Position[]) =>
  positions
    ?.map((el) => el.instrument.type)
    .filter((el, i, array) => array.indexOf(el) === i)
    .map((type) => ({
      type,
      positions: positions.filter((el) => el.instrument.type === type),
    }));

export type ResultMessageData = {
  type: "success" | "providers" | "error";
  data?: any;
  error?: { type?: string; message?: any } | null;
};

export const sendResultMessage = (message: ResultMessageData) => {
  console.log("sendResultMessage document.location.search", document.location);
  const searchParams = new URLSearchParams(document.location.search);
  const isIframe = searchParams.get("iframe") === "true";
  console.log("sendResultMessage isIframe", isIframe);
  const baseRedirectLink = searchParams.get("redirect");
  console.log("sendResultMessage baseRedirectLink", baseRedirectLink);
  if (isIframe) window.parent.postMessage(message, baseRedirectLink || "*");
  else if (baseRedirectLink) {
    const redirectUrl = new URL(baseRedirectLink);

    redirectUrl.searchParams.set("type", message.type);
    if (message.type === "error") {
      redirectUrl.searchParams.set("error", message.error?.type || "");
      redirectUrl.searchParams.set("message", message.error?.message || "");
    } else {
      redirectUrl.searchParams.set(
        "data",
        encodeURIComponent(
          typeof message.data === "object"
            ? JSON.stringify(message.data)
            : message.data
        )
      );
    }
    console.log("sendResultMessage redirectUrl: ", redirectUrl);
    window.open(redirectUrl, "_self");
  }
};

export const openAuthSdk = () => {
  const baseUrl = window.location.origin;
  const searchParams = new URLSearchParams(window.location.search);

  searchParams.delete("type");
  searchParams.delete("data");
  searchParams.delete("error");
  searchParams.delete("message");
  searchParams.delete("redirect");
  const redirectToAuthResult = new URL(
    `${baseUrl}/aggregate/auth-result/?${searchParams.toString()}`
  );

  searchParams.delete("iframe");
  const authSdkLink = new URL(
    `${baseUrl}/auth/?${searchParams.toString()}&redirect=${encodeURIComponent(
      redirectToAuthResult.toString()
    )}`
  );

  window.open(authSdkLink, "_self");
};

export const errorNotifier = ({
  message = t("error.An error has occurred"),
  duration = 5,
  ...props
}: Omit<ArgsProps, "message"> & { message?: ArgsProps["message"] }) => {
  notification.error({
    message,
    duration,
    ...props,
  });
};

export const handleProvidersRejections = (
  rejections: PromiseRejectedResult[],
  providers: ProviderT[],
  errorMessage: string
) => {
  // @TODO handle errors
  errorNotifier({
    description: (
      <>
        {rejections.map((el, index) => {
          const provider = providers.find(
            (p) => p.sid === el.reason?.config?.headers?.sid
          );
          if (el?.reason?.response?.data)
            return (
              <div
                key={errorMessage + index}
              >{`${provider?.displayName} ${errorMessage} ${el?.reason?.response?.data}`}</div>
            );
          return (
            <pre key={errorMessage + index}>
              {`${provider?.displayName} ${errorMessage}`}
              <br />
              {JSON.stringify(el.reason, null, 2)}
            </pre>
          );
        })}
      </>
    ),
  });
};
