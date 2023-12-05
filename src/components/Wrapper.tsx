import { Grid, theme } from "antd";
import { ReactNode, useState } from "react";
import BackButton from "./BackButton";
import Stepper from "./Stepper";
import { useTranslation } from "react-i18next";

type Props = {
  children?: ReactNode;
  currentStep?: StepsEnum;
  onBack?: () => void | Promise<void> | null;
};

export enum StepsEnum {
  ConnectBank,
  SelectAccount,
  ConfirmTransfer,
}

const steps = ["Connect Bank", "Select Account", "Confirm Transfer"];

export default function Wrapper({ children, currentStep, onBack }: Props) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { xs } = Grid.useBreakpoint();
  const [isLoading, setIsLoading] = useState(false);

  const onBackHandle = async () => {
    try {
      setIsLoading(true);
      onBack && (await onBack());
    } catch (err) {
      console.log("onBack error: ", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: token.colorBgLayout,
          padding: xs ? "40px 0" : "50px",
        }}
      >
        {onBack && <BackButton onClick={onBackHandle} loading={isLoading} />}
        {currentStep !== undefined && (
          <Stepper
            current={currentStep}
            items={steps.map((step) => ({ title: t(`stepper.${step}`) }))}
            containerStyles={{ marginBottom: 24 }}
          />
        )}
        {children}
      </div>
    </div>
  );
}
