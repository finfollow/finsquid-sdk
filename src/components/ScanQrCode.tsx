import { Button, Image, QRCode, QRCodeProps, Typography, theme } from "antd";
import { useEffect, useState } from "react";
import {
  bankIdInitCancel,
  bankInitLogin,
  pollBankIdStatus,
} from "../gateway-api/gateway-service";
import { useQuery } from "@tanstack/react-query";
import {
  useConnectionSSN,
  useIsLoginWithSSN,
  useLoginIsSameDevice,
  useLoginProvider,
} from "../utils/state-utils";
import { sendResultMessage } from "../utils/helpers";
import { useTranslation } from "react-i18next";
import CardTitle from "./CardTitle";
import CardContentWrapper from "./CardContentWrapper";
import { StepT, steps } from "../utils/constants";

type Props = {
  setNextStep: (step: StepT) => void;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function ScanQrCode({
  setNextStep,
  onSuccess,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [ssn] = useConnectionSSN();
  const [qrCodeUrl, setQrCodeUrl] = useState("bankid");
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [qrStatus, setQrStatus] = useState<QRCodeProps["status"]>("loading");
  const [sid, setSid] = useState<string | null>(null);
  const [provider, setProvider] = useLoginProvider();
  const [isWithSNNConnection] = useIsLoginWithSSN();
  const [isSameDevice] = useLoginIsSameDevice();
  const [isLoadingCancel, setIsLoadingCancel] = useState(false);

  //@TODO handle this case
  if (!provider) return null;

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    if (!provider.name) return;
    setQrStatus("loading");
    try {
      const res = await bankInitLogin({
        providerId: provider.id,
        loginOption: isWithSNNConnection
          ? {
              loginMethod: "bankidSSN",
              userId: ssn,
              sameDevice: isSameDevice,
            }
          : { loginMethod: "bankid", sameDevice: isSameDevice },
      });

      if (
        res?.status === "pending" &&
        (res?.imageChallengeData || res?.qrCodeImage) &&
        res?.sid
      ) {
        setProvider({ ...provider, sid: res.sid });
        setSid(res.sid);
        res.imageChallengeData && setQrCodeUrl(res.imageChallengeData);
        res.qrCodeImage && setQrCodeImage(res.qrCodeImage);
        setQrStatus("active");
        if (bankIdStatusPulling.isFetchedAfterMount)
          bankIdStatusPulling.refetch();
      } else if (
        !res?.qrCodeImage &&
        !res?.imageChallengeData &&
        res?.sid &&
        isWithSNNConnection
      ) {
        setProvider({ ...provider, sid: res.sid });
        setNextStep(steps.waitingConnection);
      } else throw "There is no qr code data or session id";
    } catch (error) {
      console.error("bank init login error:", error);
      sendResultMessage({
        type: "error",
        error: { type: t("error.Bank init error"), message: error },
      });
      setQrStatus("expired");
    }
  };

  const bankIdStatusPulling = useQuery({
    queryKey: ["bankIdStatus", sid],
    queryFn: () => pollBankIdStatus(sid as string, false, true),
    refetchInterval: (data) => {
      if (data?.qrCodeImage) setQrCodeImage(data.qrCodeImage);
      if (data?.imageChallengeData) setQrCodeUrl(data.imageChallengeData);
      if (data?.status === "complete") {
        setProvider({ ...provider, sid });
        onSuccess();
      }
      return data?.status == "pending" ? 1000 : false;
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
      bankIdStatusPulling.isFetchedAfterMount &&
      bankIdStatusPulling.data?.status !== "pending" &&
      bankIdStatusPulling.data?.status !== "complete"
    )
      setQrStatus("expired");
  }, [
    bankIdStatusPulling.isFetchedAfterMount,
    bankIdStatusPulling.data?.status,
  ]);

  const onCancelHandler = async () => {
    try {
      setIsLoadingCancel(true);
      const res = await bankIdInitCancel(sid);
      if (res?.status === "complete") onCancel();
    } catch (err) {
      console.log("bank init cancel error: ", err);
    } finally {
      setIsLoadingCancel(false);
    }
  };

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
        <Typography.Text>
          {t("1. Open the BankID app in your mobile.")}
        </Typography.Text>
        <Typography.Text>
          {t("2. Click at the QR-code button.")}
        </Typography.Text>
        <Typography.Text>{t("3. Scan the QR-code below.")}</Typography.Text>
        <div
          style={{
            margin: 40,
            background: token.colorBgContainer,
            borderRadius: 8,
          }}
        >
          {!qrCodeImage && (
            <QRCode
              value={qrCodeUrl}
              status={qrStatus}
              style={{ background: token.colorBgContainer }}
              onRefresh={init}
            />
          )}
          {qrCodeImage && (
            <Image width={160} height={160} src={qrCodeImage} preview={false} />
          )}
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
}
