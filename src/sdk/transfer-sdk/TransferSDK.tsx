/* eslint-disable react-hooks/exhaustive-deps */
import TransferComponent from "./components/TransferComponent";
import "antd/dist/reset.css";
import "./styles.css";

function TransferSDK({ radioBtns }: { radioBtns: boolean }) {
  return <TransferComponent radioBtns={radioBtns} />;
}

export default TransferSDK;
