export const PREFERENCES_STORAGE_KEY = "siges_preferences";

export const DEFAULT_PREFERENCES = {
  notifications: true,
  compactTables: false,
  theme: "light",
};

function getPreferencesKey(user) {
  const accountId = user?.id || user?.user_id || user?.email;
  return accountId ? `${PREFERENCES_STORAGE_KEY}:user:${String(accountId).toLowerCase()}` : null;
}

export function readPreferences(user) {
  const storageKey = getPreferencesKey(user);
  if (!storageKey) return DEFAULT_PREFERENCES;

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return { ...DEFAULT_PREFERENCES, ...saved };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

// IMPLEMENTACIÓN: una sola función aplica el tema a todo el documento.
export function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
}

export function savePreferences(user, preferences) {
  const storageKey = getPreferencesKey(user);
  if (!storageKey) return;

  // IMPLEMENTACIÓN: cada cuenta conserva sus preferencias en una clave
  // independiente; ningún tema se comparte con otros usuarios del equipo.
  localStorage.setItem(storageKey, JSON.stringify(preferences));
  applyTheme(preferences.theme);
}
