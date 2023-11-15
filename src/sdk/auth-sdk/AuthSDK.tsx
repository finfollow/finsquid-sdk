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

type Props = {
  radioBtns?: boolean;
};

export default function AuthSDK({ radioBtns }: Props) {
  const [step, setStep] = useState<StepT>(steps.selectProvider);

  const nextStep: Dispatch<SetStateAction<StepT>> = (_step) => {
    window.scrollTo(0, 0);
    setStep(_step);
  };

  return (
    <Wrapper
      onBack={
        step.prevStep
          ? () => step.prevStep && nextStep(steps[step.prevStep])
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
