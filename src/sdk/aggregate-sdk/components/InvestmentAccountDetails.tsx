import { Grid, Space, Typography, theme } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { LoadingOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { PerfTimePeriod, getFullPerformance } from "../../../utils/performance";
import { useConnectedProviders } from "../../../utils/state-utils";
import {
  useAccount,
  usePerformance,
} from "../../../gateway-api/gateway-service";
import {
  currencyValue,
  errorNotifier,
  percentValue,
} from "../../../utils/helpers";
import { BankLogo, CustomSummary, Layout } from "../../../components";
import { Line } from "@ant-design/plots";
import ChartPeriodTabs from "./ChartPeriodTabs";
import TabsContent from "./TabsContent";
import RefreshBtn from "./RefreshBtn";

const chartPeriods: Array<keyof typeof PerfTimePeriod> = [
  "TODAY",
  "WEEK",
  "MONTH",
  "MONTH_3",
  "YTD",
  "YEAR",
  "ALL",
];

export default function InvestmentAccountDetails() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { sid, accountId } = useParams();
  if (!sid || !accountId) return null;
  const { xs } = Grid.useBreakpoint();
  const [chartPeriod, setChartPeriod] =
    useState<keyof typeof PerfTimePeriod>("ALL");
  const [providers] = useConnectedProviders();
  const account = useAccount(sid, accountId);
  // @TODO refactor refresh button, transactions fetch twice here and after user comes to transaction tab because of this hook here
  const performance = usePerformance(sid, accountId);
  const performanceData = useMemo(
    () =>
      getFullPerformance({
        data: performance.data,
        period: chartPeriod,
        type: "PERCENTAGE",
      }),
    [performance.data, chartPeriod]
  );

  useEffect(() => {
    if (account.error)
      errorNotifier({
        description: (
          <pre>
            {t("error.Account fetch error")}
            {"\n"}
            {JSON.stringify(account.error, null, 2)}
          </pre>
        ),
      });
  }, [account.error]);

  useEffect(() => {
    if (performance.error)
      errorNotifier({
        description: (
          <pre>
            {t("error.Performance fetch error")}
            {"\n"}
            {JSON.stringify(performance.error, null, 2)}
          </pre>
        ),
      });
  }, [performance.error]);

  const logoSrc = providers.find(
    (el) => el.name === account.data?.account.provider
  )?.iconUrl;

  return (
    <Layout title={t("Account Details")}>
      <div
        style={{
          // height: "2.5rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {account.isLoading ? (
          <LoadingOutlined style={{ marginLeft: xs ? 10 : 0 }} />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: xs ? "0 10px" : 0,
            }}
          >
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
            {account.data?.account.providerAccountNumber ===
            account.data?.account.name ? (
              <Typography.Title level={xs ? 5 : 4} style={{ margin: 0 }}>
                {account.data?.account.name}
              </Typography.Title>
            ) : (
              <Space>
                {account.data?.account.name && (
                  <Typography.Title level={xs ? 5 : 4} style={{ margin: 0 }}>
                    {account.data?.account.name}
                  </Typography.Title>
                )}
                {account.data?.account.providerAccountNumber && (
                  <Typography.Title level={xs ? 5 : 4} style={{ margin: 0 }}>
                    {account.data?.account.providerAccountNumber}
                  </Typography.Title>
                )}
              </Space>
            )}
          </div>
        )}
        <div style={{ marginRight: xs ? 10 : 0 }}>
          <RefreshBtn />
        </div>
      </div>
      <div
        style={{
          marginTop: 15,
          background: token.colorBgContainer,
          borderRadius: xs ? 0 : 10,
        }}
      >
        <CustomSummary
          data={[
            {
              title: t("summary.Cash"),
              value: currencyValue(account.data?.account.balance, {
                fractionDigits: 0,
              }),
            },
            {
              title: t("summary.Invested"),
              value: currencyValue(
                {
                  amt:
                    account.data?.account.totalValue?.amt &&
                    account.data?.account.totalValue?.amt -
                      (account.data?.account.balance?.amt || 0),
                  cy: account.data?.account.totalValue?.cy,
                },
                { fractionDigits: 0 }
              ),
            },
            {
              title: t("summary.Total"),
              value: currencyValue(account.data?.account.totalValue, {
                fractionDigits: 0,
              }),
            },
          ]}
          containerStyle={{ borderRadius: xs ? 0 : "10px 10px 0 0" }}
        />
        <div style={{ padding: xs ? "0 10px 10px 10px" : "0 40px 30px 40px" }}>
          <div style={{ margin: xs ? "10px 0" : "30px 0" }}>
            <Typography.Text>
              {t("chart.Performance")}{" "}
              {percentValue(
                (performanceData[performanceData.length - 1]?.value || 0) / 100
              )}
            </Typography.Text>
          </div>
          <div style={{ position: "relative" }}>
            <Line
              data={performanceData}
              height={280}
              padding={"auto"}
              xField="date"
              yField="value"
              lineStyle={{ stroke: token.colorPrimary }}
              yAxis={{
                position: "right",
                label: {
                  formatter: (t) => t + "%",
                  offsetX: xs ? 0 : 10,
                },
              }}
              xAxis={{ label: { offsetY: 10, offsetX: 30 } }}
              tooltip={{
                formatter: (dot) => {
                  return { name: dot.date, value: dot.value + "%" };
                },
                showTitle: false,
                domStyles: {
                  "g2-tooltip-value": { marginLeft: "10px", fontWeight: 600 },
                  "g2-tooltip-marker": { background: token.colorPrimary },
                },
              }}
              loading={performance.isFetching}
            />
          </div>
          <div style={{ marginTop: 30 }}>
            <ChartPeriodTabs
              tabs={chartPeriods}
              isLoading={performance.isFetching}
              current={chartPeriod}
              onChange={(period) => setChartPeriod(period)}
              pctPerformance={account.data?.pctPerformance}
            />
          </div>
        </div>
      </div>
      <TabsContent />
    </Layout>
  );
}
