import { Dispatch, SetStateAction, useState } from "react";
import {
  ConnectViaSSN,
  FinalResult,
  LoginOptions,
  OpenBankID,
  ScanQrCode,
  SelectAccount,
  SelectPositions,
  SelectProvider,
  SelectReceivingAccount,
  SelectUserAccount,
  TransactionSummary,
  WaitingConnection,
  Wrapper,
} from "../../../components";
import { StepT, steps } from "../../../utils/constants";
import {
  useLoginProvider,
  useTransferingProvider,
} from "../../../utils/state-utils";
import { ProviderT } from "../../../gateway-api/types";

type Props = {
  radioBtns?: boolean;
};

export default function TransferComponent({ radioBtns }: Props) {
  const [step, setStep] = useState<StepT>(steps.selectProvider);
  const [provider] = useLoginProvider();
  const [_, setTransferingProvider] = useTransferingProvider();

  const nextStep: Dispatch<SetStateAction<StepT>> = (_step) => {
    window.scrollTo(0, 0);
    setStep(_step);
  };

  return (
    <Wrapper
      currentStep={step.wrapperStep}
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
        <SelectUserAccount
          onSuccess={() => {
            setTransferingProvider(provider as ProviderT);
            nextStep(steps.selectAccount);
          }}
        />
      )}
      {step.value === "selectAccount" && (
        <SelectAccount
          onSubmit={() => nextStep(steps.selectPositions)}
          radioBtns={radioBtns}
        />
      )}
      {step.value === "selectPositions" && (
        <SelectPositions
          onSubmit={() => nextStep(steps.selectReceivingAccount)}
        />
      )}
      {step.value === "selectReceivingAccount" && (
        <SelectReceivingAccount
          onSubmit={() => nextStep(steps.transactionSummary)}
        />
      )}
      {step.value === "transactionSummary" && (
        <TransactionSummary onSubmit={() => setStep(steps.finalResult)} />
      )}
      {step.value === "finalResult" && (
        <FinalResult onSubmit={() => setStep(steps.selectProvider)} />
      )}
    </Wrapper>
  );
}
