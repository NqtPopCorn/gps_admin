import React, { useState } from "react";
import { Clock, Image as ImageIcon, Plus, Route, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { POI, Tour } from "../../types";
import { TourEditor } from "./TourEditor";

export function TourManagement({
  tours,
  setTours,
  pois,
}: {
  tours: Tour[];
  setTours: React.Dispatch<React.SetStateAction<Tour[]>>;
  pois: POI[];
}) {
  const [editingTour, setEditingTour] = useState<Tour | null>(null);

  if (editingTour) {
    return (
      <TourEditor
        tour={editingTour}
        setTour={setEditingTour}
        pois={pois}
        onSave={(t) => {
          if (tours.find((existing) => existing.id === t.id)) {
            setTours(
              tours.map((existing) => (existing.id === t.id ? t : existing)),
            );
          } else {
            setTours([...tours, t]);
          }
          setEditingTour(null);
        }}
        onCancel={() => setEditingTour(null)}
      />
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            Danh sách Tours ({tours.length})
          </h1>
          <button
            onClick={() =>
              setEditingTour({
                id: uuidv4(),
                name: "",
                duration: 0,
                poiIds: [],
                createdAt: new Date().toISOString(),
              })
            }
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Tạo mới
          </button>
        </div>

        {tours.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-500">
            <Route className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-700 mb-2">
              Danh sách tour trống
            </p>
            <button
              onClick={() =>
                setEditingTour({
                  id: uuidv4(),
                  name: "",
                  duration: 0,
                  poiIds: [],
                  createdAt: new Date().toISOString(),
                })
              }
              className="text-emerald-600 font-medium hover:underline"
            >
              Tạo tour ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour) => (
              <div
                key={tour.id}
                onClick={() => setEditingTour(tour)}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative"
              >
                <div className="aspect-[21/9] bg-slate-100 relative">
                  {tour.image ? (
                    <img
                      src={tour.image}
                      alt={tour.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg text-slate-800 mb-2">
                    {tour.name || "Chưa đặt tên"}
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-4 h-10">
                    {tour.description || "Chưa có mô tả..."}
                  </p>
                  <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {tour.duration} phút
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Route className="w-4 h-4 text-slate-400" />
                      {tour.poiIds.length} điểm
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Xóa tour này?")) {
                      setTours(tours.filter((t) => t.id !== tour.id));
                    }
                  }}
                  className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
