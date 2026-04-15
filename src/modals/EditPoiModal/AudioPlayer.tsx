import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useMap } from "react-leaflet";

// ─── MapUpdater ───────────────────────────────────────────────────────────────

export function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

// ─── AudioPlayerSkeleton ──────────────────────────────────────────────────────

export function AudioPlayerSkeleton() {
  return (
    <div className="mx-5 mb-5 bg-[#f0f4ff] rounded-xl px-4 py-3 flex items-center gap-4 animate-pulse">
      <div className="w-11 h-11 rounded-xl bg-[#c8d4f8] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <div className="h-3.5 w-24 bg-[#c8d4f8] rounded-full" />
          <div className="h-3 w-10 bg-[#c8d4f8] rounded-full" />
        </div>
        <div className="h-1.5 w-full bg-[#c8d4f8] rounded-full" />
      </div>
    </div>
  );
}

// ─── AudioPlayer ──────────────────────────────────────────────────────────────

interface AudioPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  onToggle: () => void;
  onEnded?: () => void;
}

export function AudioPlayer({ audioRef, isPlaying, onToggle, onEnded }: AudioPlayerProps) {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      onEnded?.();
      setProgress(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioRef.current]);

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * audio.duration;
    setProgress(pct * 100);
  };

  return (
    <div className="mx-5 mb-5 bg-[#f0f4ff] rounded-xl px-4 py-3 flex items-center gap-4">
      <button
        type="button"
        onClick={onToggle}
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#1a3bcc] hover:bg-[#1530b0] text-white transition-all shadow-sm active:scale-95"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-white stroke-none" />
        ) : (
          <Play className="w-4 h-4 fill-white stroke-none translate-x-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-[#1a3bcc] truncate">Preview Audio</p>
          <p className="text-xs font-mono text-on-surface-variant shrink-0 ml-2">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>
        <div
          className="h-1.5 w-full bg-[#c8d4f8] rounded-full overflow-hidden cursor-pointer group"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-[#1a3bcc] rounded-full transition-all duration-75 group-hover:bg-[#1530b0]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
