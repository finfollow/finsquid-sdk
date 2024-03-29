import { useEffect, useState } from "react";
import { Button, Grid, Input, List, theme } from "antd";
import BankListItem from "./BankListItem";
import { SearchOutlined } from "@ant-design/icons";
import { useLoginProvider } from "../utils/state-utils";
import { useProviders } from "../gateway-api/gateway-service";
import { Provider } from "../gateway-api/types";
import { sendResultMessage, tablesSort } from "../utils/helpers";
import { useTranslation } from "react-i18next";
import CardTitle from "./CardTitle";

type Props = {
  onSubmit: () => void;
  radioBtns?: boolean;
};

export default function SelectProvider({ onSubmit, radioBtns }: Props) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { xs } = Grid.useBreakpoint();
  const { data, isFetching, error } = useProviders();
  const [banks, setBanks] = useState<Provider[]>([]);
  const [provider, setProvider] = useLoginProvider();

  useEffect(() => {
    setBanks(
      data?.sort((a, b) => tablesSort(a.displayName, b.displayName)) || []
    );
  }, [data]);

  const handleSearch = ({ target }: { target: HTMLInputElement }) =>
    setBanks(
      (data || []).filter((el) =>
        el.displayName?.toLowerCase().includes(target.value.toLowerCase())
      )
    );

  useEffect(() => {
    if (error)
      sendResultMessage({
        type: "error",
        error: { type: t("error.Providers fetch error"), message: error },
      });
  }, [error]);

  return (
    <>
      <CardTitle text="Connect Bank" />
      <Input
        onChange={handleSearch}
        style={{ borderRadius: 24, height: 48, width: 200, marginBottom: 40 }}
        prefix={<SearchOutlined style={{ fontSize: 22 }} />}
      />
      <div style={{ flex: "auto" }}>
        <List
          size={xs ? "small" : "default"}
          dataSource={banks}
          loading={isFetching}
          rowKey={"id"}
          renderItem={(item) => (
            <BankListItem
              item={item}
              onClick={() => {
                setProvider((prev) =>
                  radioBtns ? (item.name !== prev?.name ? item : null) : item
                );
                if (!radioBtns) onSubmit();
              }}
              selected={radioBtns ? item.name === provider?.name : undefined}
            />
          )}
          bordered
          style={{
            width: 280,
            background: token.colorBgLayout,
            border: "none",
          }}
        />
      </div>
      {radioBtns && (
        <Button
          type="primary"
          disabled={!provider}
          block
          style={{ marginTop: 30 }}
          onClick={onSubmit}
        >
          {t("button.Next")}
        </Button>
      )}
    </>
  );
}
