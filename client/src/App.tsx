import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import PatientStart from './pages/PatientStart';
import Timeline from './pages/Timeline';
import EventMapping from './pages/EventMapping';
import Summary from './pages/Summary';
import FacilitatorLogin from './pages/FacilitatorLogin';
import Dashboard from './pages/Dashboard';
import PatientDetail from './pages/PatientDetail';

function PatientGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('patient_token');
  if (!token) return <Navigate to="/start" replace />;
  return <>{children}</>;
}

function FacilitatorGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('facilitator_token');
  if (!token) return <Navigate to="/dashboard/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/start" element={<PatientStart />} />
        <Route path="/dashboard/login" element={<FacilitatorLogin />} />

        {/* Patient protected */}
        <Route path="/timeline" element={
          <PatientGuard><Timeline /></PatientGuard>
        } />
        <Route path="/timeline/events/:period_id" element={
          <PatientGuard><EventMapping /></PatientGuard>
        } />
        <Route path="/summary" element={
          <PatientGuard><Summary /></PatientGuard>
        } />

        {/* Facilitator protected */}
        <Route path="/dashboard" element={
          <FacilitatorGuard><Dashboard /></FacilitatorGuard>
        } />
        <Route path="/dashboard/patients/:id" element={
          <FacilitatorGuard><PatientDetail /></FacilitatorGuard>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
