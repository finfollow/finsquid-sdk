import { Button } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import {
  useAccount,
  useAccountPositions,
  useAccountTransactions,
  usePerformance,
} from "../../../gateway-api/gateway-service";

export default function RefreshBtn() {
  const { sid, accountId } = useParams();
  if (!sid || !accountId) return null;
  const account = useAccount(sid, accountId);
  const positions = useAccountPositions(sid, accountId);
  const transactions = useAccountTransactions(sid, accountId);
  const performance = usePerformance(sid, accountId);

  return (
    <Button
      onClick={() => {
        account.refetch();
        performance.refetch();
        positions.refetch();
        transactions.refetch();
      }}
    >
      <SyncOutlined
        spin={
          positions.isFetching ||
          transactions.isFetching ||
          account.isFetching ||
          performance.isFetching
        }
      />
    </Button>
  );
}
