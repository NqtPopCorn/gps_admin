import { post } from "../lib/api";
import type { TranslateRequest, TranslateResponse, TTSRequest, TTSResponse, ApiResponse } from "../types/api.types";

// ─── NLS Service (Natural Language Services) ──────────────────────────────────

export const nlsService = {
  /**
   * Translate text using Google Gen AI (admin only).
   */
  translate(payload: TranslateRequest): Promise<ApiResponse<TranslateResponse>> {
    return post<ApiResponse<TranslateResponse>>("/api/admin/nls/translate", payload);
  },

  /**
   * Generate text-to-speech audio using Edge TTS (admin only).
   * Returns a URL to the generated audio file.
   */
  async tts(payload: TTSRequest): Promise<TTSResponse> {
    const blob = await post<Blob>("/api/admin/nls/tts", payload, { responseType: "blob" });
    const url = URL.createObjectURL(blob);
    return { url, blob };
  },
};
