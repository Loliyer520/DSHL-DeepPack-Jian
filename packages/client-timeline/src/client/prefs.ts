// 视图偏好（按会话存浏览器本地；不改时间线）
const key = (scope: string | undefined, name: string) => 'djian.view.' + (scope ?? 'default') + '.' + name;
export function readPref<T>(scope: string | undefined, name: string, fallback: T, valid: (v: unknown) => boolean = () => true): T {
  try {
    const raw = localStorage.getItem(key(scope, name));
    if (raw === null) return fallback;
    const v: unknown = JSON.parse(raw);
    return valid(v) ? (v as T) : fallback;
  } catch { return fallback; }
}
export function writePref(scope: string | undefined, name: string, value: unknown) {
  try { localStorage.setItem(key(scope, name), JSON.stringify(value)); } catch { /* 隐私模式等不影响编辑 */ }
}
