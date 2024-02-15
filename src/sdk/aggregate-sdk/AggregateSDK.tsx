import {
  Button,
  Form,
  Grid,
  Input,
  Modal,
  Select,
  Space,
  Tooltip,
  Typography,
  notification,
  theme,
} from "antd";
import { useNavigate } from "react-router-dom";
import { ColumnsType } from "antd/es/table";
import {
  PostMessageData,
  categorizeAccountsByType,
  currencyValue,
  errorNotifier,
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
  sendOverview,
  useMultipleLoanParts,
  useMultipleProvidersAccounts,
} from "../../gateway-api/gateway-service";
import {
  AccountWithProviderWithPctPerfT,
  LoanPartWithProviderT,
} from "../../gateway-api/types";
import { BankLogo, Layout, StyledTable } from "../../components";
import { useTranslation } from "react-i18next";

interface IModalForm {
  fullname: string;
  ssn: string;
  userEmail: string;
  adviserEmail: string;
}

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
  const [modalForm] = Form.useForm<IModalForm>();
  const [isAdviserModalOpen, setIsAdviserModalOpen] = useState(false);
  const [isLoadingSendOverview, setisLoadingSendOverview] = useState(false);

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
  } = useMultipleProvidersAccounts(providers, true);

  const {
    data: loansData,
    isFetching: isFetchingLoans,
    refetch: refetchLoans,
    error: errorLoans,
  } = useMultipleLoanParts(providers, true);

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
    return acc.type === "INVESTMENT" || acc.type === "PENSION"
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

  const handleSendOverview = async (form: IModalForm) => {
    console.log("handleSendOverview", form);
    try {
      const { fullname, ssn, userEmail, adviserEmail } = form;
      setisLoadingSendOverview(true);
      const res = await sendOverview({
        sids: providers.map((el) => el.sid),
        fullname,
        ssn,
        userEmail,
        adviserEmail,
      });
      console.log("send overview response", res);
      notification.success({
        message: t("Overview sent to adviser!"),
        duration: 10,
      });
      setIsAdviserModalOpen(false);
    } catch (err: any) {
      console.log("Send Overview failed", err);
      errorNotifier({
        description: (
          <pre>{typeof err === "string" ? err : JSON.stringify(err)}</pre>
        ),
      });
    } finally {
      setisLoadingSendOverview(false);
    }
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
            onClick={() => setIsAdviserModalOpen(true)}
          >
            {t("button.Send Report")}
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
      <Modal
        title={t("Send Overview to Adviser")}
        open={isAdviserModalOpen}
        onOk={modalForm.submit}
        okButtonProps={{
          loading: isLoadingSendOverview,
          htmlType: "submit",
        }}
        onCancel={() => setIsAdviserModalOpen(false)}
        width={400}
      >
        <Form<IModalForm>
          layout="vertical"
          form={modalForm}
          onFinish={(values) => handleSendOverview(values)}
          requiredMark={false}
        >
          <Form.Item
            label={t("Full Name")}
            name="fullname"
            rules={[{ required: true }]}
            style={{ marginTop: 20, marginBottom: 10 }}
          >
            <Input placeholder={t("Full Name")} style={{ height: 35 }} />
          </Form.Item>
          <Form.Item
            label={t("Personnummer")}
            name="ssn"
            rules={[{ required: true }]}
            style={{ marginBottom: 10 }}
          >
            <Input placeholder={t("placeholder.SSN")} style={{ height: 35 }} />
          </Form.Item>
          <Form.Item
            label={t("Email")}
            name="userEmail"
            rules={[{ required: true, type: "email" }]}
            style={{ marginBottom: 10 }}
          >
            <Input
              type="email"
              placeholder="user@email.com"
              style={{ height: 35 }}
            />
          </Form.Item>
          <Form.Item
            label={t("Adviser")}
            name="adviserEmail"
            rules={[{ required: true, type: "email" }]}
          >
            <Select
              showSearch
              placeholder={t("placeholder.Select an adviser")}
              optionFilterProp="children"
              filterOption={(
                input: string,
                option?: { label: string; value: string }
              ) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={[
                {
                  value: "carl@finsquid.io",
                  label: "Carl Meiton - carl@finsquid.io",
                },
                {
                  value: "Christer.wikman@gmail.com",
                  label: "Christer Wikman - Christer.wikman@gmail.com",
                },
                {
                  value: "sharapa.oleg@finsquid.io",
                  label: "Oleg Sharapa - sharapa.oleg@finsquid.io",
                },
                {
                  value: "peter@finsquid.io",
                  label: "Peter Pilestedt - peter@finsquid.io",
                },
                {
                  value: "mikael.strandberg@strandbergkapital.se",
                  label:
                    "Mikael Strandberg - mikael.strandberg@strandbergkapital.se",
                },
                {
                  value: "patrik.rosenberg@strandbergkapital.se",
                  label:
                    "Patrik Rosenberg - patrik.rosenberg@strandbergkapital.se",
                },
                {
                  value: "rasmus.dahlberg@strandbergkapital.se",
                  label:
                    "Rasmus Dahlberg - rasmus.dahlberg@strandbergkapital.se",
                },
                {
                  value: "oscar.karlsson@strandbergkapital.se",
                  label: "Oscar Karlsson - oscar.karlsson@strandbergkapital.se",
                },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
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
