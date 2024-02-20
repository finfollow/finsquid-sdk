import {
  Button,
  Image,
  Input,
  QRCode,
  QRCodeProps,
  Typography,
  theme,
} from "antd";
import { CardContentWrapper, CardTitle } from ".";
import { useTranslation } from "react-i18next";
import { useConnectionSSN, useLoginProvider } from "../utils/state-utils";
import {
  bankIdInitCancel,
  bankInitLogin,
  pollBankIdStatus,
} from "../gateway-api/gateway-service";
import { sendResultMessage } from "../utils/helpers";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

export default function ConnectViaMitID({ onSuccess, onCancel }: Props) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [userId, setUserId] = useConnectionSSN();
  const [provider, setProvider] = useLoginProvider();
  const [qrCode, setQrCode] = useState("bankid");
  const [qrStatus, setQrStatus] = useState<QRCodeProps["status"]>("loading");
  const [sid, setSid] = useState<string | null>(null);
  const [isInitLoading, setIsInitLoading] = useState(false);
  const [isLoadingCancel, setIsLoadingCancel] = useState(false);
  const [isInited, setIsInited] = useState(false);

  //@TODO handle this case
  if (!provider) return null;

  const init = async () => {
    try {
      setIsInitLoading(true);
      const res = await bankInitLogin({
        providerId: provider.id,
        loginOption: {
          loginMethod: "mitid",
          userId,
          sameDevice: false,
        },
      });
      if (res?.status === "pending" && res?.imageChallengeData && res?.sid) {
        setProvider({ ...provider, sid: res.sid });
        setSid(res.sid);
        setQrCode(res.imageChallengeData);
        setQrStatus("active");
        setIsInited(true);
        if (mitIdStatusPulling.isFetchedAfterMount)
          mitIdStatusPulling.refetch();
      } else throw "There is no qr code data or session id";
    } catch (error) {
      console.error("bank init login error:", error);
      sendResultMessage({
        type: "error",
        error: { type: t("error.Bank init error"), message: error },
      });
    } finally {
      setIsInitLoading(false);
    }
  };

  const mitIdStatusPulling = useQuery({
    queryKey: ["mitIdStatus", sid],
    queryFn: () => pollBankIdStatus(sid as string, false, true),
    refetchInterval: (data) => {
      if (data?.imageChallengeData) setQrCode(data.imageChallengeData);
      if (data?.status === "complete") {
        setProvider({ ...provider, sid });
        onSuccess();
      }
      return data?.status == "pending" ? 1800 : false;
    },
    onError: (error) => {
      setQrStatus("expired");
      sendResultMessage({
        type: "error",
        error: {
          type: t("error.BankID status pulling error"),
          message: error,
        },
      });
    },
    enabled: !!sid,
  });

  useEffect(() => {
    // @TODO handle all status accordingly
    if (
      mitIdStatusPulling.isFetchedAfterMount &&
      mitIdStatusPulling.data?.status !== "pending" &&
      mitIdStatusPulling.data?.status !== "complete"
    )
      setQrStatus("expired");
  }, [mitIdStatusPulling.isFetchedAfterMount, mitIdStatusPulling.data?.status]);

  const onCancelHandler = async () => {
    try {
      setIsLoadingCancel(true);
      const res = await bankIdInitCancel(sid);
      console.log("bank init cancel response: ", res);
      /* if (res?.status === "complete") */ onCancel();
    } catch (err) {
      console.log("bank init cancel error: ", err);
    } finally {
      setIsLoadingCancel(false);
    }
  };

  if (isInitLoading)
    return (
      <CardContentWrapper>
        <CardTitle text="Connect Bank" />
        <div>
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <Typography.Text>{t("Open MitID app and approve")}</Typography.Text>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 40,
            }}
          >
            <Image
              src="/mitid_animation.gif"
              alt="Finsquid"
              preview={false}
              style={{
                width: 86,
                height: 150,
              }}
            />
          </div>
        </div>
      </CardContentWrapper>
    );

  if (isInited)
    return (
      <CardContentWrapper>
        <CardTitle text="Scan QR-code" />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <Typography.Text>{t("Scan QR code using MitID app")}</Typography.Text>
          <div
            style={{
              margin: 40,
              background: token.colorBgContainer,
              borderRadius: 8,
            }}
          >
            <QRCode
              value={qrCode}
              status={qrStatus}
              style={{ background: token.colorBgContainer }}
              onRefresh={() => {
                setIsInited(false);
                init();
              }}
            />
          </div>
        </div>
        <Button
          block
          style={{ borderColor: token.colorPrimary }}
          onClick={onCancelHandler}
          loading={isLoadingCancel}
        >
          {t("button.Cancel")}
        </Button>
      </CardContentWrapper>
    );

  return (
    <CardContentWrapper>
      <CardTitle text="Connect Bank" />
      <div>
        <div style={{ width: 232, marginTop: 20 }}>
          <Typography.Text>{t("Log on at MitID")}</Typography.Text>
        </div>
        <div style={{ marginTop: 25, marginBottom: 40 }}>
          <div>
            <Typography.Text>{t("User ID")}</Typography.Text>
          </div>
          <Input
            value={userId}
            onChange={({ target }: { target: HTMLInputElement }) =>
              setUserId(target.value)
            }
            style={{ width: 232, height: 40 }}
            onPressEnter={init}
          />
        </div>
      </div>
      <Button
        type={"primary"}
        disabled={userId.length < 3}
        block
        onClick={init}
      >
        {t("button.Continue")}
      </Button>
    </CardContentWrapper>
  );
}
