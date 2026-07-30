import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Leads from './pages/Leads';
import Processos from './pages/Processos';
import Conversas from './pages/Conversas';
import Notificacoes from './pages/Notificacoes';
import Configuracoes from './pages/Configuracoes';

function RotaProtegida({ children }) {
  const { session, cliente, carregando } = useAuth();

  if (carregando) return <div style={{ padding: 60 }}>Carregando...</div>;
  if (!session) return <Navigate to="/login" replace />;

  return <Layout cliente={cliente}>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RotaProtegida><Leads /></RotaProtegida>} />
      <Route path="/processos" element={<RotaProtegida><Processos /></RotaProtegida>} />
      <Route path="/conversas" element={<RotaProtegida><Conversas /></RotaProtegida>} />
      <Route path="/notificacoes" element={<RotaProtegida><Notificacoes /></RotaProtegida>} />
      <Route path="/configuracoes" element={<RotaProtegida><Configuracoes /></RotaProtegida>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
