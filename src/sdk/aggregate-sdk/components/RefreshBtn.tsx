import { Button } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import {
  useAccount,
  useAccountTransactions,
  usePerformance,
} from "../../../gateway-api/gateway-service";

export default function RefreshBtn() {
  const { sid, accountId } = useParams();
  if (!sid || !accountId) return null;
  const account = useAccount(sid, accountId, true, {
    enabled: false,
  });
  const transactions = useAccountTransactions(sid, accountId, true, {
    enabled: false,
  });
  const performance = usePerformance(sid, accountId, true, {
    enabled: false,
  });

  return (
    <Button
      onClick={() => {
        account.refetch();
        performance.refetch();
        transactions.refetch();
      }}
    >
      <SyncOutlined
        spin={
          transactions.isFetching ||
          account.isFetching ||
          performance.isFetching
        }
      />
    </Button>
  );
}
