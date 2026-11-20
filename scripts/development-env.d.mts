export const productionProjectRefs: Set<string>;
export const developmentEnvFile: string;
export function developmentEnvironment(
  root: string,
  inherited?: NodeJS.ProcessEnv,
  mode?: "postgres" | "sqlite",
): Promise<NodeJS.ProcessEnv>;
