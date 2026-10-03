// View preferences are session scoped and never change the saved timeline.
const preferenceKey = (sessionId: string | undefined, name: string) => `djian.view.${sessionId ?? 'default'}.${name}`;

export function readViewPreference<T>(sessionId: string | undefined, name: string, fallback: T, valid: (value: unknown) => boolean): T {
  try {
    const raw = localStorage.getItem(preferenceKey(sessionId, name));
    if (raw === null) return fallback;
    const value: unknown = JSON.parse(raw);
    return valid(value) ? value as T : fallback;
  } catch { return fallback; }
}

export function saveViewPreference(sessionId: string | undefined, name: string, value: unknown) {
  try { localStorage.setItem(preferenceKey(sessionId, name), JSON.stringify(value)); }
  catch { /* Private browsing and storage limits must not prevent editing. */ }
}
