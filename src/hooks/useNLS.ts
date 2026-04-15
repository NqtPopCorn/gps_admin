import { useState, useCallback } from "react";
import { nlsService } from "../services/nls.service";
import type { TranslateRequest, TranslateResponse, TTSRequest, TTSResponse } from "../types/api.types";
import type { ApiError } from "../lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// useTranslate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useTranslate
 *
 * Calls the admin translate endpoint and returns the translated text.
 *
 * @example
 * const { translate, result, isLoading } = useTranslate();
 * const res = await translate({ text: "Hello", target_language: "vi" });
 * console.log(res?.translated_text);
 */
export function useTranslate() {
  const [result, setResult] = useState<TranslateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const translate = useCallback(async (payload: TranslateRequest): Promise<TranslateResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await nlsService.translate(payload);
      setResult(response.data);
      return response.data;
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { translate, result, isLoading, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// useTTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useTTS
 *
 * Generates a TTS audio URL from text.
 * The returned `audioUrl` can be passed directly to an <audio> element.
 *
 * @example
 * const { generateAudio, audioUrl, isLoading } = useTTS();
 * await generateAudio({ text: "Bonjour!", lang_code: "fr" });
 * // <audio src={audioUrl} controls />
 */
export function useTTS() {
  const [result, setResult] = useState<TTSResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const generateAudio = useCallback(async (payload: TTSRequest): Promise<TTSResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await nlsService.tts(payload);
      setResult(res);
      return res;
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generateAudio,
    audioUrl: result?.url ?? null,
    result,
    isLoading,
    error,
  };
}
