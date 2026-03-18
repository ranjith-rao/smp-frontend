import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CreatePage from './pages/CreatePage';
import MyPages from './pages/MyPages';
import MyPosts from './pages/MyPosts';
import PageProfile from './pages/PageProfile';
import ManagePage from './pages/ManagePage';
import PageCreatePost from './pages/PageCreatePost';
import ExplorePage from './pages/ExplorePage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPosts from './pages/admin/AdminPosts';
import AdminPostDetails from './pages/admin/AdminPostDetails';
import AdminReports from './pages/admin/AdminReports';
import AdminReportDetails from './pages/admin/AdminReportDetails';
import AdminQueries from './pages/admin/AdminQueries';
import ManageContent from './pages/admin/ManageContent';
import AdminPages from './pages/admin/AdminPages';
import AdminSettings from './pages/admin/AdminSettings';
import LegalPage from './pages/LegalPage';
import ProtectedUserRoute from './components/ProtectedUserRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import { authService } from './services/authService';

const SessionExpiryWatcher = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const redirectToLogin = () => {
      const loginRoute = authService.getLoginRoute(location.pathname);
      if (location.pathname !== loginRoute) {
        navigate(loginRoute, { replace: true });
      }
    };

    const checkSession = () => {
      const token = authService.getToken();
      if (!token) return;

      if (!authService.isLoggedIn()) {
        redirectToLogin();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };

    const onLogout = () => {
      redirectToLogin();
    };

    checkSession();

    const intervalId = window.setInterval(checkSession, 60000);
    window.addEventListener('focus', checkSession);
    window.addEventListener('pageshow', checkSession);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('auth:logout', onLogout);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', checkSession);
      window.removeEventListener('pageshow', checkSession);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('auth:logout', onLogout);
    };
  }, [location.pathname, navigate]);

  return null;
};

function App() {
  return (
    <Router>
      <SessionExpiryWatcher />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/terms-and-conditions" element={<LegalPage />} />
        <Route path="/privacy-policy" element={<LegalPage />} />
        
        {/* Protected User Home Route */}
        <Route path="/home" element={
          <ProtectedUserRoute>
            <Home />
          </ProtectedUserRoute>
        } />

        {/* Protected User Profile Route */}
        <Route path="/profile/:userId" element={
          <ProtectedUserRoute>
            <Profile />
          </ProtectedUserRoute>
        } />

        {/* Page Routes */}
        <Route path="/pages/create" element={
          <ProtectedUserRoute>
            <CreatePage />
          </ProtectedUserRoute>
        } />
        <Route path="/pages/my-pages" element={
          <ProtectedUserRoute>
            <MyPages />
          </ProtectedUserRoute>
        } />
        <Route path="/my-posts" element={
          <ProtectedUserRoute>
            <MyPosts />
          </ProtectedUserRoute>
        } />
        <Route path="/pages/explore" element={
          <ProtectedUserRoute>
            <ExplorePage />
          </ProtectedUserRoute>
        } />
        <Route path="/pages/:pageId" element={
          <ProtectedUserRoute>
            <PageProfile />
          </ProtectedUserRoute>
        } />
        <Route path="/pages/:pageId/post" element={
          <ProtectedUserRoute>
            <PageCreatePost />
          </ProtectedUserRoute>
        } />
        <Route path="/pages/:pageId/manage" element={
          <ProtectedUserRoute>
            <ManagePage />
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
          <Route path='pages' element={<AdminPages />} />
          <Route path='posts' element={<AdminPosts />} />
          <Route path='posts/:postId' element={<AdminPostDetails />} />
          <Route path='reports' element={<AdminReports />} />
          <Route path='reports/:reportId' element={<AdminReportDetails />} />
          <Route path='queries' element={<AdminQueries />} />
          <Route path='content' element={<ManageContent />} />
          <Route path='settings' element={<AdminSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;