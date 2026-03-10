import React, { useState } from 'react';
import { LogOut, MapPin, Route } from 'lucide-react';

import { POI, Tour } from '../types';
import { initialPOIs, initialTours } from '../data/mock';
import { PoiManagement } from '../widgets/PoiManagement/PoiManagement';
import { TourManagement } from '../widgets/TourManagement/TourManagement';

export function DashboardPage({ onLogout }: { onLogout: () => void }) {
  const [pois, setPois] = useState<POI[]>(initialPOIs);
  const [tours, setTours] = useState<Tour[]>(initialTours);
  const [activeTab, setActiveTab] = useState<'tours' | 'pois'>('tours');

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-slate-800 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="text-emerald-400" />
            GPS Admin
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('tours')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'tours' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            <Route className="w-5 h-5" />
            <span className="font-medium">Tours</span>
          </button>
          <button
            onClick={() => setActiveTab('pois')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'pois' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            <MapPin className="w-5 h-5" />
            <span className="font-medium">POIs</span>
          </button>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'pois' ? (
          <PoiManagement pois={pois} setPois={setPois} tours={tours} setTours={setTours} />
        ) : (
          <TourManagement tours={tours} setTours={setTours} pois={pois} />
        )}
      </div>
    </div>
  );
}

