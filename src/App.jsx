import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPosts from './pages/admin/AdminPosts';
import AdminReports from './pages/admin/AdminReports';
import ProtectedUserRoute from './components/ProtectedUserRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected User Home Route */}
        <Route path="/" element={
          <ProtectedUserRoute>
            <Home />
          </ProtectedUserRoute>
        } />
        
        {/* Admin Routes */}
        <Route path='/admin/login' element={<AdminLogin />} />
        
        {/* Protected Admin Routes with Layout - redirects to /admin/login if not authenticated */}
        <Route path='/admin' element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }>
          <Route path='dashboard' element={<AdminDashboard />} />
          <Route path='users' element={<AdminUsers />} />
          <Route path='posts' element={<AdminPosts />} />
          <Route path='reports' element={<AdminReports />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;