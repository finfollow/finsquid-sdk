import { useState } from "react";
import PositionsTab from "./PositionsTab";
import TransactionsTab from "./TransactionsTab";
import { Button, Grid } from "antd";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function TabsContent() {
  const { sid, accountId } = useParams();
  if (!sid || !accountId) return null;
  const { t } = useTranslation();
  const { xs } = Grid.useBreakpoint();
  const [tab, setTab] = useState<"positions" | "transactions">("positions");
  return (
    <>
      <div
        style={{
          margin: xs ? "20px 0" : "30px 0",
          padding: xs ? "0 10px" : 0,
        }}
      >
        <div style={{ display: "flex", maxWidth: 450, margin: "auto" }}>
          <Button
            type={tab === "positions" ? "primary" : "default"}
            block
            style={{ height: 40, borderRadius: "20px 0 0 20px" }}
            onClick={() => setTab("positions")}
          >
            {t("tab.Positions")}
          </Button>
          <Button
            type={tab === "transactions" ? "primary" : "default"}
            block
            style={{ height: 40, borderRadius: " 0 20px 20px 0" }}
            onClick={() => setTab("transactions")}
          >
            {t("tab.Transactions")}
          </Button>
        </div>
      </div>
      {tab === "positions" && <PositionsTab sid={sid} accountId={accountId} />}
      {tab === "transactions" && (
        <TransactionsTab sid={sid} accountId={accountId} />
      )}
    </>
  );
}
