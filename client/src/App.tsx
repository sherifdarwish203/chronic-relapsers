import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import PatientStart from './pages/PatientStart';
import PatientRegister from './pages/PatientRegister';
import PatientHome from './pages/PatientHome';
import Timeline from './pages/Timeline';
import Activities from './pages/Activities';
import EventMapping from './pages/EventMapping';
import UrgeAssessment from './pages/UrgeAssessment';
import Summary from './pages/Summary';
import Tools from './pages/Tools';
import TwentyReasons from './pages/TwentyReasons';
import BlackPictures from './pages/BlackPictures';
import DailyPlanner from './pages/DailyPlanner';
import DailyPlannerView from './pages/DailyPlannerView';
import SafetyMap from './pages/SafetyMap';
import SafetyMapView from './pages/SafetyMapView';
import PersonalTriangle from './pages/PersonalTriangle';
import PersonalTriangleIntro from './pages/PersonalTriangleIntro';
import AbusserThoughtJournal from './pages/AbusserThoughtJournal';
import PersonalTriangleView from './pages/PersonalTriangleView';
import ProgramPrinciples from './pages/ProgramPrinciples';
import PersonalityProblems from './pages/PersonalityProblems';
import DecisionMatrix from './pages/DecisionMatrix';
import DecisionMatrixView from './pages/DecisionMatrixView';
import FacilitatorLogin from './pages/FacilitatorLogin';
import Dashboard from './pages/Dashboard';
import PatientDetail from './pages/PatientDetail';
import InvitePatient from './pages/InvitePatient';
import ManageInvitations from './pages/ManageInvitations';
import PatientList from './pages/PatientList';

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
        <Route path="/register" element={<PatientRegister />} />
        <Route path="/dashboard/login" element={<FacilitatorLogin />} />

        {/* Patient protected */}
        <Route path="/home" element={
          <PatientGuard><PatientHome /></PatientGuard>
        } />
        <Route path="/timeline" element={
          <PatientGuard><Timeline /></PatientGuard>
        } />
        <Route path="/activities" element={
          <PatientGuard><Activities /></PatientGuard>
        } />
        <Route path="/timeline/events/:period_id" element={
          <PatientGuard><EventMapping /></PatientGuard>
        } />
        <Route path="/timeline/urge/:period_id" element={
          <PatientGuard><UrgeAssessment /></PatientGuard>
        } />
        <Route path="/summary" element={
          <PatientGuard><Summary /></PatientGuard>
        } />
        <Route path="/tools" element={
          <PatientGuard><Tools /></PatientGuard>
        } />
        <Route path="/tools/twenty-reasons" element={
          <PatientGuard><TwentyReasons /></PatientGuard>
        } />
        <Route path="/tools/black-pictures" element={
          <PatientGuard><BlackPictures /></PatientGuard>
        } />
        <Route path="/tools/daily-planner" element={
          <PatientGuard><DailyPlanner /></PatientGuard>
        } />
        <Route path="/tools/daily-planner/view" element={
          <PatientGuard><DailyPlannerView /></PatientGuard>
        } />
        <Route path="/tools/safety-map" element={
          <PatientGuard><SafetyMap /></PatientGuard>
        } />
        <Route path="/tools/safety-map/view" element={
          <PatientGuard><SafetyMapView /></PatientGuard>
        } />
        <Route path="/tools/personal-triangle/intro" element={
          <PatientGuard><PersonalTriangleIntro /></PatientGuard>
        } />
        <Route path="/tools/personal-triangle" element={
          <PatientGuard><PersonalTriangle /></PatientGuard>
        } />
        <Route path="/tools/personal-triangle/journal" element={
          <PatientGuard><AbusserThoughtJournal /></PatientGuard>
        } />
        <Route path="/tools/personal-triangle/view" element={
          <PatientGuard><PersonalTriangleView /></PatientGuard>
        } />
        <Route path="/tools/principles" element={
          <PatientGuard><ProgramPrinciples /></PatientGuard>
        } />
        <Route path="/tools/personality-problems" element={
          <PatientGuard><PersonalityProblems /></PatientGuard>
        } />
        <Route path="/tools/decision-matrix" element={
          <PatientGuard><DecisionMatrix /></PatientGuard>
        } />
        <Route path="/tools/decision-matrix/view" element={
          <PatientGuard><DecisionMatrixView /></PatientGuard>
        } />

        {/* Facilitator protected */}
        <Route path="/dashboard" element={
          <FacilitatorGuard><Dashboard /></FacilitatorGuard>
        } />
        <Route path="/dashboard/patients/:id" element={
          <FacilitatorGuard><PatientDetail /></FacilitatorGuard>
        } />
        <Route path="/dashboard/invite-patient" element={
          <FacilitatorGuard><InvitePatient /></FacilitatorGuard>
        } />
        <Route path="/dashboard/manage-invitations" element={
          <FacilitatorGuard><ManageInvitations /></FacilitatorGuard>
        } />
        <Route path="/dashboard/patients-list" element={
          <FacilitatorGuard><PatientList /></FacilitatorGuard>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
