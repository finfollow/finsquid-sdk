import { LoadingOutlined } from "@ant-design/icons";
import { Grid, Typography, theme } from "antd";

type Props = {
  data: SummaryData;
  isLoading?: boolean;
  containerStyle?: React.CSSProperties;
};
export type SummaryData = Array<{ title?: string; value?: string }>;

export default function CustomSummary({
  data,
  isLoading,
  containerStyle,
}: Props) {
  const { token } = theme.useToken();
  const { xs } = Grid.useBreakpoint();

  return (
    <div
      style={{
        height: 54,
        background: token.colorPrimary,
        display: "flex",
        justifyContent: "space-between",
        padding: xs ? "0 10px" : "0 40px",
        marginBottom: 10,
        ...containerStyle,
      }}
    >
      {data.map((el, index) => (
        <div
          key={"summary" + index}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            minWidth: 80,
          }}
        >
          {isLoading && el.value && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                textAlign: "center",
              }}
            >
              <LoadingOutlined style={{ fontSize: 20, color: "#fff" }} />
            </div>
          )}
          <div
            style={{
              opacity: isLoading ? 0.4 : 1,
            }}
          >
            <div>
              <Typography.Text style={{ color: "#fff", opacity: 0.7 }}>
                {el.title}
              </Typography.Text>
            </div>
            <div>
              <Typography.Text
                style={{ fontSize: xs ? 14 : 18, color: "#fff" }}
              >
                <b>{el.value}</b>
              </Typography.Text>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
