import { Grid, Table, TableProps, Typography, theme } from "antd";
import "./styles.css";
import { CustomSummary } from "..";
import { SummaryData } from "../CustomSummary";

type Props<T = object> = TableProps<T> & {
  tableTitle?: string;
  containerStyle?: React.CSSProperties;
  customSummary?: SummaryData;
};

export default function StyledTable<T = object>({
  columns,
  dataSource,
  tableTitle,
  pagination = false,
  containerStyle,
  customSummary,
  ...props
}: Props<T>) {
  const { token } = theme.useToken();
  const { xs } = Grid.useBreakpoint();
  return (
    <>
      {!!tableTitle && (
        <Typography.Title
          level={xs ? 5 : 4}
          style={{ marginBottom: 11, marginLeft: xs ? 10 : 0 }}
        >
          {tableTitle}
        </Typography.Title>
      )}
      <div
        style={{
          marginBottom: "2rem",
          // border: "1px solid #D9DBE2",
          borderRadius: 10,
          background: token.colorBgContainer,
          ...containerStyle,
        }}
      >
        {customSummary?.length && (
          <CustomSummary
            data={customSummary}
            isLoading={!!props.loading}
            containerStyle={{ borderRadius: xs ? 0 : "10px 10px 0 0" }}
          />
        )}
        <div
          style={{
            padding: "10px",
          }}
        >
          <Table
            // @ts-ignore
            columns={columns}
            // @ts-ignore
            dataSource={dataSource}
            size="small"
            pagination={pagination}
            {...props}
          />
        </div>
      </div>
    </>
  );
}
