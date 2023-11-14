import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthSDK } from "./sdk/auth-sdk";
import { TransferSDK } from "./sdk/transfer-sdk";
import { AggregateSDK } from "./sdk/aggregate-sdk";
import "./translations/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, theme } from "antd";
import { useEffect } from "react";
import { httpClient } from "./gateway-api/gateway-service";
import { useTranslation } from "react-i18next";
import svSE from "antd/locale/sv_SE";
import enUS from "antd/locale/en_US";
import BankAccountDetails from "./sdk/aggregate-sdk/components/BankAccountDetails";
import InvestmentAccountDetails from "./sdk/aggregate-sdk/components/InvestmentAccountDetails";

const queryClient = new QueryClient();

function App() {
  const { i18n } = useTranslation();
  const searchParams = new URLSearchParams(document.location.search);
  const themeParams = searchParams.get("theme");
  const clientTheme =
    themeParams && JSON.parse(decodeURIComponent(themeParams));
  const radioBtns = searchParams.get("radio-buttons");
  const lang = searchParams.get("lang");

  httpClient.defaults.headers.common = {
    Authorization: `Bearer ${searchParams.get("api_key")}`,
  };

  useEffect(() => {
    lang && i18n.changeLanguage(lang);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorBgContainer: "#FFFFFF",
            colorBgLayout: "#F5F7FE",
            ...clientTheme,
          },
          components: {
            Button: {
              ...clientTheme,
            },
          },
        }}
        locale={lang === "en" ? enUS : svSE}
      >
        <BrowserRouter>
          <Routes>
            <Route
              path="auth"
              element={<AuthSDK radioBtns={radioBtns === "true"} />}
            />
            <Route
              path="transfer"
              element={<TransferSDK radioBtns={radioBtns === "true"} />}
            />
            <Route path="aggregate">
              <Route index element={<AggregateSDK />} />
              <Route
                path="account/:sid/:accountId"
                element={<BankAccountDetails />}
              />
              <Route
                path="investmentAccount/:sid/:accountId"
                element={<InvestmentAccountDetails />}
              />
              <Route
                path="auth"
                element={<AuthSDK radioBtns={radioBtns === "true"} />}
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
