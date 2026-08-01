import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import MainLayout from './layouts/MainLayout';
import Analytics from './pages/Analytics';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import QueryHistory from './pages/QueryHistory';
import Register from './pages/Register';
import SavedConnections from './pages/SavedConnections';
import Settings from './pages/Settings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ContactUs from './pages/ContactUs';
import Manual from './pages/Manual';
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/saved-connections" element={<SavedConnections />} />
        <Route path="/query-history" element={<QueryHistory />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/manual" element={<Manual />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
  );
}
