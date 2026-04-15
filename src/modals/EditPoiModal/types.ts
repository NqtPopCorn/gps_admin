import type { LangCode } from "@/types";

// ─── Language metadata ────────────────────────────────────────────────────────

export const LANGUAGES: Record<LangCode, string> = {
  vi: "Tiếng Việt",
  en: "English",
  fr: "Français",
  zh: "中文",
  ja: "日本語",
};

export const LANG_FLAGS: Record<LangCode, string> = {
  vi: "🇻🇳",
  en: "🇺🇸",
  fr: "🇫🇷",
  zh: "🇨🇳",
  ja: "🇯🇵",
};

// ─── Pending action ───────────────────────────────────────────────────────────

/** Describes what the user tried to do when a dirty-guard was triggered. */
export type PendingAction =
  | { type: "tab"; targetLang: LangCode }
  | { type: "save" };
