import { DatePicker, Grid } from "antd";
import { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Transaction } from "../../../gateway-api/types";
import { useAccountTransactions } from "../../../gateway-api/gateway-service";
import {
  currencyValue,
  errorNotifier,
  isDateInRange,
  tablesSort,
} from "../../../utils/helpers";
import { StyledTable } from "../../../components";

type Props = {
  sid?: string;
  accountId?: string;
};

const { RangePicker } = DatePicker;

export default function TransactionsTab({ sid, accountId }: Props) {
  const { t } = useTranslation();
  if (!sid || !accountId) return null;
  const { xs } = Grid.useBreakpoint();
  const [transactions, setTransactions] = useState<Transaction[] | undefined>();
  const [dateRangeFilter, setDateRangeFilter] = useState<[string, string]>([
    "",
    "",
  ]);
  const [pageSize, setpageSize] = useState(50);
  const {
    data: transactionData,
    isFetching,
    refetch,
    error,
  } = useAccountTransactions(sid, accountId);

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
            {t("error.Transactions fetch error")}
            {"\n"}
            {JSON.stringify(error, null, 2)}
          </pre>
        ),
      });
  }, [error]);

  return (
    <div>
      <div
        style={{
          marginBottom: 10,
          marginLeft: xs ? 10 : 0,
        }}
      >
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
    </div>
  );
}

const columns: (t: any) => ColumnsType<Transaction> = (t) => [
  {
    title: t("table.Date"),
    dataIndex: "businessDate",
    sorter: (a, b) => tablesSort(a.businessDate, b.businessDate),
    width: 100,
  },
  {
    title: t("table.Position"),
    dataIndex: "position",
    render: (i, tr) => tr?.instrument?.name ?? "-",
    sorter: (a, b) => tablesSort(a.instrument?.name, b.instrument?.name),
  },
  {
    title: t("table.Type"),
    key: "type",
    render: (_, tr) => t(`transactionType.${tr.type}`),
    sorter: (a, b) => tablesSort(a.type, b.type),
  },
  {
    title: t("table.Quantity"),
    dataIndex: "quantity",
    render: (q) => (q ? q : "-"),
    align: "right",
    sorter: (a, b) => tablesSort(a.quantity, b.quantity),
  },
  {
    title: t("table.Price"),
    dataIndex: "tradedPriceTC",
    align: "right",
    render: (m) => currencyValue(m, { fractionDigits: 2 }),
    sorter: (a, b) => tablesSort(a.tradedPriceTC?.amt, b.tradedPriceTC?.amt),
  },
  {
    title: t("table.Amount"),
    dataIndex: "amountAC",
    render: (m) => <b>{currencyValue(m, { fractionDigits: 2 })}</b>,
    align: "right",
    sorter: (a, b) => tablesSort(a.amountAC?.amt, b.amountAC?.amt),
  },
];
