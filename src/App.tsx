import { BrowserRouter as Router, Routes, Route, BrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { POIManagement } from "./pages/POIManagement";
import { TourManagement } from "./pages/TourManagement";
import { QRManagement } from "./pages/QRManagement";
import { Login } from "./pages/Login";
import { PrivateRoute } from "./components/PrivateRoute";
import { PartnerDashboard } from "./pages/PartnerDashboard";
import { AuthProvider } from "./contexts/AuthContext";
import ForbiddenPage from "./pages/ForbiddenPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute allowRoles={["admin"]}>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="pois" element={<POIManagement />} />
            <Route path="tours" element={<TourManagement />} />
            <Route path="qr-codes" element={<QRManagement />} />
            <Route path="languages" element={<div className="p-8">Languages Management (Coming Soon)</div>} />
            <Route path="settings" element={<div className="p-8">Settings (Coming Soon)</div>} />
          </Route>
          <Route
            path="/partner"
            element={
              <PrivateRoute allowRoles={["partner"]}>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" element={<PartnerDashboard />} />
            <Route path="pois" element={<POIManagement />} />
            <Route path="tours" element={<TourManagement />} />
            <Route path="qr-codes" element={<QRManagement />} />
          </Route>

          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route
            path="*"
            element={<div className="flex items-center justify-center h-screen">404 - Page Not Found</div>}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
