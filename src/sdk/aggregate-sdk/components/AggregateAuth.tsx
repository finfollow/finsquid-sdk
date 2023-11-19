import { useEffect, useState } from "react";
import { useConnectedProviders } from "../../../utils/state-utils";
import { useTranslation } from "react-i18next";
import {
  PostMessageData,
  errorNotifier,
  sendPostMessage,
} from "../../../utils/helpers";
import { ProviderT } from "../../../gateway-api/types";
import { Loader } from "../../../components";

export default function AggregateAuth({
  apiToken,
  apiUrl,
  theme,
}: {
  apiUrl: string | null;
  apiToken: string | null;
  theme: any;
}) {
  const { i18n } = useTranslation();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [_p, setConnectedProviders] = useConnectedProviders();
  const { protocol, host } = window.location;
  const baseUrl = `${protocol}//${host}`;
  const parentRedirectUrl = new URLSearchParams(document.location.search).get(
    "redirect"
  );
  const redirectBackToAggregate = `${baseUrl}/aggregate/?api_key=${apiToken}&theme=${theme}&lang=${i18n.resolvedLanguage}&api_url=${apiUrl}&redirect=${parentRedirectUrl}`;
  const authSdkLink = `${baseUrl}/auth/?api_key=${apiToken}&theme=${theme}&lang=${
    i18n.resolvedLanguage
  }&api_url=${apiUrl}&redirect=${encodeURIComponent(redirectBackToAggregate)}`;

  useEffect(() => {
    const handlePostMessage = (event: any) => {
      if (!baseUrl || event.origin !== new URL(baseUrl).origin) return;
      const { type, data, error }: PostMessageData = event.data;

      if (type === "success") {
        setConnectedProviders((prev) => {
          const connectedProviders = [...prev, data as ProviderT];
          sendPostMessage({
            type: "providers",
            data: connectedProviders,
            error: null,
          });
          return connectedProviders;
        });
      } else if (type === "error") {
        errorNotifier({
          description: (
            <pre>
              {error?.type + "\n"}
              {error?.message}
            </pre>
          ),
        });
      }
    };
    window.addEventListener("message", handlePostMessage);
    return () => {
      window.removeEventListener("message", handlePostMessage);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {!iframeLoaded && (
        <div style={{ position: "absolute" }}>
          <Loader background="#fff" />
        </div>
      )}
      <iframe
        style={{
          width: 642,
          height: "100vh",
          border: "none",
        }}
        src={authSdkLink}
        onLoad={() => setIframeLoaded(true)}
      />
    </div>
  );
}
