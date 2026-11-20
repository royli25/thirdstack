import { useEffect, useState } from "react";
import type { OperatorAllowance } from "../server/account-allowance";
import { api } from "./api";
import { useAccount } from "./AccountGate";
import { startPolling } from "./polling";
import "./tool-access.css";
export function OperatorAllowanceNotice() {
  const account = useAccount(),
    [value, setValue] = useState<OperatorAllowance>(),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const refresh = () =>
      api<OperatorAllowance>("/account/operator-allowance")
        .then((result) => {
          if (active) {
            setValue(result);
            setError("");
          }
        })
        .catch((e) => {
          if (active) {
            setValue(undefined);
            setError(e.message);
          }
        });
    const stop = startPolling(refresh, 60000);
    return () => {
      active = false;
      stop();
    };
  }, [account.profile?.user.id]);
  if (error)
    return (
      <p className="tool-access-notice" role="status">
        Tool access could not be verified. Provider calls remain subject to
        server authorization.
      </p>
    );
  if (value?.state !== "paused" && value?.state !== "exhausted") return null;
  return (
    <p className="tool-access-notice" role="status">
      {value.state === "paused"
        ? "Tool access is paused for your account."
        : "Your account has reached its tool spending limit."}
    </p>
  );
}
