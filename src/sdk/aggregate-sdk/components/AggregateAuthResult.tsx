import { useEffect, useState } from "react";
import { useConnectedProviders } from "../../../utils/state-utils";
import { useTranslation } from "react-i18next";
import {
  errorNotifier,
  openAuthSdk,
  sendResultMessage,
} from "../../../utils/helpers";
import {
  CardContentWrapper,
  CardTitle,
  Loader,
  Wrapper,
} from "../../../components";
import { useAccounts } from "../../../gateway-api/gateway-service";
import { Button, Space, Typography, theme } from "antd";
import { useNavigate } from "react-router-dom";

export default function AggregateAuthResult() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [providers, setConnectedProviders] = useConnectedProviders();
  const params = new URLSearchParams(window.location.search);
  const [providerSid, setProviderSid] = useState("");
  const [authFailed, setAuthFailed] = useState(false);
  const { isFetching, data, error } = useAccounts(providerSid, true);
  const accountsNumber = data?.accounts.length || 0;
  const isPluralAccounts = accountsNumber > 1;

  useEffect(() => {
    const error = params.get("error");
    if (error) {
      setAuthFailed(true);
      const message = params.get("message");
      console.log("error message", message);
      errorNotifier({
        description: (
          <pre>
            {error}
            {"\n"}
            {JSON.stringify(message, null, 2)}
          </pre>
        ),
      });
    } else {
      const data = JSON.parse(
        decodeURIComponent(params.get("data") || "false")
      );
      console.log("data", JSON.stringify(data, null, 2));
      if (data) {
        sendResultMessage({
          type: "success",
          data: [...providers, data],
          error: null,
        });
        setConnectedProviders((prev) => [...prev, data]);
        setProviderSid(data?.sid);
      }
    }
  }, []);

  useEffect(() => {
    if (error)
      errorNotifier({
        description: (
          <pre>
            {t("error.Accounts fetch error")}
            {"\n"}
            {JSON.stringify(error, null, 2)}
          </pre>
        ),
      });
  }, [error]);

  const handleSubmit = () => {
    navigate(`/aggregate/${document.location.search}`);
  };

  if (isFetching)
    return (
      <Wrapper>
        <CardContentWrapper>
          <div
            style={{
              display: "flex",
              flexGrow: 1,
              flexDirection: "column",
            }}
          >
            <CardTitle text="Bank successfully connected!" />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexGrow: 1,
              }}
            >
              <Loader />
            </div>
          </div>
        </CardContentWrapper>
      </Wrapper>
    );

  if (authFailed)
    return (
      <Wrapper>
        <CardContentWrapper>
          <CardTitle text="Connect Bank" />
          <Space direction="vertical" style={{ marginTop: 50 }}>
            <Button
              block
              style={{ borderColor: token.colorPrimary }}
              onClick={openAuthSdk}
            >
              {t("button.Try again")}
            </Button>
          </Space>
        </CardContentWrapper>
      </Wrapper>
    );

  return (
    <Wrapper>
      <CardContentWrapper>
        <CardTitle text="Bank successfully connected!" />
        <Space direction="vertical" style={{ alignItems: "center", gap: 0 }}>
          <Typography.Text style={{ fontWeight: "bold" }}>
            {accountsNumber}{" "}
            {isPluralAccounts
              ? t("SuccessConnect.accounts")
              : t("SuccessConnect.account")}
          </Typography.Text>
          <Typography.Text>
            {isPluralAccounts
              ? t("SuccessConnect.were successfully connected")
              : t("SuccessConnect.was successfully connected")}
          </Typography.Text>
          <Typography.Text>
            {t("SuccessConnect.from your bank!")}
          </Typography.Text>
        </Space>
        <Space direction="vertical" style={{ marginTop: 50 }}>
          <Button
            block
            style={{ borderColor: token.colorPrimary }}
            onClick={openAuthSdk}
          >
            {t("button.Add Bank")}
          </Button>
          <Button type="primary" block onClick={handleSubmit}>
            {t("button.Done")}
          </Button>
        </Space>
      </CardContentWrapper>
    </Wrapper>
  );
}
