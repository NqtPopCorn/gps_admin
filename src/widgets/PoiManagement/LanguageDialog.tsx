import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Languages,
  Volume2,
  Sparkles,
  Loader2,
  Play,
  Pause,
  Trash2,
} from "lucide-react";
import { LocalizedData } from "../../types";
import { GoogleGenAI, Modality } from "@google/genai";

const SUPPORTED_LANGUAGES = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
  { code: "ko", label: "Korean" },
  { code: "ja", label: "Japanese" },
  { code: "fr", label: "French" },
];

export function LanguageDialog({
  isOpen,
  onClose,
  initialData,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData: LocalizedData;
  onSave: (data: LocalizedData) => void;
}) {
  const [data, setData] = useState<LocalizedData>(
    initialData || { vi: { name: "", description: { text: "" } } },
  );
  const [baseLang, setBaseLang] = useState("vi");
  const [isTranslating, setIsTranslating] = useState<string | null>(null);
  const [isTTSing, setIsTTSing] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleTranslate = async (targetLang: string) => {
    const baseData = data[baseLang];
    if (!baseData?.name && !baseData?.description?.text) {
      alert("Vui lòng nhập nội dung ngôn ngữ gốc trước khi dịch!");
      return;
    }

    setIsTranslating(targetLang);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Translate the following POI information from language code '${baseLang}' to language code '${targetLang}'.
Return ONLY a JSON object with 'name' and 'description' keys.
Name: ${baseData.name || ""}
Description: ${baseData.description?.text || ""}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const result = JSON.parse(response.text || "{}");

      setData((prev) => ({
        ...prev,
        [targetLang]: {
          ...prev[targetLang],
          name: result.name || "",
          description: {
            ...prev[targetLang]?.description,
            text: result.description || "",
          },
        },
      }));
    } catch (error) {
      console.error("Translation error:", error);
      alert("Lỗi khi dịch: " + error);
    } finally {
      setIsTranslating(null);
    }
  };

  const handleTTS = async (lang: string) => {
    const textToSpeak = data[lang]?.description?.text;
    if (!textToSpeak) {
      alert("Không có nội dung mô tả để tạo giọng nói!");
      return;
    }

    setIsTTSing(lang);
    try {
      // Gọi API fake của BE để lấy URL audio
      // Thay vì dùng trực tiếp GoogleGenAI, ta gọi endpoint của BE

      /* 
      const response = await fetch('https://your-backend-api.com/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, language: lang })
      });
      const result = await response.json();
      const audioUrl = result.audioUrl;
      */

      // Giả lập API response (Fake API)
      const audioUrl = await new Promise<string>((resolve) => {
        setTimeout(() => {
          resolve("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
        }, 1500);
      });

      setData((prev) => ({
        ...prev,
        [lang]: {
          ...prev[lang],
          description: {
            ...prev[lang]?.description,
            audio: audioUrl,
          },
        },
      }));
    } catch (error) {
      console.error("TTS error:", error);
      alert("Lỗi khi tạo giọng nói: " + error);
    } finally {
      setIsTTSing(null);
    }
  };

  const toggleLanguage = (lang: string) => {
    if (lang === baseLang) return;
    if (data[lang]) {
      const newData = { ...data };
      delete newData[lang];
      setData(newData);
    } else {
      setData({
        ...data,
        [lang]: { name: "", description: { text: "" } },
      });
    }
  };

  const updateField = (
    lang: string,
    field: "name" | "description",
    value: string,
  ) => {
    setData((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        ...(field === "name"
          ? { name: value }
          : { description: { ...prev[lang]?.description, text: value } }),
      },
    }));
  };

  const playAudio = (lang: string, audioUrl: string) => {
    if (playingAudio === lang) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlayingAudio(null);
      audio.play();
      audioRef.current = audio;
      setPlayingAudio(lang);
    }
  };

  const removeAudio = (lang: string) => {
    setData((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        description: {
          ...prev[lang]?.description,
          audio: undefined,
        },
      },
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Quản lý Đa ngôn ngữ & Thuyết minh
              </h2>
              <p className="text-sm text-slate-500">
                Dịch tự động và tạo giọng nói AI cho POI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex gap-6">
          {/* Left Sidebar - Language Selection */}
          <div className="w-64 shrink-0 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Ngôn ngữ gốc (Base)
              </label>
              <select
                value={baseLang}
                onChange={(e) => {
                  const newBase = e.target.value;
                  setBaseLang(newBase);
                  if (!data[newBase]) {
                    setData({
                      ...data,
                      [newBase]: { name: "", description: { text: "" } },
                    });
                  }
                }}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Ngôn ngữ hỗ trợ
              </label>
              <div className="space-y-2">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <label
                    key={lang.code}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${data[lang.code] ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <input
                      type="checkbox"
                      checked={!!data[lang.code]}
                      onChange={() => toggleLanguage(lang.code)}
                      disabled={lang.code === baseLang}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {lang.label}
                    </span>
                    {lang.code === baseLang && (
                      <span className="ml-auto text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase">
                        Base
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Area - Editors */}
          <div className="flex-1 space-y-6">
            {SUPPORTED_LANGUAGES.filter((lang) => data[lang.code]).map(
              (lang) => {
                const langData = data[lang.code];
                const isBase = lang.code === baseLang;

                return (
                  <div
                    key={lang.code}
                    className={`border rounded-2xl overflow-hidden ${isBase ? "border-emerald-200 shadow-sm" : "border-slate-200"}`}
                  >
                    <div
                      className={`px-4 py-3 border-b flex items-center justify-between ${isBase ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}
                    >
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        {lang.label}
                        {isBase && (
                          <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded uppercase">
                            Ngôn ngữ gốc
                          </span>
                        )}
                      </div>
                      {!isBase && (
                        <button
                          onClick={() => handleTranslate(lang.code)}
                          disabled={isTranslating === lang.code}
                          className="flex items-center gap-1.5 text-xs font-medium bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                          {isTranslating === lang.code ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          AI Translate
                        </button>
                      )}
                    </div>

                    <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Tên điểm
                        </label>
                        <input
                          type="text"
                          value={langData.name}
                          onChange={(e) =>
                            updateField(lang.code, "name", e.target.value)
                          }
                          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder={`Tên điểm (${lang.label})...`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Mô tả
                        </label>
                        <textarea
                          value={langData.description.text}
                          onChange={(e) =>
                            updateField(
                              lang.code,
                              "description",
                              e.target.value,
                            )
                          }
                          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                          rows={3}
                          placeholder={`Mô tả chi tiết (${lang.label})...`}
                        />
                      </div>

                      {/* Audio Section */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-slate-600">
                            Audio Thuyết minh
                          </label>
                          <button
                            onClick={() => handleTTS(lang.code)}
                            disabled={
                              isTTSing === lang.code ||
                              !langData.description.text
                            }
                            className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          >
                            {isTTSing === lang.code ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                            Tạo Audio (AI TTS)
                          </button>
                        </div>

                        {langData.description.audio ? (
                          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <button
                              onClick={() =>
                                playAudio(
                                  lang.code,
                                  langData.description.audio!,
                                )
                              }
                              className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors"
                            >
                              {playingAudio === lang.code ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4 ml-0.5" />
                              )}
                            </button>
                            <div className="flex-1 text-xs text-slate-500 font-medium">
                              Audio đã được tạo thành công
                            </div>
                            <button
                              onClick={() => removeAudio(lang.code)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">
                            Chưa có audio thuyết minh. Bấm "Tạo Audio" để AI tự
                            động đọc mô tả.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => {
              onSave(data);
              onClose();
            }}
            className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
