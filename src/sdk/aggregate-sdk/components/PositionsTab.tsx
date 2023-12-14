import { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { Grid } from "antd";
import { Position } from "../../../gateway-api/types";
import { useTranslation } from "react-i18next";
import { useAccount } from "../../../gateway-api/gateway-service";
import {
  currencyValue,
  errorNotifier,
  getColorByValue,
  percentValue,
  tablesSort,
} from "../../../utils/helpers";
import { StyledTable } from "../../../components";

type Props = {
  sid?: string;
  accountId?: string;
};

type PositionWithShare = Position & { share?: number };

export default function PositionsTab({ sid, accountId }: Props) {
  const { t } = useTranslation();
  if (!sid || !accountId) return null;
  const { xs } = Grid.useBreakpoint();
  const [positions, setPositions] = useState<PositionWithShare[] | undefined>();
  const [pageSize, setpageSize] = useState(50);
  const { data, isFetching, error } = useAccount(sid, accountId, true);

  useEffect(() => {
    if (data) {
      const totalAmount = data.positions.reduce(
        (sum, pos) => sum + (pos.marketValueAC?.amt || 0),
        0
      );
      setPositions(
        data.positions?.map((pos) => ({
          ...pos,
          share: (pos.marketValueAC?.amt || 0) / totalAmount,
        }))
      );
    }
  }, [data]);

  useEffect(() => {
    if (error)
      errorNotifier({
        description: (
          <pre>
            {t("error.Positions fetch error")}
            {"\n"}
            {JSON.stringify(error, null, 2)}
          </pre>
        ),
      });
  }, [error]);

  return (
    <>
      <StyledTable
        loading={isFetching}
        columns={columns(t)}
        dataSource={positions}
        rowKey={(p) => p.instrument.isin}
        pagination={
          (positions?.length || 0) > 50 && {
            showSizeChanger: true,
            pageSize,
            total: positions?.length,
            onChange: (_, pageSize) => setpageSize(pageSize),
          }
        }
        containerStyle={{ borderRadius: xs ? 0 : 10 }}
        expandable={{
          columnWidth: 30,
          expandedRowRender: (pos) => (
            <pre style={{ marginLeft: 30, fontSize: 12 }}>
              {JSON.stringify(pos, null, 2)}
            </pre>
          ),
        }}
        scroll={{ x: true }}
      />
    </>
  );
}

const columns: (t: any) => ColumnsType<PositionWithShare> = (t) => [
  {
    title: t("table.Position"),
    dataIndex: "name",
    render: (_, pos) => pos.instrument?.name,
    sorter: (a, b) => tablesSort(a.instrument?.name, b.instrument?.name),
  },
  {
    title: t("table.Quantity"),
    dataIndex: "quantity",
    align: "right",
    render: (_, pos) => Math.round(pos.quantity),
    sorter: (a, b) => tablesSort(a.quantity, b.quantity),
  },
  {
    title: t("table.Latest"),
    dataIndex: "lastPrice",
    render: (m) => currencyValue(m, { fractionDigits: 2 }),
    align: "right",
    sorter: (a, b) => tablesSort(a.lastPrice?.amt, b.lastPrice?.amt),
  },
  {
    title: t("table.Return %"),
    key: "pctReturn",
    render: (_, pos) => (
      <div style={{ color: getColorByValue(pos.pctReturn) }}>
        {percentValue(pos?.pctReturn)}
      </div>
    ),
    align: "right",
    sorter: (a, b) => tablesSort(a.pctReturn, b.pctReturn),
  },
  {
    title: t("table.Amount"),
    dataIndex: "marketValueAC",
    align: "right",
    render: (m) => <b>{currencyValue(m, { fractionDigits: 0 })}</b>,
    sorter: (a, b) => tablesSort(a.marketValueAC?.amt, b.marketValueAC?.amt),
  },
  {
    title: t("table.Share"),
    dataIndex: "share",
    render: (p) => percentValue(p),
    align: "right",
    sorter: (a, b) => tablesSort(a.share, b.share),
  },
];
