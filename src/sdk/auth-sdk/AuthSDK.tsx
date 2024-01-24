import { Dispatch, SetStateAction, useState } from "react";
import {
  ConnectViaSSN,
  LoginOptions,
  OpenBankID,
  ScanQrCode,
  SelectProvider,
  SelectUserAccount,
  SuccessConnect,
  WaitingConnection,
  Wrapper,
} from "../../components";
import { StepT, steps } from "../../utils/constants";
import { useLoginProvider } from "../../utils/state-utils";
import { bankIdInitCancel } from "../../gateway-api/gateway-service";
import { ProviderConnectT } from "../../gateway-api/types";
import "./styles.css";
import ConnectViaUsername from "../../components/ConnectViaUsername";
import ConnectViaMitID from "../../components/ConnectViaMitID";

type Props = {
  radioBtns?: boolean;
};

export default function AuthSDK({ radioBtns }: Props) {
  const [step, setStep] = useState<StepT>(steps.selectProvider);
  const [provider, setProvider] = useLoginProvider();

  const nextStep: Dispatch<SetStateAction<StepT>> = (_step) => {
    window.scrollTo(0, 0);
    setStep(_step);
  };

  return (
    <Wrapper
      onBack={
        step.prevStep
          ? (step.value === "scanQRcode" ||
              step.value === "openBankID" ||
              step.value === "waitingConnection") &&
            provider?.sid
            ? () =>
                bankIdInitCancel(provider.sid).then((res) => {
                  if (res?.status === "complete") {
                    step.prevStep && nextStep(steps[step.prevStep]);
                    setProvider((prev) => ({
                      ...(prev as ProviderConnectT),
                      sid: null,
                    }));
                  }
                })
            : () => step.prevStep && nextStep(steps[step.prevStep])
          : undefined
      }
    >
      {step.value === "selectProvider" && (
        <SelectProvider
          onSubmit={() => nextStep(steps.loginOptions)}
          radioBtns={radioBtns}
        />
      )}
      {step.value === "loginOptions" && (
        <LoginOptions setNextStep={(step) => nextStep(step)} />
      )}
      {step.value === "username" && (
        <ConnectViaUsername
          onSuccess={() => nextStep(steps.selectUserAccount)}
        />
      )}
      {step.value === "mitid" && (
        <ConnectViaMitID
          onSuccess={() => nextStep(steps.selectAccount)}
          onCancel={() => step.prevStep && nextStep(steps[step.prevStep])}
        />
      )}
      {step.value === "provideSSN" && <ConnectViaSSN setNextStep={nextStep} />}
      {step.value === "openBankID" && (
        <OpenBankID onSuccess={() => nextStep(steps.waitingConnection)} />
      )}
      {step.value === "waitingConnection" && (
        <WaitingConnection
          onSuccess={() => nextStep(steps.selectUserAccount)}
          onRetry={() => nextStep(steps.openBankID)}
          onCancel={() => step.prevStep && nextStep(steps[step.prevStep])}
        />
      )}
      {step.value === "scanQRcode" && (
        <ScanQrCode
          setNextStep={nextStep}
          onSuccess={() => nextStep(steps.selectUserAccount)}
          onCancel={() => step.prevStep && nextStep(steps[step.prevStep])}
        />
      )}
      {step.value === "selectUserAccount" && (
        <SelectUserAccount onSuccess={() => nextStep(steps.successConnect)} />
      )}
      {step.value === "successConnect" && (
        <SuccessConnect
          onBack={() => step.prevStep && nextStep(steps[step.prevStep])}
        />
      )}
    </Wrapper>
  );
}
