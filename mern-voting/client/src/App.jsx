import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyOtp from './pages/VerifyOtp.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ElectionDetail from './pages/ElectionDetail.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ElectionForm from './pages/ElectionForm.jsx';

function Protected({ children, admin }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function Guest({ children }) {
  const { token } = useAuth();
  return token ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Guest><Login /></Guest>} />
        <Route path="/register" element={<Guest><Register /></Guest>} />
        <Route path="/verify" element={<Guest><VerifyOtp /></Guest>} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/elections/:id" element={<Protected><ElectionDetail /></Protected>} />
        <Route path="/admin" element={<Protected admin><AdminDashboard /></Protected>} />
        <Route path="/admin/elections/new" element={<Protected admin><ElectionForm /></Protected>} />
        <Route path="/admin/elections/:id/edit" element={<Protected admin><ElectionForm /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
