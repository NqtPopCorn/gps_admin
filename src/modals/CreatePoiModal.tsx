import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { toast } from "react-toastify";
import { ChevronDown, LoaderCircle, MapPin, Mic, RotateCcw, Sparkles, Upload, X } from "lucide-react";

// ─── Utils & Hooks ────────────────────────────────────────────────────────────
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePOIMutations } from "@/hooks/usePOIs";
import { useTTS } from "@/hooks/useNLS";

// ─── Types & Constants ────────────────────────────────────────────────────────
import type { LangCode, POIType } from "@/types/api.types";
import { LANGUAGES, LANG_FLAGS } from "./EditPoiModal/types";

// ─── Components ───────────────────────────────────────────────────────────────
import { MapPickerModal } from "@/components/MapPickerModal";
import ImageUpload from "@/components/ImageUpload";
import { AudioPlayer, AudioPlayerSkeleton } from "./EditPoiModal/AudioPlayer";
import { SectionLabel, IconTextButton } from "./EditPoiModal/helpers";

// ─── Zod Schema (Zod v4 compatible) ──────────────────────────────────────────

const POI_TYPES: [POIType, ...POIType[]] = ["food", "drink", "museum", "park", "historical", "other"];
const LANG_CODES: [LangCode, ...LangCode[]] = ["vi", "en", "fr", "zh", "ja"];

const createPOISchema = z.object({
  default_name: z.string().min(1, "Name is required"),
  latitude: z.number({ error: "Latitude is required" }),
  longitude: z.number({ error: "Longitude is required" }),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  type: z.enum(POI_TYPES, { error: "Please select a POI type" }),
  default_lang: z.enum(LANG_CODES, { error: "Please select a language" }),
  default_description: z.string().min(1, "Description is required"),
  default_audio: z
    .instanceof(File, { message: "Audio file is required" })
    .refine((f) => f.size > 0, "Audio file is required"),
  radius: z.number({ error: "Radius is required" }).min(1, "Radius must be at least 1 metre"),
  image: z.instanceof(File, { message: "Image is required" }).refine((f) => f.size > 0, "Image is required"),
});

type CreatePOIFormValues = z.infer<typeof createPOISchema>;

// ─── Sub-components ───────────────────────────────────────────────────────────

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

const POI_TYPE_LABELS: Record<POIType, string> = {
  food: "🍜 Food",
  drink: "🍵 Drink",
  museum: "🏛️ Museum",
  park: "🌳 Park",
  shopping: "Shopping",
  historical: "🏰 Historical",
  other: "📍 Other",
};

export interface POIModalProps {
  onClose: () => void;
  onSaved?: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AddPOIModal({ onClose, onSaved }: POIModalProps) {
  // ── State: Location ─────────────────────────────────────────────────────────
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [locationCoords, setLocationCoords] = useState<[number, number]>([10.7769, 106.7009]);

  // ── State: Audio ─────────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const { user, refreshUserProfile } = useAuth();

  // ── Hooks ───────────────────────────────────────────────────────────────────
  const { generateAudio, isLoading: ttsLoading } = useTTS();

  const { createPOI, isLoading: poiMutating } = usePOIMutations({
    onSuccess: () => {
      if (user && user.role === "partner") {
        refreshUserProfile();
      }
      toast.success("POI created successfully! 🎉");
      onSaved?.();
      onClose();
    },
    onError: (err) => {
      toast.error("Failed to create POI.  Check you POI credits and try again.");
    },
  });

  // ── React Hook Form ─────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreatePOIFormValues>({
    resolver: zodResolver(createPOISchema),
    defaultValues: {
      default_lang: "vi",
      latitude: locationCoords[0],
      longitude: locationCoords[1],
      type: "other",
    },
  });

  const defaultLang = watch("default_lang");
  const descriptionValue = watch("default_description");

  // ── Cleanup: Blob URLs & Audio ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (audioPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleLocationConfirm = (lat: number, lng: number) => {
    setLocationCoords([lat, lng]);
    setValue("latitude", lat, { shouldValidate: true });
    setValue("longitude", lng, { shouldValidate: true });
    setIsMapPickerOpen(false);
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleGenerateTTS = async (e: React.MouseEvent) => {
    e.preventDefault();
    const description = getValues("default_description");
    const lang = getValues("default_lang");
    if (!description || ttsLoading) return;

    const res = await generateAudio({ text: description, lang_code: lang });
    if (res) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      if (audioPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(res.url);
      const audioFile = new File([res.blob], `tts-${lang}-${Date.now()}.mp3`, {
        type: res.blob.type,
      });
      setValue("default_audio", audioFile, { shouldValidate: true, shouldDirty: true });
      toast.info("Audio generated from description.");
    } else {
      toast.error("Failed to generate audio. Please try again.");
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if (audioPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(audioPreviewUrl);
    const url = URL.createObjectURL(file);
    setAudioPreviewUrl(url);
    setValue("default_audio", file, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (data: CreatePOIFormValues) => {
    try {
      await createPOI(data);
    } catch {
      toast.error("Failed to create POI. Please check all fields and try again.");
    }
  };

  const onInvalid = () => {
    toast.error("Please fix the validation errors before saving.");
  };

  const coordLabel = `${locationCoords[0].toFixed(4)}, ${locationCoords[1].toFixed(4)}`;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm" onClick={onClose} />

        {/* Modal Content */}
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          className="relative bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="p-6 pb-4 flex items-start justify-between border-b border-outline-variant/15">
            <div>
              <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase rounded-md mb-2">
                New POI
              </span>
              <h2 className="text-2xl font-display font-bold text-on-surface">Add Point of Interest</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 overflow-y-auto flex-1 pb-6 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-10">
              {/* ── Left Column ──────────────────────────────────────────── */}
              <div className="space-y-8">
                {/* Image Upload */}
                <section className="space-y-4">
                  <SectionLabel>Core Identity</SectionLabel>
                  <Controller
                    control={control}
                    name="image"
                    render={({ field }) => (
                      <div>
                        <ImageUpload value={field.value} onChange={(file) => field.onChange(file)} />
                        {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image.message}</p>}
                      </div>
                    )}
                  />
                </section>

                {/* Geographic Location */}
                <section className="space-y-4">
                  <SectionLabel>Geographic Location</SectionLabel>
                  <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                          Coordinates
                        </p>
                        <p className="text-sm font-mono text-on-surface mt-0.5">{coordLabel}</p>
                      </div>
                    </div>
                    {(errors.latitude || errors.longitude) && (
                      <p className="text-red-500 text-xs mb-2">
                        {errors.latitude?.message ?? errors.longitude?.message}
                      </p>
                    )}

                    <div className="w-full h-36 rounded-xl overflow-hidden border border-outline-variant/20 mb-4 z-0">
                      <MapContainer
                        center={locationCoords}
                        zoom={15}
                        style={{ height: "100%", width: "100%" }}
                        zoomControl={false}
                        dragging={false}
                        scrollWheelZoom={false}
                        doubleClickZoom={false}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={locationCoords} />
                        <MapUpdater center={locationCoords} />
                      </MapContainer>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsMapPickerOpen(true)}
                      className="w-full py-2.5 bg-surface-container-lowest border border-primary/25 text-primary rounded-xl text-sm font-semibold hover:bg-primary/5 active:scale-[0.99] transition-all"
                    >
                      Pick on Map
                    </button>
                  </div>
                </section>

                {/* POI Type */}
                <section className="space-y-2">
                  <label className="block text-sm font-semibold text-primary">POI Type</label>
                  <div className="relative">
                    <select
                      {...register("type")}
                      className={cn(
                        "w-full appearance-none px-4 py-3 bg-surface-container-low border rounded-xl text-base text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pr-10",
                        errors.type
                          ? "border-red-500 focus:border-red-500"
                          : "border-outline-variant/30 focus:border-primary",
                      )}
                    >
                      {POI_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {POI_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                  </div>
                  {errors.type && <p className="text-red-500 text-xs">{errors.type.message}</p>}
                </section>

                {/* POI Slug */}
                <section className="space-y-2">
                  <label className="block text-sm font-semibold text-primary">POI Slug</label>
                  <input
                    {...register("slug")}
                    type="text"
                    placeholder="e.g. ben-thanh-market"
                    className={cn(
                      "w-full px-4 py-3 bg-surface-container-low border rounded-xl text-base text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline",
                      errors.slug
                        ? "border-red-500 focus:border-red-500"
                        : "border-outline-variant/30 focus:border-primary",
                    )}
                  />
                  {errors.slug && <p className="text-red-500 text-xs">{errors.slug.message}</p>}
                </section>

                {/* POI Radius */}
                <section className="space-y-2">
                  <label className="block text-sm font-semibold text-primary">Radius (metres)</label>
                  <input
                    {...register("radius", { valueAsNumber: true })}
                    type="number"
                    step={1}
                    min={1}
                    placeholder="e.g. 50"
                    className={cn(
                      "w-full px-4 py-3 bg-surface-container-low border rounded-xl text-base text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline",
                      errors.radius
                        ? "border-red-500 focus:border-red-500"
                        : "border-outline-variant/30 focus:border-primary",
                    )}
                  />
                  {errors.radius && <p className="text-red-500 text-xs">{errors.radius.message}</p>}
                </section>
              </div>

              {/* ── Right Column ─────────────────────────────────────────── */}
              <div className="space-y-5">
                {/* Default Language Tabs */}
                <div className="flex items-center justify-between">
                  <SectionLabel>Default Language</SectionLabel>
                </div>

                <Controller
                  control={control}
                  name="default_lang"
                  render={({ field }) => (
                    <div className="bg-surface-container-low p-1 rounded-xl flex items-center gap-0.5 overflow-x-auto">
                      {(Object.keys(LANGUAGES) as LangCode[]).map((lang) => {
                        const isActive = field.value === lang;
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => field.onChange(lang)}
                            className={cn(
                              "relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                              isActive
                                ? "bg-surface-container-lowest text-on-surface shadow-sm"
                                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50",
                            )}
                          >
                            <span>{LANG_FLAGS[lang]}</span>
                            <span>{LANGUAGES[lang]}</span>
                            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
                {errors.default_lang && <p className="text-red-500 text-xs">{errors.default_lang.message}</p>}

                {/* Default Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-primary">
                    POI Name{" "}
                    <span className="font-normal text-on-surface-variant">
                      ({LANG_FLAGS[defaultLang]} {LANGUAGES[defaultLang]})
                    </span>
                  </label>
                  <input
                    {...register("default_name")}
                    type="text"
                    placeholder={`Enter POI name in ${LANGUAGES[defaultLang]}…`}
                    className={cn(
                      "w-full px-4 py-3 bg-surface-container-low border rounded-xl text-base text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline",
                      errors.default_name
                        ? "border-red-500 focus:border-red-500"
                        : "border-outline-variant/30 focus:border-primary",
                    )}
                  />
                  {errors.default_name && <p className="text-red-500 text-xs">{errors.default_name.message}</p>}
                </div>

                {/* Narrative Script + Audio */}
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/15">
                    <div className="flex items-center gap-2 text-on-surface font-semibold text-sm">
                      <Mic className="w-4 h-4 text-primary" />
                      Narrative Script
                    </div>
                    {/* <div className="flex items-center gap-3">
                      <IconTextButton icon={RotateCcw} label="History" />
                      <IconTextButton icon={Sparkles} label="Auto translate" />
                    </div> */}
                  </div>

                  <div className="px-5 pt-4 pb-3">
                    <textarea
                      {...register("default_description")}
                      rows={6}
                      placeholder="Write the narration script for this POI…"
                      className={cn(
                        "w-full bg-surface-container-low/60 rounded-xl px-4 py-3 text-sm text-on-surface leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 border placeholder:text-outline transition-all",
                        errors.default_description ? "border-red-500" : "border-outline-variant/20",
                      )}
                    />
                    {errors.default_description && (
                      <p className="text-red-500 text-xs mt-1">{errors.default_description.message}</p>
                    )}
                  </div>

                  {/* Audio action buttons */}
                  <div className="px-5 pb-4 flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={handleGenerateTTS}
                      disabled={!descriptionValue || ttsLoading || poiMutating}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                        descriptionValue && !ttsLoading
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
                        poiMutating ? "cursor-not-allowed opacity-50" : "hover:bg-surface-container-low cursor-pointer",
                      )}
                    >
                      <Upload className="w-4 h-4" />
                      Upload Audio
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        disabled={poiMutating}
                        onChange={handleAudioFileUpload}
                      />
                    </label>

                    {errors.default_audio && (
                      <p className="text-red-500 text-xs w-full">{errors.default_audio.message}</p>
                    )}
                  </div>

                  {/* Hidden audio element */}
                  {audioPreviewUrl && (
                    <audio
                      ref={audioRef}
                      src={audioPreviewUrl}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                  )}

                  {/* Audio Player */}
                  {ttsLoading ? (
                    <AudioPlayerSkeleton />
                  ) : audioPreviewUrl ? (
                    <AudioPlayer audioRef={audioRef} isPlaying={isPlaying} onToggle={handleTogglePlay} />
                  ) : (
                    <div className="px-5 py-4 text-sm text-on-surface-variant italic border-t border-outline-variant/15">
                      No audio yet — generate via TTS or upload a file.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-lowest flex items-center justify-between">
            <p className="text-xs text-on-surface-variant italic hidden sm:flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              Changes are pushed to CDN globally upon saving.
            </p>
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-all"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={poiMutating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#0033cc] text-white hover:bg-[#002b99] transition-all shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {poiMutating && <LoaderCircle className="w-4 h-4 animate-spin" />}
                Create POI
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Map Picker Modal */}
      {isMapPickerOpen && (
        <MapPickerModal
          initialLocation={locationCoords}
          onClose={() => setIsMapPickerOpen(false)}
          onConfirm={handleLocationConfirm}
        />
      )}
    </>
  );
}
