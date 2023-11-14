import { Typography, theme } from "antd";
import { useTranslation } from "react-i18next";
import { PerfTimePeriod, periodToPctPerfMap } from "../../../utils/performance";
import { PercentagePerformance } from "../../../gateway-api/types";
import { percentValue } from "../../../utils/helpers";

type Props = {
  tabs: Array<keyof typeof PerfTimePeriod>;
  current: keyof typeof PerfTimePeriod;
  onChange: (tab: keyof typeof PerfTimePeriod) => void;
  isLoading?: boolean;
  pctPerformance?: PercentagePerformance | null;
};

export default function ChartPeriodTabs({
  tabs,
  current,
  onChange,
  isLoading,
  pctPerformance,
}: Props) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 20,
          border: "1px solid #d9d9d9",
          opacity: isLoading ? 0.3 : 1,
        }}
      >
        {tabs.map((tab, index) => {
          const isActive = current === tab;
          return (
            <div
              key={index}
              style={{ flex: 1, cursor: "pointer" }}
              onClick={() => !isLoading && onChange(tab)}
            >
              <div
                style={{
                  ...(isActive && {
                    backgroundColor: token.colorPrimary,
                    borderRadius: 20,
                    boxShadow: "0px 2px 2px 0px rgba(0, 0, 0, 0.23)",
                  }),
                  margin: 2,
                  padding: "0 2px",
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                <Typography.Text
                  style={{
                    textAlign: "center",
                    fontWeight: "600",
                    color: "gray",
                    lineHeight: "18px",
                    ...(isActive ? { color: token.colorWhite } : {}),
                  }}
                >
                  {t(`chart.intervals.${tab}`)}
                </Typography.Text>
                {pctPerformance && (
                  <Typography.Text
                    style={{
                      color: isActive
                        ? token.colorWhite
                        : (Number(pctPerformance[periodToPctPerfMap[tab]]) ||
                            0) < 0
                        ? token.red
                        : token.green,
                      fontSize: 9,
                      textAlign: "center",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    {percentValue(
                      Number(pctPerformance[periodToPctPerfMap[tab]]),
                      { fractionDigits: 1 }
                    )}
                  </Typography.Text>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
