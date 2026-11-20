/** "business" = tool company / seller; "user" = someone whose agents use tools. */
export const accountTypes = ["business", "user"] as const;
export type AccountType = (typeof accountTypes)[number];
export interface AccountProfile {
  user: { id: string; email: string };
  /** Chosen once after the first sign-in, then locked in the database. Null until chosen. */
  accountType: AccountType | null;
  hasPersonalAccount: boolean;
  isAdmin: boolean;
  canPreview?: boolean;
  companyPreview?: import("./company-types.js").CompanyPreviewTarget;
  companies: import("./company-types.js").ToolCompany[];
}
export type AuthPublicConfig =
  | { enabled: false; oauth?: { resource: string } }
  | {
      enabled: true;
      url: string;
      publishableKey: string;
      oauth?: { resource: string };
    };
