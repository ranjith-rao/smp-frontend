import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import ProtectedUserRoute from './components/ProtectedUserRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
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
        <Route path="/pages/explore" element={<ExplorePage />} />
        <Route path="/pages/:pageId" element={<PageProfile />} />
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
        </Route>
      </Routes>
    </Router>
  );
}

export default App;