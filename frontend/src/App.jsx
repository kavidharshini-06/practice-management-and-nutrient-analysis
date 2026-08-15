import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

// Components & Guard
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Unified settings
import Settings from './pages/Settings';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManageDietitians from './pages/Admin/ManageDietitians';
import ManageUsers from './pages/Admin/ManageUsers';
import ManageFoods from './pages/Admin/ManageFoods';

// Dietitian Pages
import DietitianDashboard from './pages/Dietitian/DietitianDashboard';
import Patients from './pages/Dietitian/Patients';
import PatientDetails from './pages/Dietitian/PatientDetails';
import DietPlanBuilder from './pages/Dietitian/DietPlanBuilder';
import DietPlanViewer from './pages/Dietitian/DietPlanViewer';
import Appointments from './pages/Dietitian/Appointments';
import Consultations from './pages/Dietitian/Consultations';

// Patient Pages
import PatientDashboard from './pages/Patient/PatientDashboard';
import MyDietPlan from './pages/Patient/MyDietPlan';
import MyAppointments from './pages/Patient/MyAppointments';
import MyProgress from './pages/Patient/MyProgress';

// Root Route Redirect Handler
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfbf7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'dietitian') return <Navigate to="/dietitian" replace />;
  return <Navigate to="/patient" replace />;
};

// Layout Wrapper for authenticated portals
const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-[#fcfbf7] flex">
      {/* Sidebar navigation */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main viewport area */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppContent = () => {
  return (
    <Routes>
      {/* ========================================== */}
      {/* Public Auth Routes */}
      {/* ========================================== */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Root redirector */}
      <Route path="/" element={<RootRedirect />} />

      {/* ========================================== */}
      {/* Admin Portal Protected Routes */}
      {/* ========================================== */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <AdminDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/dietitians" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <ManageDietitians />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <ManageUsers />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/foods" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <ManageFoods />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ========================================== */}
      {/* Dietitian Portal Protected Routes */}
      {/* ========================================== */}
      <Route path="/dietitian" element={
        <ProtectedRoute allowedRoles={['dietitian']}>
          <DashboardLayout>
            <DietitianDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dietitian/patients" element={
        <ProtectedRoute allowedRoles={['dietitian']}>
          <DashboardLayout>
            <Patients />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dietitian/patients/:id" element={
        <ProtectedRoute allowedRoles={['dietitian']}>
          <DashboardLayout>
            <PatientDetails />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dietitian/foods" element={
        <ProtectedRoute allowedRoles={['dietitian']}>
          <DashboardLayout>
            <ManageFoods />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dietitian/appointments" element={
        <ProtectedRoute allowedRoles={['dietitian']}>
          <DashboardLayout>
            <Appointments />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dietitian/consultations" element={
        <ProtectedRoute allowedRoles={['dietitian']}>
          <DashboardLayout>
            <Consultations />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dietitian/diet-plans/new" element={
        <ProtectedRoute allowedRoles={['dietitian']}>
          <DashboardLayout>
            <DietPlanBuilder />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dietitian/diet-plans/view/:id" element={
        <ProtectedRoute allowedRoles={['dietitian']}>
          <DashboardLayout>
            <DietPlanViewer />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dietitian/settings" element={
        <ProtectedRoute allowedRoles={['dietitian']}>
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ========================================== */}
      {/* Patient Portal Protected Routes */}
      {/* ========================================== */}
      <Route path="/patient" element={
        <ProtectedRoute allowedRoles={['patient']}>
          <DashboardLayout>
            <PatientDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/patient/diet-plan" element={
        <ProtectedRoute allowedRoles={['patient']}>
          <DashboardLayout>
            <MyDietPlan />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/patient/diet-plans/view/:id" element={
        <ProtectedRoute allowedRoles={['patient']}>
          <DashboardLayout>
            <DietPlanViewer />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/patient/appointments" element={
        <ProtectedRoute allowedRoles={['patient']}>
          <DashboardLayout>
            <MyAppointments />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/patient/progress" element={
        <ProtectedRoute allowedRoles={['patient']}>
          <DashboardLayout>
            <MyProgress />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/patient/settings" element={
        <ProtectedRoute allowedRoles={['patient']}>
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Fallback to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
