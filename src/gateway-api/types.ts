export type Provider = {
  id: number;
  name?: string;
  country?: string;
  displayName?: string;
  loginOptions?: LoginOptions[];
  customer?: ["Personal" | "Corporate"];
  providerType?: ProviderType;
  iconUrl?: string;
  isTest?: boolean;
  deprecated?: boolean;
};

export enum ProviderType {
  "Retail",
  "Commercial",
  "Investment",
  "Credit Union",
  "Private",
  "S&L",
  "Challenger",
  "Neobank",
  "Other",
  "Test",
}

export type ProviderName =
  | "nordnet"
  | "avanza"
  | "swedbank"
  | "seb"
  | "soderbergpartners"
  | "carnegie"
  | "handelsbanken"
  | "testprovider"
  | "nordea_se";

export type LoginOptions = {
  loginMethod?: LoginMethod;
  params?: LoginParam[];
  iconUrl?: string;
};

export type LoginMethod =
  | "mitid"
  | "bankid"
  | "bankidSSN"
  | "usernamePassword"
  | "card reader w/cable"
  | "card reader w/o cable"
  | "QR-reader";

export type LoginParam = {
  name?: string;
  type?: string;
  regexValidator?: string | null;
  optional?: boolean;
};

export type BankLoginBody = {
  providerId: number;
  loginOption:
    | {
        loginMethod: "usernamePassword";
        username: string;
        password: string;
      }
    | {
        loginMethod: "bankidSSN";
        userId: string;
        sameDevice?: boolean;
      }
    | {
        loginMethod: "bankid";
        sameDevice?: boolean;
      }
    | {
        loginMethod: "mitid";
        userId: string;
        sameDevice?: boolean;
      };
};

export type BankLoginRes =
  | {
      status: "pending" | "failed" | "conflict" | "complete";
      sid?: string;
      autostartToken?: string;
      imageChallengeData?: string;
      qrCodeImage?: string;
    }
  | undefined;

export type BankIdStatus = {
  imageChallengeData?: string;
  qrCodeImage?: string;
  status: SessionStatus;
  raw?: any;
};

export type LoginStatus = {
  status: SessionStatus;
  raw?: any;
};

export type SessionStatus =
  | "complete"
  | "pending"
  | "timeout"
  | "conflict"
  | "error"
  | "failed";

export type UserAccount = {
  accountId: string;
  accountName: string;
};

export type AccountOverview = Partial<Account> | Account;
export type AccountsOverview = {
  accounts: Partial<Account>[] | Account[];
};

export type Account = {
  /** Provider's internal id of account */
  providerAccountId: string;
  /** The provider's internal name of account type */
  providerAccountType: string;
  /** If current user is owner, true or false */
  owner?: boolean;
  /** Provider's account number */
  providerAccountNumber: string;
  /** User's given name of account, or provider's default name if none is given */
  name: string;
  /** Current account's account type */
  type: AccountType;
  subType: AccountSubType;
  /** Current balance in liquid cash */
  balance?: Money;
  /** Current total value of account */
  totalValue?: Money;
  /** Account provider */
  provider: ProviderName;
  providerAccountCreated?: LocalDate;
  /**Raw account data */
  raw?: any;
  sid?: string;
};

export type AccountType =
  | "BANKACCOUNT"
  | "INVESTMENT"
  | "PENSION"
  | "LOAN"
  | "OTHER";

export type AccountSubType =
  | "KF"
  | "AF"
  | "ISK"
  | "TJP"
  | "SAVINGS"
  | "CHECKING"
  | "OTHER";

export type TransactionType =
  | "BUY"
  | "SELL"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "DIVIDEND"
  | "INTEREST_AND_FEES"
  | "TAX"
  | "OTHER";

export type LoanType =
  | "MORTGAGE"
  | "BLANCO"
  | "MEMBERSHIP"
  | "VEHICLE"
  | "LAND"
  | "STUDENT"
  | "CREDIT"
  | "OTHER";

export type Money = {
  amt?: number;
  cy?: Currency;
};

export type LocalDate = string;
export type Currency = string;
// export type ISIN = string;
// export type CountryCode = string;

export type Position = {
  /** Total amount held of instrument */
  quantity: number;
  /** The average acquired price of the instrument */
  acquiredPrice?: Money;
  /** The last price of the instrument */
  lastPrice?: Money;
  /** Opening price of the position */
  morningPriceTC?: Money;
  /** Current held value of instrument in traded currency */
  marketValueTC?: Money;
  /** Current held value of instrument in account currency */
  marketValueAC?: Money;
  /** The instruments currency */
  currency: Currency;
  /** Max returns in percent */
  pctReturn?: number;
  /** Percentage return today*/
  pctToday?: number;
  /** Return today in traded currency */
  todayTC?: Money;
  /** Max returns in traded currency */
  returnTC?: Money;
  /** Instrument of position */
  instrument: Instrument;
  /** Raws position data */
  raw?: any;
};

export type Instrument = {
  /** ISIN code of the instrument */
  isin: string;
  /** Internal id of the instrument from the provider */
  internalId: string;
  /** Full name of the instrument */
  name: string;
  /** Symbol or short name of the instrument */
  symbol?: string;
  /** Instrument type converted to enum */
  type?: InstrumentType;

  /** Instrument group type  */
  groupType?: string;

  /** Internal id of the market according to the provider */
  marketId?: string | null;
  /** Market identifier code */
  mic?: string;

  // TODO: Reseach type,groupType and assetClass usage
  /** Instrument type according to the provider */
  internalType?: string;
  // TODO: Reseach type,groupType and assetClass usage
  /** Instrument asset class */
  assetClass?: string;

  /** Instruments traded currency */
  currency?: Currency;
  /** Last price of the instrument */
  lastPrice?: Money;

  /** Market capitalization of the instrument */
  marketCap?: Money;
  /** Instrument sector */
  sector?: string;
  /** Instrument sector group */
  sectorGroup?: string;
  /** Collateral value of the instrument */
  collateralValue?: number;
  /** Management fee in percent */
  productFee?: number;
  /** Raw instrument data */
  raw?: any;
};

export type InstrumentType = "STOCK" | "FUND" | "ETF" | "CERTIFICATE" | "OTHER";

export type ProviderConnectT = Provider & {
  sid?: string | null;
};

export type ProviderT = Omit<ProviderConnectT, "sid"> & { sid: string };

export type AccountsWithProviderT = AccountsOverview & { provider: ProviderT };

export type LoanWithProviderT = Loan & { provider: ProviderT };
export type LoanPartWithProviderT = LoanPart & {
  provider: ProviderT;
  type: LoanType;
};

export type Loan = {
  /* Identifier for the loan */
  id: string;
  /* Name of the loan */
  name: string;
  /* Type of loan */
  type: LoanType;
  /* Aggregated sum of all loan parts */
  totalBalance?: Money;
  /* Total amount paid (amortised) */
  totalAmountPaid?: Money;
  /* Liability collateral such as an address */
  collateral?: string;
  /* The parts of the liability */
  loanParts?: LoanPart[];
  /* Raw data */
  raw?: any;
};

export type LoanPart = {
  /* Identifier for the loan part */
  id: string;
  /* Name for the loan part  */
  name: string;
  /* contract identifier */
  contractNumber: string;
  /* Amount to return */
  balance: Money;
  /* Amount paid (amortised) */
  amountPaid: Money;
  /* Interest rate of the loan part */
  interestRate: number | undefined;
  /* Date of opening loan part */
  openingDate?: string;
  /* Next payment date for the loan part */
  nextPaymentDate?: LocalDate;
  /* Finish date for the loan contract */
  expirationDate?: LocalDate;
  /* Payment periodicity of the loan */
  periodicity: Periodicity;
  /* Payment periodicity of the loan */
  internalPeriodicity?: string;
  /* Raw data */
  raw?: any;
};

export type Periodicity =
  | "DAILY"
  | "MONTHLY"
  | "QUARTERLY"
  | "ANNUALY"
  | "BIANNUALY"
  | "OTHER";

export type AccountWithProviderT = AccountOverview & { provider: ProviderT };
export type AccountWithProviderWithPctPerfT = AccountWithProviderT & {
  pctPerformance?: false | PercentagePerformance;
};

export type PercentagePerformance = {
  today?: number | null;
  ytd?: number | null;
  max?: number | null;
  l1Week?: number | null;
  l1Month?: number | null;
  l3Month?: number | null;
  l1Year?: number | null;
  l3Year?: number | null;
  l5Year?: number | null;
};

export type PerfTick = {
  date: LocalDate;
  /* accumulated monetary performance account currency */
  accMonetaryPerf: number;
  /* monetary performance account currency */
  monetaryPerf: number;
  /* accumulated percentage performance */
  accPctPerf: number;
  /* percentage performance */
  pctPerf: number;
};

export type CategorizedAccounts = {
  category?: AccountType;
  accounts: AccountWithProviderT[];
}[];

export type Transaction = {
  /** Predefined transaction types. If none are applicable OTHER can be used. */

  /** Provider's internal ID for the transaction */
  internalId: string;
  /** Specified by providers logged transaction type, e.g. BUY, SELL etc. */
  type: TransactionType;
  /** Providers internal transaction type */
  providerType: string;
  /** Specified by provider's logged commission, or null */
  commissionTC?: Money;
  /** Specified by provider's logged foreign tax rate, or null */
  foreignTaxRate?: number;
  /** Price per unit in traded currency */
  tradedPriceTC?: Money;
  /** Price per unit in account currency */
  unitPriceAC?: Money;
  /** Total amount paid in account currency */
  amountAC?: Money;
  /** Date when transaction was made */
  businessDate: LocalDate;
  /** Date when transaction was settled */
  settlementDate?: LocalDate;
  /** Number of shares in transaction */
  quantity: number;
  /** Specified by provider's logged interest, or null */
  interest?: number;
  /** Provider's internal message or description, eg "Purchased 3 stockName for 200 SEK" */
  message?: string;
  /** Instrument in transaction */
  instrument?: Instrument;
  /** Total charges credited (positive) or debited (negative) in account currency, excluding purchase or sell price. */
  chargesAC?: Money;

  raw?: any;
};

export type AccountDetails = {
  account: Account;
  positions: Position[];
  pctPerformance: PercentagePerformance;
};
