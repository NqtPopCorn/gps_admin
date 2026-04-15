import React, { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Mic, RotateCcw, Sparkles, LoaderCircle, Upload, Languages, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslate, useTTS } from "@/hooks/useNLS";
import { LangCode, LocalizationWriteRequest } from "@/types/api.types";
import { AudioPlayer, AudioPlayerSkeleton } from "./AudioPlayer";
import { LANGUAGES, LANG_FLAGS } from "./types"; // Import mapping ngôn ngữ của bạn

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";

export type LocFormData = {
  lang_code?: LangCode;
  name: string;
  description: string | null;
  audio: string | null;
};

type LocalizationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: LocFormData;
  disable?: boolean;
  /** * Hàm upsert truyền từ component cha (nơi gọi useLocalizations).
   * Trả về Promise để Dialog biết khi nào hoàn thành (tắt loading, đóng dialog)
   */
  onUpsert: (formData: LocalizationWriteRequest) => Promise<boolean | void>;
  availableLangs: LangCode[];
};

const LocalizationDialog = ({
  open,
  onOpenChange,
  data,
  disable = false,
  onUpsert,
  availableLangs,
}: LocalizationDialogProps) => {
  const { generateAudio, isLoading: ttsLoading } = useTTS();
  const { translate, result, isLoading: translateLoading } = useTranslate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(data.audio || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Setup React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<LocalizationWriteRequest>({
    defaultValues: {
      lang_code: data.lang_code,
      name: data.name || "",
      description: data.description || "",
      audio: undefined,
    },
  });

  // Reset form khi Dialog mở lại hoặc data thay đổi
  useEffect(() => {
    if (open) {
      reset({
        lang_code: data.lang_code,
        name: data.name || "",
        description: data.description || "",
        audio: undefined,
      });
      setAudioPreviewUrl(data.audio || null);
      setIsPlaying(false);
    }
  }, [open, data, reset]);

  const descriptionValue = watch("description");
  const langCodeValue = watch("lang_code");

  // Handlers cho Audio (TTS & Upload)
  const handleGenerateTTS = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!descriptionValue || ttsLoading) return;
    if (!langCodeValue) {
      toast.error("Vui lòng chọn ngôn ngữ");
      return;
    }

    console.log({ text: descriptionValue, lang_code: langCodeValue });
    const res = await generateAudio({ text: descriptionValue, lang_code: langCodeValue });
    if (res) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      setAudioPreviewUrl(res.url);
      const newAudioFile = new File([res.blob], `tts-${data.lang_code}-${Date.now()}.mp3`, {
        type: res.blob.type,
      });
      setValue("audio", newAudioFile, { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleAutoTranslate = async () => {
    if (!descriptionValue || translateLoading) return;
    if (!langCodeValue) {
      toast.error("Vui lòng chọn ngôn ngữ");
      return;
    }
    if (!data.description) {
      toast.error("Ngôn ngữ mặc định chưa có mô tả");
      return;
    }
    console.log("translating");

    const res = await translate({
      name: data.name,
      description: data.description,
      target_language: langCodeValue,
    });

    if (res) {
      setValue("name", res.name);
      setValue("description", res.description);
    } else {
      toast.error("An error occurs when translating");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      setAudioPreviewUrl(URL.createObjectURL(file));
      setValue("audio", file, { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current.isConnected) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (audioPreviewUrl && audioPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  // Xử lý Submit Form gọi Upsert
  const onSubmit = async (formData: LocalizationWriteRequest) => {
    setIsSubmitting(true);
    try {
      await onUpsert(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to upsert localization", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-2 overflow-hidden bg-surface-container-lowest">
        {/* Form bọc toàn bộ nội dung Dialog */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col max-h-[85vh]">
          <DialogHeader className="px-6 py-5 border-b border-outline-variant/15">
            <DialogTitle className="flex items-center gap-2 text-xl font-display font-bold">
              <Languages className="w-5 h-5 text-primary" />
              {data.name ? "Edit Localization" : "Add Localization"}
              <span className="ml-1 px-2 py-0.5 bg-surface-container-low rounded-md text-sm font-medium border border-outline-variant/30">
                {LANG_FLAGS[langCodeValue]} {LANGUAGES[langCodeValue]}
              </span>
            </DialogTitle>
            <DialogDescription className="text-sm text-on-surface-variant hidden">
              Manage localized content for this Point of Interest.
            </DialogDescription>
          </DialogHeader>

          {/* Form Body - Scrollable */}
          {/* Form Body - Scrollable */}
          <div className="px-6 py-5 space-y-5 overflow-y-auto">
            {/* Language selector */}
            {!data.lang_code && availableLangs.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-on-surface-variant">
                  Choose a language to add localized content for this POI.
                </p>
                <div className="relative">
                  <select
                    {...register("lang_code")}
                    className="w-full appearance-none px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
                  >
                    <option>--Vui lòng chọn ngôn ngữ--</option>
                    {availableLangs.map((k) => (
                      <option key={k} value={k}>
                        {LANG_FLAGS[k]} {LANGUAGES[k]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                </div>
              </div>
            )}

            {/* Translated Content Card — Auto Translate fills both fields below */}
            <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-surface-container-low/60 border-b border-outline-variant/20">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Translated Content
                </span>
                <div className="flex items-center gap-2">
                  {/* <IconTextButton icon={RotateCcw} label="History" /> */}
                  <button
                    type="button"
                    onClick={() => handleAutoTranslate()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Auto Translate
                  </button>
                </div>
              </div>

              {!translateLoading ? (
                <div className="">
                  {/* Name */}
                  <div className="px-5 pt-4 pb-2">
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                      Name
                    </label>
                    <input
                      {...register("name", { required: "Name is required" })}
                      disabled={disable || isSubmitting}
                      type="text"
                      placeholder={`Enter POI name in ${LANGUAGES[langCodeValue]}…`}
                      className={cn(
                        "w-full px-4 py-3 bg-surface-container-low border rounded-xl text-base text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline",
                        errors.name
                          ? "border-red-500 focus:border-red-500"
                          : "border-outline-variant/30 focus:border-primary",
                      )}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  {/* Description */}
                  <div className="px-5 pt-3 pb-5">
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                      Narrative Script
                    </label>
                    <textarea
                      {...register("description")}
                      disabled={disable || isSubmitting}
                      rows={6}
                      placeholder="Write the narration script for this POI…"
                      className="w-full bg-surface-container-low/60 rounded-xl px-4 py-3 text-sm text-on-surface leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/20 placeholder:text-outline transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div className="">
                  {/* Name Skeleton */}
                  <div className="px-5 pt-4 pb-2">
                    <div className="h-3 w-16 bg-surface-container-highest rounded-md mb-3 animate-pulse" />
                    <div className="h-12 w-full bg-surface-container-low rounded-xl animate-pulse" />
                  </div>

                  {/* Description Skeleton */}
                  <div className="px-5 pt-3 pb-5">
                    <div className="h-3 w-28 bg-surface-container-highest rounded-md mb-3 animate-pulse" />
                    <div className="h-40 w-full bg-surface-container-low rounded-xl animate-pulse" />
                  </div>
                </div>
              )}
            </div>

            {/* TTS Card */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-outline-variant/15">
                <Mic className="w-4 h-4 text-primary" />
                <span className="text-on-surface font-semibold text-sm">Audio</span>
              </div>

              <div className="px-5 py-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerateTTS}
                  disabled={!descriptionValue || ttsLoading || disable || isSubmitting}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                    descriptionValue && !ttsLoading && !disable
                      ? "bg-primary text-on-primary hover:bg-primary/90 active:scale-[0.98] shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant cursor-not-allowed",
                  )}
                >
                  {ttsLoading ? (
                    <>
                      <LoaderCircle className="w-4 h-4 animate-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Generate Audio
                    </>
                  )}
                </button>

                <span className="text-xs text-on-surface-variant">or</span>

                <label
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface border border-outline-variant/40 transition-all",
                    disable || isSubmitting
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-surface-container-low cursor-pointer",
                  )}
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    disabled={disable || isSubmitting}
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {audioPreviewUrl && (
                <audio ref={audioRef} src={audioPreviewUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
              )}

              {ttsLoading ? (
                <AudioPlayerSkeleton />
              ) : audioPreviewUrl ? (
                <AudioPlayer audioRef={audioRef} isPlaying={isPlaying} onToggle={handleTogglePlay} />
              ) : (
                <div className="px-5 py-4 text-sm text-on-surface-variant italic border-t border-outline-variant/15">
                  Chưa có audio
                </div>
              )}
            </div>
          </div>

          {/* Form Footer */}
          <DialogFooter className="px-6 py-4 border-t border-outline-variant/15 bg-surface-container-low/30 sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disable || isSubmitting || (!isDirty && !data.name)} // Chỉ cho save nếu có thay đổi hoặc đang tạo mới
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <LoaderCircle className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Save Localization"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LocalizationDialog;
