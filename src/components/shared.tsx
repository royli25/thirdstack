import { providerEntry } from "../../server/provider-catalog";
import type React from "react";

export function Stat({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">
        {label}
        {icon}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
    </div>
  );
}

/** Provider logo from the catalog, or its initial when no logo file exists. */
export function ProviderLogo({
  provider,
  className,
  size,
}: {
  provider: string;
  className?: string;
  size?: number;
}) {
  const entry = providerEntry(provider);
  if (entry?.logo)
    return (
      <img
        className={className}
        src={entry.logo}
        alt=""
        width={size}
        height={size}
      />
    );
  return (
    <span
      className={`${className ?? ""} provider-logo-fallback`}
      aria-hidden="true"
      style={size ? { width: size, height: size } : undefined}
    >
      {entry?.initial ?? provider.charAt(0)}
    </span>
  );
}

export function ProviderMark({ provider }: { provider: string }) {
  return (
    <span className={`provider-mark ${provider}`}>
      {providerEntry(provider)?.initial ?? provider.charAt(0)}
    </span>
  );
}
