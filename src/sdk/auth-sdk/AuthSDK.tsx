/* eslint-disable react-hooks/exhaustive-deps */
import AuthComponent from "./components/AuthComponent";
import "antd/dist/reset.css";
import "./styles.css";

function AuthSDK({ radioBtns }: { radioBtns: boolean }) {
  return <AuthComponent radioBtns={radioBtns} />;
}

export default AuthSDK;
