import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
// @ts-ignore
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Search, X, MapPin } from "lucide-react";

// Fix Leaflet default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom() < 15 ? 15 : map.getZoom());
  }, [center, map]);
  return null;
}

function MapEvents({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapPickerModalProps {
  initialLocation?: [number, number];
  onClose: () => void;
  onConfirm: (lat: number, lng: number) => void;
}

export function MapPickerModal({ initialLocation = [40.7812, -73.9665], onClose, onConfirm }: MapPickerModalProps) {
  const [position, setPosition] = useState<[number, number]>(initialLocation);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`,
      );
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setPosition([lat, lon]);
    setResults([]);
    setSearchQuery(result.display_name);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-surface-container-lowest rounded-3xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-on-surface">Select Location</h2>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-outline-variant/20 relative z-[70]">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a place (e.g. Central Park, New York)..."
              className="w-full pl-10 pr-24 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </form>

          {results.length > 0 && (
            <div className="absolute top-[calc(100%+8px)] left-4 right-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg max-h-60 overflow-y-auto z-[80]">
              {results.map((result, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-4 py-3 hover:bg-surface-container-low border-b border-outline-variant/10 last:border-0 text-sm flex items-start gap-3"
                >
                  <MapPin className="w-4 h-4 text-outline mt-0.5 shrink-0" />
                  <span className="text-on-surface">{result.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 relative z-10 bg-surface-container-low">
          <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} />
            <MapUpdater center={position} />
            <MapEvents onSelect={(lat, lng) => setPosition([lat, lng])} />
          </MapContainer>
        </div>

        <div className="p-4 border-t border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest z-20">
          <div className="text-sm text-on-surface-variant">
            Selected:{" "}
            <span className="font-mono font-medium text-on-surface">
              {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </span>
            <span className="ml-2 text-xs text-outline hidden sm:inline">(You can also click on the map to pin)</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-medium text-on-surface hover:bg-surface-container-highest transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(position[0], position[1])}
              className="px-6 py-2.5 rounded-xl font-medium bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
