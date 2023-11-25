import { Button, Grid, Space, Tooltip, Typography, theme } from "antd";
import { useNavigate } from "react-router-dom";
import { ColumnsType } from "antd/es/table";
import {
  PostMessageData,
  categorizeAccountsByType,
  currencyValue,
  formatTypeText,
  getNameFromTwoValues,
  handleProvidersRejections,
  percentValue,
  sendPostMessage,
  tablesSort,
  transformAccountSubType,
  transformLoanType,
} from "../../utils/helpers";
import { SyncOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { CategorizedAccounts, Currency } from "../../gateway-api/types";
import { useConnectedProviders } from "../../utils/state-utils";
import {
  useMultipleLoanParts,
  useMultipleProvidersAccounts,
} from "../../gateway-api/gateway-service";
import {
  AccountWithProviderWithPctPerfT,
  LoanPartWithProviderT,
} from "../../gateway-api/types";
import { BankLogo, Layout, StyledTable } from "../../components";
import { useTranslation } from "react-i18next";

export default function AggregateSDK() {
  const { t } = useTranslation();
  const { xs } = Grid.useBreakpoint();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [providers, setConnectedProviders] = useConnectedProviders();
  const [accounts, setAccounts] = useState<CategorizedAccounts>();
  const redirectUrl = new URLSearchParams(document.location.search).get(
    "redirect"
  );

  useEffect(() => {
    const handlePostMessage = (event: any) => {
      const { type, data }: PostMessageData =
        typeof event.data === "string" ? JSON.parse(event.data) : event.data;

      if (type === "providers") {
        setConnectedProviders(data?.length ? data : []);
        console.log("RESULT: ", data);
      }
    };
    window.addEventListener("message", handlePostMessage);
    return () => {
      window.removeEventListener("message", handlePostMessage);
    };
  }, []);

  const {
    data: rawAccounts,
    isFetching,
    refetch,
    error: errorAccounts,
  } = useMultipleProvidersAccounts(providers);

  const {
    data: loansData,
    isFetching: isFetchingLoans,
    refetch: refetchLoans,
    error: errorLoans,
  } = useMultipleLoanParts(providers);

  useEffect(() => {
    setAccounts(categorizeAccountsByType(rawAccounts));
  }, [rawAccounts]);

  useEffect(() => {
    if (errorAccounts)
      handleProvidersRejections(
        errorAccounts as PromiseRejectedResult[],
        providers,
        t("error.accounts fetch error")
      );
  }, [errorAccounts]);

  useEffect(() => {
    if (errorLoans)
      handleProvidersRejections(
        errorLoans as PromiseRejectedResult[],
        providers,
        t("error.loans fetch error")
      );
  }, [errorLoans]);

  const getRoute = (acc: AccountWithProviderWithPctPerfT) => {
    return acc.type === "INVESTMENT"
      ? `investmentAccount/${acc.provider.sid}/${acc.providerAccountId}`
      : `account/${acc.provider.sid}/${acc.providerAccountId}`;
  };

  const getLoansInterestRate = (loans: LoanPartWithProviderT[]) => {
    const totalWeightedInterest = loans?.reduce(
      (total, loan) =>
        total + (loan?.balance?.amt || 0) * (loan?.interestRate || 0),
      0
    );
    const totalBalance = loans?.reduce(
      (total, loan) => total + (loan?.balance?.amt || 0),
      0
    );
    return totalWeightedInterest / (totalBalance || 1);
  };

  return (
    <Layout title={t("Financial Overview")} hideBack>
      {!providers.length && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              maxWidth: 430,
              padding: "0 15px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography.Text>
              {t(
                "You have not connected any bank. Click on the button below to connect."
              )}
            </Typography.Text>
            <Button
              type="primary"
              block
              style={{
                width: 348,
                marginTop: 50,
                height: 40,
                borderRadius: 20,
              }}
              onClick={() => navigate(`auth/?redirect=${redirectUrl}`)}
            >
              {t("button.Connect Bank")}
            </Button>
          </div>
        </div>
      )}
      {!!providers.length && !isFetching && !rawAccounts?.length && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              maxWidth: 430,
              padding: "0 15px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography.Text>
              {t("Your session expired. Press Restart to add bank.")}
            </Typography.Text>
            <Button
              block
              style={{
                width: 348,
                marginTop: 50,
                height: 40,
                borderRadius: 20,
                borderColor: token.colorPrimary,
                borderWidth: 2,
              }}
              onClick={() => {
                sendPostMessage({ type: "providers", data: [], error: null });
                setConnectedProviders([]);
                navigate(`auth/?redirect=${redirectUrl}`);
              }}
            >
              {t("button.Restart")}
            </Button>
          </div>
        </div>
      )}
      <Space direction="vertical" style={{ position: "relative" }}>
        {(isFetching || !!rawAccounts?.length) && (
          <>
            <div
              style={{
                position: "absolute",
                right: 0,
                marginBottom: 10,
                marginRight: xs ? 10 : 0,
              }}
            >
              <Button
                onClick={() => {
                  refetchLoans();
                  refetch();
                }}
              >
                <SyncOutlined spin={isFetching} />
              </Button>
            </div>
            {accounts?.map((el, i) => {
              const totalValue = el.accounts.reduce(
                (total, acc) => {
                  total.amt += acc.totalValue?.amt || 0;
                  if (!total.cy && acc.totalValue?.cy)
                    total.cy = acc.totalValue?.cy;
                  return total;
                },
                { amt: 0, cy: undefined } as {
                  amt: number;
                  cy?: Currency;
                }
              );
              const customSummary = [
                {},
                {},
                {
                  title: "Total",
                  value: currencyValue(totalValue, { fractionDigits: 0 }),
                },
              ];
              if (el.category === "INVESTMENT") {
                const totalBalance = el.accounts.reduce(
                  (total, acc) => {
                    total.amt += acc.balance?.amt || 0;
                    if (!total.cy && acc.balance?.cy)
                      total.cy = acc.balance?.cy;
                    return total;
                  },
                  { amt: 0, cy: undefined } as {
                    amt: number;
                    cy?: Currency;
                  }
                );
                const totalInvested = {
                  amt: totalValue.amt - totalBalance.amt,
                  cy: totalValue.cy,
                };
                customSummary[0] = {
                  title: t("summary.Cash"),
                  value: currencyValue(totalBalance, { fractionDigits: 0 }),
                };
                customSummary[1] = {
                  title: t("summary.Invested"),
                  value: currencyValue(totalInvested, { fractionDigits: 0 }),
                };
              }
              return (
                <StyledTable
                  key={el.category || "category" + i}
                  tableTitle={t(`table.name.${el.category}`)}
                  loading={isFetching}
                  columns={columns(t)}
                  dataSource={el.accounts}
                  rowKey={(acc) => acc.providerAccountId as string}
                  style={{ cursor: "pointer" }}
                  containerStyle={{ borderRadius: xs ? 0 : 10 }}
                  onRow={(account) => ({
                    onClick: () => navigate(getRoute(account)),
                  })}
                  customSummary={customSummary}
                  scroll={{ x: true }}
                />
              );
            })}
          </>
        )}
        {!!loansData?.length && (
          <StyledTable
            tableTitle={t("table.name.LOAN")}
            rowKey={"id"}
            loading={isFetchingLoans}
            columns={loanColumns(t)}
            dataSource={loansData}
            containerStyle={{ borderRadius: xs ? 0 : 10 }}
            customSummary={
              loansData?.length
                ? [
                    {},
                    {
                      title: "Interest rate",
                      value: percentValue(getLoansInterestRate(loansData)),
                    },
                    {
                      title: "Total",
                      value: currencyValue(
                        loansData.reduce(
                          (total, loan) => {
                            total.amt += loan.balance.amt || 0;
                            if (!total.cy && loan.balance.cy)
                              total.cy = loan.balance.cy;
                            return total;
                          },
                          { amt: 0, cy: undefined } as {
                            amt: number;
                            cy?: Currency;
                          }
                        ),
                        { fractionDigits: 0 }
                      ),
                    },
                  ]
                : undefined
            }
            scroll={{ x: true }}
          />
        )}
      </Space>
      {(isFetching ||
        !!rawAccounts?.length ||
        isFetchingLoans ||
        !!loansData?.length) && (
        <Space
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Button
            type="primary"
            block
            style={{
              marginTop: 50,
              height: 40,
              borderRadius: 20,
              width: 348,
            }}
            onClick={() => navigate(`auth/?redirect=${redirectUrl}`)}
          >
            {t("button.Add Bank")}
          </Button>
          <Button
            block
            style={{
              height: 40,
              borderRadius: 20,
              borderColor: token.colorPrimary,
              borderWidth: 2,
              width: 348,
            }}
            onClick={() => {
              sendPostMessage({ type: "providers", data: [], error: null });
              setConnectedProviders([]);
              navigate(`auth/?redirect=${redirectUrl}`);
            }}
          >
            {t("button.Restart")}
          </Button>
        </Space>
      )}
    </Layout>
  );
}

const columns: (t: any) => ColumnsType<AccountWithProviderWithPctPerfT> = (
  t
) => [
  {
    render: (_, acc) => (
      <BankLogo
        src={acc.provider.iconUrl}
        style={{
          maxWidth: "2rem",
          maxHeight: "2rem",
        }}
      />
    ),
    width: "7%",
    responsive: ["sm"],
  },
  {
    title: t("table.Account"),
    key: "name",
    render: (_, acc) =>
      getNameFromTwoValues(acc.name, acc.providerAccountNumber),
    width: "33%",
    sorter: (a, b) =>
      tablesSort(
        getNameFromTwoValues(a.name, a.providerAccountNumber),
        getNameFromTwoValues(b.name, b.providerAccountNumber)
      ),
  },
  {
    title: t("table.Type"),
    key: "type",
    render: (_, acc) => (
      <div
        style={{
          width: "2rem",
          height: "2rem",
          borderRadius: "50%",
          border: "1px solid #D9DBE2",
          fontSize: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {transformAccountSubType(acc.subType)}
      </div>
    ),
    sorter: (a, b) => tablesSort(a.type, b.type),
  },
  {
    title: t("table.Amount"),
    dataIndex: "totalValue",
    align: "right",
    render: (m) => <b>{currencyValue(m)}</b>,
    sorter: (a, b) => tablesSort(a.totalValue?.amt, b.totalValue?.amt),
  },
];

const loanColumns: (t: any) => ColumnsType<LoanPartWithProviderT> = (t) => [
  {
    render: (_, loan) => (
      <BankLogo
        src={loan.provider.iconUrl}
        style={{
          maxWidth: "2rem",
          maxHeight: "2rem",
        }}
      />
    ),
    width: "7%",
  },
  {
    title: t("table.Loan"),
    dataIndex: "name",
    sorter: (a, b) => tablesSort(a.name, b.name),
  },
  {
    title: t("table.Type"),
    key: "type",
    render: (_, loan) => (
      <Tooltip title={formatTypeText(loan.type)}>
        <div
          style={{
            width: "2rem",
            height: "2rem",
            borderRadius: "50%",
            border: "1px solid #D9DBE2",
            fontSize: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {transformLoanType(loan.type)}
        </div>
      </Tooltip>
    ),
    sorter: (a, b) => tablesSort(a.type, b.type),
  },
  {
    title: t("table.Interest %"),
    key: "interestRate",
    align: "right",
    render: (_, l) => percentValue(l.interestRate),
    sorter: (a, b) => tablesSort(a.interestRate, b.interestRate),
  },
  {
    title: t("table.Amount"),
    dataIndex: "balance",
    align: "right",
    render: (m) => <b>{currencyValue(m)}</b>,
    sorter: (a, b) => tablesSort(a.balance?.amt, b.balance?.amt),
  },
];
