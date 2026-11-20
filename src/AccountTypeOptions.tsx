// The Business / User picker, shared by the sign-up screen and the one-time
// chooser so both describe the two account types the same way.
import { Building07, User01 } from "@untitledui/icons";
import type { AccountType } from "./account-type";

const options = [
  {
    value: "user",
    label: "User",
    detail: "Connect your agent to tools, and track its usage and credits.",
    Icon: User01,
  },
  {
    value: "business",
    label: "Business",
    detail: "List your tool and see how agents choose and use it.",
    Icon: Building07,
  },
] as const;

export function AccountTypeOptions({
  value,
  onChange,
  disabled = false,
  legend = "Account type",
}: {
  value: AccountType;
  onChange: (value: AccountType) => void;
  disabled?: boolean;
  legend?: string;
}) {
  return (
    <fieldset className="account-type-options" disabled={disabled}>
      <legend>{legend}</legend>
      {options.map(({ value: option, label, detail, Icon }) => (
        <label
          key={option}
          className="account-type-option"
          data-selected={value === option || undefined}
        >
          <input
            type="radio"
            name="account-type"
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
          />
          <Icon aria-hidden="true" />
          <span>
            <strong>{label}</strong>
            <small>{detail}</small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
