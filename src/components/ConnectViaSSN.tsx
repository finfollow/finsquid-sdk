import { Button, Image, Input, Typography } from "antd";
import {
  useConnectionSSN,
  useLoginIsSameDevice,
  useLoginProvider,
} from "../utils/state-utils";
import Personnummer from "personnummer";
import { useTranslation } from "react-i18next";
import CardContentWrapper from "./CardContentWrapper";
import CardTitle from "./CardTitle";
import { StepT, steps } from "../utils/constants";
import { Dispatch, SetStateAction } from "react";

type Props = {
  setNextStep: Dispatch<SetStateAction<StepT>>;
};

export default function ConnectViaSSN({ setNextStep }: Props) {
  const { t } = useTranslation();
  const [ssn, setSsn] = useConnectionSSN();
  const [provider] = useLoginProvider();
  const [isSameDevice] = useLoginIsSameDevice();

  //@TODO handle this case
  if (!provider) return null;

  const onSubmit = () => {
    if (isSameDevice) setNextStep(steps.openBankID);
    else setNextStep(steps.scanQRcode);
  };

  return (
    <CardContentWrapper>
      <CardTitle text="Connect Bank" />
      <div>
        <div style={{ width: 232, marginTop: 20 }}>
          <Typography.Text>
            {t("Type in your Social Security Number (Personnummer) below.")}
          </Typography.Text>
        </div>
        <div style={{ margin: "40px 0" }}>
          <Input
            value={ssn}
            onChange={({ target }: { target: HTMLInputElement }) =>
              setSsn(target.value)
            }
            placeholder={t("placeholder.SSN")}
            style={{ width: 232, height: 40 }}
            onPressEnter={onSubmit}
          />
        </div>
      </div>
      <Button
        type={"primary"}
        disabled={!Personnummer.valid(ssn)}
        block
        onClick={onSubmit}
      >
        {t("button.Connect Bank")}
        {isSameDevice && (
          <Image
            preview={false}
            style={{
              position: "absolute",
              objectFit: "cover",
              width: 30,
              height: 40,
              top: -25,
              left: 20,
            }}
            src="/bankID_logo_white.svg"
          />
        )}
      </Button>
    </CardContentWrapper>
  );
}
