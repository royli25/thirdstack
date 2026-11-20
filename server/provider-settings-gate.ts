/** One runtime owns the database. Keep settings revisions outside admitted provider work. */
let active = 0;
let updating = false;
let synchronized = true;
export function settingsSynchronized(value: boolean) {
  synchronized = value;
}
export class SettingsBusyError extends Error {
  readonly status = 409;
  constructor() {
    super(
      "Provider work is active or settings are being saved. Wait for current calls to finish, then retry.",
    );
  }
}
export function providerLease() {
  if (updating || !synchronized) throw new SettingsBusyError();
  active++;
  let released = false;
  return () => {
    if (!released) {
      released = true;
      active--;
    }
  };
}
export async function providerWork<T>(fn: () => Promise<T>): Promise<T> {
  const release = providerLease();
  try {
    return await fn();
  } finally {
    release();
  }
}
export async function settingsWrite<T>(fn: () => Promise<T>): Promise<T> {
  if (updating || active) throw new SettingsBusyError();
  updating = true;
  try {
    return await fn();
  } finally {
    updating = false;
  }
}
