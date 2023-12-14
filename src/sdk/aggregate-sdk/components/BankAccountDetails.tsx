import { useParams } from "react-router-dom";
import { LoadingOutlined, SyncOutlined } from "@ant-design/icons";
import { Button, DatePicker, Grid, Space, Typography } from "antd";
import { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import {
  BankLogo,
  CustomSummary,
  Layout,
  StyledTable,
} from "../../../components";
import {
  currencyValue,
  errorNotifier,
  isDateInRange,
  tablesSort,
} from "../../../utils/helpers";
import { useTranslation } from "react-i18next";
import { useConnectedProviders } from "../../../utils/state-utils";
import { Transaction } from "../../../gateway-api/types";
import {
  useAccount,
  useAccountTransactions,
} from "../../../gateway-api/gateway-service";

const { RangePicker } = DatePicker;

export default function BankAccountDetails() {
  const { t } = useTranslation();
  const { sid, accountId } = useParams();
  if (!sid || !accountId) return null;
  const { xs } = Grid.useBreakpoint();
  const [transactions, setTransactions] = useState<Transaction[] | undefined>();
  const [dateRangeFilter, setDateRangeFilter] = useState<[string, string]>([
    "",
    "",
  ]);
  const [pageSize, setpageSize] = useState(50);
  const [providers] = useConnectedProviders();
  const { data, isLoading, error } = useAccount(sid, accountId, true);
  const {
    data: transactionData,
    isFetching,
    refetch,
    error: transactionError,
  } = useAccountTransactions(sid, accountId, true);
  const logoSrc = providers.find(
    (el) => el.name === data?.account.provider
  )?.iconUrl;

  useEffect(() => {
    setTransactions(
      transactionData?.filter((el) =>
        isDateInRange(el.businessDate, dateRangeFilter)
      )
    );
  }, [transactionData, dateRangeFilter]);

  useEffect(() => {
    if (error)
      errorNotifier({
        description: (
          <pre>
            {t("error.Account fetch error")}
            {"\n"}
            {JSON.stringify(error, null, 2)}
          </pre>
        ),
      });
  }, [error]);

  useEffect(() => {
    if (transactionError)
      errorNotifier({
        description: (
          <pre>
            {t("error.Transactions fetch error")}
            {"\n"}
            {JSON.stringify(transactionError, null, 2)}
          </pre>
        ),
      });
  }, [transactionError]);

  return (
    <Layout title={t("Account Details")}>
      <div
        style={{
          height: "2.5rem",
          display: "flex",
          justifyContent: "space-between",
          padding: xs ? "0 10px" : 0,
        }}
      >
        {isLoading ? (
          <LoadingOutlined style={{ marginLeft: xs ? 10 : 0 }} />
        ) : (
          <div style={{ display: "flex", alignItems: "center" }}>
            {logoSrc && (
              <BankLogo
                src={logoSrc}
                style={{
                  width: "2rem",
                  height: "2rem",
                  marginRight: 15,
                }}
              />
            )}
            {data?.account.providerAccountNumber === data?.account.name ? (
              <Typography.Title level={4} style={{ margin: 0 }}>
                {data?.account.name}
              </Typography.Title>
            ) : (
              <Space>
                {data?.account.name && (
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    {data?.account.name}
                  </Typography.Title>
                )}
                {data?.account.providerAccountNumber && (
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    {data?.account.providerAccountNumber}
                  </Typography.Title>
                )}
              </Space>
            )}
          </div>
        )}
        <Button onClick={() => refetch()}>
          <SyncOutlined spin={isFetching} />
        </Button>
      </div>

      <CustomSummary
        data={[
          {},
          {},
          {
            title: "Total",
            value: currencyValue(data?.account.totalValue, {
              fractionDigits: 0,
            }),
          },
        ]}
        containerStyle={{ marginTop: 15 }}
      />
      <div style={{ margin: xs ? "10px" : "10px 0" }}>
        <RangePicker
          onChange={(_, dateString) => {
            refetch();
            setDateRangeFilter(dateString);
          }}
          allowEmpty={[true, true]}
        />
      </div>
      <StyledTable
        loading={isFetching}
        columns={columns(t)}
        dataSource={transactions}
        rowKey={"internalId"}
        pagination={
          (transactions?.length || 0) > 50 && {
            showSizeChanger: true,
            pageSize,
            total: transactions?.length,
            onChange: (_, pageSize) => setpageSize(pageSize),
          }
        }
        containerStyle={{ borderRadius: xs ? 0 : 10 }}
        expandable={{
          columnWidth: 30,
          expandedRowRender: (tr) => (
            <pre style={{ marginLeft: 30, fontSize: 12 }}>
              {JSON.stringify(tr, null, 2)}
            </pre>
          ),
        }}
        scroll={{ x: true }}
      />
    </Layout>
  );
}

const columns: (t: any) => ColumnsType<Transaction> = (t) => [
  {
    title: t("table.Date"),
    dataIndex: "businessDate",
    sorter: (a, b) => tablesSort(a.businessDate, b.businessDate),
  },
  {
    title: t("table.Type"),
    key: "type",
    render: (_, tr) => t(`transactionType.${tr.type}`),
    sorter: (a, b) => tablesSort(a.type, b.type),
  },
  {
    title: t("table.Message"),
    dataIndex: "message",
    render: (q) => (q ? q : "-"),
    align: "right",
    sorter: (a, b) => tablesSort(a?.message, b?.message),
  },
  {
    title: t("table.Amount"),
    dataIndex: "amountAC",
    render: (m) => <b>{currencyValue(m)}</b>,
    align: "right",
    sorter: (a, b) => tablesSort(a.amountAC?.amt, b.amountAC?.amt),
  },
];
