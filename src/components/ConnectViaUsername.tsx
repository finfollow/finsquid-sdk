import { Button, Form, Input } from "antd";
import { useLoginProvider } from "../utils/state-utils";
import { useTranslation } from "react-i18next";
import CardContentWrapper from "./CardContentWrapper";
import CardTitle from "./CardTitle";
import { useState } from "react";
import { bankInitLogin } from "../gateway-api/gateway-service";
import { ProviderConnectT } from "../gateway-api/types";

type Props = {
  onSuccess: () => void;
};

type UsernameFormT = {
  username: string;
  password: string;
};

export default function ConnectViaUsername({ onSuccess }: Props) {
  const { t } = useTranslation();
  const [provider, setProvider] = useLoginProvider();
  const [isLoading, setisLoading] = useState(false);

  const [usernameForm] = Form.useForm<UsernameFormT>();

  //@TODO handle this case
  if (!provider) return null;

  const handleBankLogin = async (values: UsernameFormT) => {
    try {
      setisLoading(true);
      const res = await bankInitLogin({
        providerId: provider.id,
        loginOption: { loginMethod: "usernamePassword", ...values },
      });
      console.log("bankLogin res: ", res);
      if (res?.status === "complete" && res?.sid) {
        setProvider((prev) => ({
          ...(prev as ProviderConnectT),
          sid: res.sid,
        }));
        onSuccess();
      }
    } catch (err) {
      console.log("bankLogin error: ", err);
    } finally {
      setisLoading(false);
    }
  };

  return (
    <CardContentWrapper>
      <CardTitle text="Connect Bank" />
      <div>
        <div style={{ margin: "40px 0" }}>
          <Form<UsernameFormT>
            layout="vertical"
            form={usernameForm}
            onFinish={(values: UsernameFormT) => handleBankLogin(values)}
            requiredMark={false}
          >
            <Form.Item
              label={t("Username")}
              name="username"
              rules={[{ required: true }]}
              style={{ marginBottom: 12 }}
            >
              <Input type="username" placeholder={t("Username")} size="large" />
            </Form.Item>
            <Form.Item
              label={t("Password")}
              name="password"
              rules={[{ required: true }]}
              style={{ marginBottom: 40 }}
            >
              <Input type="password" placeholder="●●●●●●●●" size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={isLoading}>
              {t("button.Connect Bank")}
            </Button>
          </Form>
        </div>
      </div>
    </CardContentWrapper>
  );
}
