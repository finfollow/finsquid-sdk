import { Grid, Typography, theme } from "antd";
import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BackButton from "./BackButton";

type Props = {
  children?: ReactNode;
  title?: string;
  hideBack?: boolean;
};

const { useBreakpoint } = Grid;

export default function Layout({ title, hideBack, children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const { xs } = useBreakpoint();

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          background: token.colorBgLayout,
          padding: xs ? "30px 0" : "50px 50px 20px 50px",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          minHeight: "100vh",
        }}
      >
        {!hideBack && location.key !== "default" && (
          <BackButton onClick={() => navigate(-1)} />
        )}
        <Typography.Title
          level={xs ? 3 : 1}
          style={{
            textAlign: "center",
            marginBottom: xs ? 20 : 50,
            padding: "0 35px",
          }}
        >
          {title}
        </Typography.Title>
        {children}
      </div>
    </div>
  );
}
