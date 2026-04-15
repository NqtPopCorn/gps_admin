import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { ChevronDown, LoaderCircle, MapPin, MapPinHouse, Plus, X, ToggleLeft, ToggleRight, Trash } from "lucide-react";

// ─── Utils ────────────────────────────────────────────────────────────────────
import { cn } from "@/lib/utils";

// ─── Hooks (adjust paths to your project) ────────────────────────────────────
import { useLocalizations, usePOIDetail, usePOIMutations } from "@/hooks";

// ─── Types ────────────────────────────────────────────────────────────────────
import type {
  CreatePOIRequest,
  LangCode,
  LocalizationResponse,
  UpdatePOIRequest,
  POIStatus,
  POIType,
  LocalizationWriteRequest,
} from "@/types/api.types";
import { LANGUAGES, LANG_FLAGS } from "./types";

// ─── Components ───────────────────────────────────────────────────────────────
import { MapPickerModal } from "@/components/MapPickerModal";
import ImageUpload from "@/components/ImageUpload";
import { AudioPlayer } from "./AudioPlayer";
import { SectionLabel } from "./helpers";
import LocalizationDialog, { LocFormData } from "./AddLocalizationModal";
import { toast } from "react-toastify";

// ─── Constants ────────────────────────────────────────────────────────────────

const POI_TYPES: POIType[] = ["food", "drink", "museum", "park", "historical", "other"];
const POI_TYPE_LABELS: Record<POIType, string> = {
  food: "🍜  Food",
  drink: "🧋  Drink",
  museum: "🏛️  Museum",
  park: "🌳  Park",
  historical: "🏰  Historical",
  shopping: "Shopping",
  other: "📍  Other",
};

// ─── Sub-component ────────────────────────────────────────────────────────────

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface POIModalProps {
  poiId?: string;
  onClose: () => void;
  onSaved?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function POIModal({ poiId, onClose, onSaved }: POIModalProps) {
  const isEditing = !!poiId;

  // ── Location ────────────────────────────────────────────────────────────────
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [locationCoords, setLocationCoords] = useState<[number, number]>([10.7769, 106.7009]);

  // ── Core POI fields ─────────────────────────────────────────────────────────
  const [image, setImage] = useState<File | undefined>(undefined);
  const [slug, setSlug] = useState("");
  const [radius, setRadius] = useState<number>(50);
  const [poiType, setPoiType] = useState<POIType>("historical");
  const [status, setStatus] = useState<POIStatus>("active");

  // ── Localizations ───────────────────────────────────────────────────────────
  const [defaultLanguage, setDefaultLanguage] = useState<LangCode>("vi");
  const [addedLangs, setAddedLangs] = useState<LangCode[]>(["vi"]);
  const [isLocDialogOpen, setIsLocDialogOpen] = useState(false);
  const [locDialogData, setLocDialogData] = useState<LocFormData | null>(null);

  // ── Audio ────────────────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClose = () => {
    audioRef.current?.pause();
    onClose();
  };

  // ── Hooks ───────────────────────────────────────────────────────────────────
  const { localizations, upsert, remove: removeLocalization } = useLocalizations(poiId ?? null);
  const { poi } = usePOIDetail(poiId ?? null);
  const {
    createPOI,
    updatePOI,
    isLoading: poiMutating,
  } = usePOIMutations({
    onSuccess: () => {
      onSaved?.();
      handleClose();
    },
  });

  // ── Derived ─────────────────────────────────────────────────────────────────
  const visibleLangs: LangCode[] = isEditing ? localizations.map((l) => l.lang_code as LangCode) : addedLangs;

  const availableLangs = (Object.keys(LANGUAGES) as LangCode[]).filter((k) => !visibleLangs.includes(k));

  const defaultLocalization = localizations.find((d) => d.lang_code === defaultLanguage);

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (poi) {
      setRadius(poi.radius ?? 50);
      setSlug(poi.slug ?? "");
      setPoiType((poi.type as POIType) ?? "historical");
      setStatus((poi.status as POIStatus) ?? "active");
      setDefaultLanguage(poi.default_lang);
      audioRef.current = new Audio(poi.audio);
      if (poi.latitude && poi.longitude) {
        setLocationCoords([poi.latitude, poi.longitude]);
      }
    }
  }, [poi]);

  useEffect(() => {
    if (!defaultLocalization) {
      return;
    }
    audioRef.current?.pause();
    audioRef.current = new Audio(defaultLocalization.audio || undefined);
    return () => {
      audioRef.current?.pause();
    };
  }, [defaultLanguage]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleLocationConfirm = (lat: number, lng: number) => {
    setLocationCoords([lat, lng]);
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

  const openLocalizationForm = (existing?: LocalizationResponse) => {
    if (!poi) return;
    if (!existing) {
      setLocDialogData({
        lang_code: undefined,
        name: poi.name,
        description: poi.description,
        audio: null,
      });
    } else {
      setLocDialogData(existing);
    }
    setIsLocDialogOpen(true);
  };

  const handleSave = async () => {
    if (isEditing) {
      const payload: UpdatePOIRequest = {
        default_lang: defaultLanguage,
        latitude: locationCoords[0],
        longitude: locationCoords[1],
        radius,
        image,
        type: poiType,
        slug,
        status,
      };
      await updatePOI(poiId!, payload);
    }
  };

  const handleUpsertLocalData = async (formData: LocalizationWriteRequest) => {
    const result = await upsert(formData);
    if (!result) throw new Error("Failed to save localization");
    if (result.data.lang_code === defaultLanguage) {
      // load audio moi
      audioRef.current.load();
    }
    return true;
  };

  const handleDeleteLocation = async (loc: LocalizationResponse) => {
    const langCode = loc.lang_code;
    try {
      await removeLocalization(langCode);
      toast.success("Delete localization " + loc.lang_code + " succesfully");
    } catch (e) {
      // toast.error("")
    }
  };

  const coordLabel = `${locationCoords[0].toFixed(5)}, ${locationCoords[1].toFixed(5)}`;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Backdrop + Dialog ───────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm" onClick={handleClose} />

        <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-7 py-5 flex items-start justify-between border-b border-outline-variant/15">
            <div>
              <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase rounded-md mb-2">
                {isEditing ? "Edit Mode" : "Create Mode"}
              </span>
              <h2 className="text-2xl font-display font-bold text-on-surface leading-tight">
                {isEditing ? "Edit Point of Interest" : "New Point of Interest"}
              </h2>
              {poi?.slug && <p className="text-xs text-on-surface-variant font-mono mt-0.5">/{poi.slug}</p>}
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors mt-0.5"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-7 overflow-y-auto flex-1 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-10">
              {/* ── Left Column ─────────────────────────────────────────────── */}
              <div className="space-y-7">
                {/* Image upload */}
                <section className="space-y-3">
                  <SectionLabel>Cover Image</SectionLabel>
                  <ImageUpload value={poi?.image ?? undefined} onChange={(file) => setImage(file)} />
                </section>

                {/* Geographic Location */}
                <section className="space-y-3">
                  <SectionLabel>Geographic Location</SectionLabel>
                  <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/20 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <MapPin className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                          Coordinates
                        </p>
                        <p className="text-sm font-mono text-on-surface">{coordLabel}</p>
                      </div>
                    </div>

                    <div className="w-full h-36 rounded-xl overflow-hidden border border-outline-variant/20">
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
                      onClick={() => setIsMapPickerOpen(true)}
                      className="w-full py-2.5 bg-surface-container-lowest border border-primary/25 text-primary rounded-xl text-sm font-semibold hover:bg-primary/5 active:scale-[0.99] transition-all"
                    >
                      Update Coordinates
                    </button>
                  </div>
                </section>

                {/* Metadata grid — Slug · Type · Radius · Status */}
                <section className="space-y-3">
                  <SectionLabel>Metadata</SectionLabel>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Slug */}
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Slug</label>
                      <input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        type="text"
                        placeholder="e.g. notre-dame-de-paris"
                        className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-outline/60"
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Type</label>
                      <div className="relative">
                        <select
                          value={poiType}
                          onChange={(e) => setPoiType(e.target.value as POIType)}
                          className="w-full appearance-none px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-8"
                        >
                          {POI_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {POI_TYPE_LABELS[t]}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                      </div>
                    </div>

                    {/* Radius */}
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Radius (m)</label>
                      <input
                        value={radius}
                        onChange={(e) => setRadius(e.target.value ? Number(e.target.value) : 10)}
                        type="number"
                        min={10}
                        max={500}
                        step={5}
                        placeholder="50"
                        className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-outline/60"
                      />
                    </div>

                    {/* Status toggle — full width */}
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Status</label>
                      <div className="flex items-center gap-3 p-1 bg-surface-container-low border border-outline-variant/30 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setStatus("active")}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all",
                            status === "active"
                              ? "bg-success/15 text-success shadow-sm"
                              : "text-on-surface-variant hover:text-on-surface",
                          )}
                        >
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              status === "active" ? "bg-success" : "bg-outline-variant",
                            )}
                          />
                          Active
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus("inactive")}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all",
                            status === "inactive"
                              ? "bg-error/10 text-error shadow-sm"
                              : "text-on-surface-variant hover:text-on-surface",
                          )}
                        >
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              status === "inactive" ? "bg-error" : "bg-outline-variant",
                            )}
                          />
                          Inactive
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* ── Right Column ─────────────────────────────────────────────── */}
              <div className="space-y-5">
                {/* Language header */}
                <div className="flex items-center justify-between">
                  <SectionLabel>Default Language & Content</SectionLabel>
                  {availableLangs.length > 0 && (
                    <button
                      className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                      onClick={() => openLocalizationForm()}
                    >
                      <Plus className="w-4 h-4" />
                      Add Language
                    </button>
                  )}
                </div>

                {/* Language tabs */}
                <div className="bg-surface-container-low p-1 rounded-xl flex items-center gap-0.5 overflow-x-auto">
                  {visibleLangs.map((lang) => {
                    const isDefault = defaultLanguage === lang;
                    return (
                      <button
                        key={lang}
                        onClick={() => setDefaultLanguage(lang)}
                        className={cn(
                          "relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                          isDefault
                            ? "bg-surface-container-lowest text-on-surface shadow-sm"
                            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50",
                        )}
                      >
                        <span>{LANG_FLAGS[lang]}</span>
                        <span>{LANGUAGES[lang]}</span>
                        {isDefault && <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Content card */}
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/15">
                    <div className="flex items-center gap-2 text-on-surface font-semibold text-sm">
                      <MapPinHouse className="w-4 h-4 text-primary" />
                      {LANG_FLAGS[defaultLanguage]} Content ({LANGUAGES[defaultLanguage]})
                    </div>
                    <button
                      className="text-xs font-semibold text-primary hover:underline"
                      onClick={() => openLocalizationForm(localizations.find((l) => l.lang_code === defaultLanguage))}
                    >
                      Edit
                    </button>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">POI Name</label>
                      <input
                        disabled
                        value={defaultLocalization?.name ?? ""}
                        type="text"
                        placeholder="No name yet — click Edit to add"
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm text-on-surface font-medium focus:outline-none placeholder:text-outline/60 disabled:opacity-70 cursor-default"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                        Narration Script
                      </label>
                      <textarea
                        disabled
                        value={defaultLocalization?.description ?? ""}
                        rows={6}
                        placeholder="No script yet — click Edit to add"
                        className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface leading-relaxed resize-none focus:outline-none border border-outline-variant/20 placeholder:text-outline/60 disabled:opacity-70 cursor-default"
                      />
                    </div>
                  </div>

                  {defaultLocalization?.audio ? (
                    <AudioPlayer audioRef={audioRef} isPlaying={isPlaying} onToggle={handleTogglePlay} />
                  ) : (
                    <div className="px-5 py-3.5 text-xs text-on-surface-variant italic border-t border-outline-variant/15">
                      No audio uploaded for this language yet.
                    </div>
                  )}
                </div>

                {/* All localizations quick-view */}
                {localizations.length > 1 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Other Localizations
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {localizations
                        .filter((l) => l.lang_code !== defaultLanguage)
                        .map((loc) => (
                          <div
                            key={loc.lang_code}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20 text-sm hover:border-primary/30 hover:bg-primary/5 transition-all group"
                          >
                            <span className="text-base">{LANG_FLAGS[loc.lang_code as LangCode]}</span>
                            <div className="text-left min-w-0">
                              <p className="text-xs font-semibold text-on-surface truncate">
                                {LANGUAGES[loc.lang_code as LangCode]}
                              </p>
                              <p className="text-[10px] text-on-surface-variant truncate">
                                {loc.audio ? "✓ Audio" : "No audio"}
                              </p>
                            </div>

                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity select-none flex items-center gap-4">
                              <span>
                                <Trash
                                  className="w-4 cursor-pointer hover:text-red-800"
                                  onClick={() => handleDeleteLocation(loc)}
                                />
                              </span>
                              <span
                                className="text-[10px] cursor-pointer font-semibold text-primary hover:text-yellow-600"
                                onClick={() => openLocalizationForm(loc)}
                              >
                                Edit
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 py-4 border-t border-outline-variant/20 bg-surface-container-lowest flex items-center justify-between">
            <p className="text-xs text-on-surface-variant italic hidden sm:flex items-center gap-1.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Changes are pushed to CDN globally upon saving.
            </p>

            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-all"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={poiMutating}
                className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold bg-[#0033cc] text-white hover:bg-[#002b99] transition-all shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {poiMutating && <LoaderCircle className="w-4 h-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Create POI"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Picker */}
      {isMapPickerOpen && (
        <MapPickerModal
          initialLocation={locationCoords}
          onClose={() => setIsMapPickerOpen(false)}
          onConfirm={handleLocationConfirm}
        />
      )}

      {/* Localization Dialog */}
      {locDialogData && (
        <LocalizationDialog
          open={isLocDialogOpen}
          onOpenChange={setIsLocDialogOpen}
          data={locDialogData}
          onUpsert={handleUpsertLocalData}
          availableLangs={availableLangs}
        />
      )}
    </>
  );
}
