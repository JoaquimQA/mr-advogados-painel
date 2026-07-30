import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) carregarCliente(data.session.user.id);
      else setCarregando(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) carregarCliente(newSession.user.id);
      else {
        setCliente(null);
        setCarregando(false);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function carregarCliente(userId) {
    setCarregando(true);
    const { data } = await supabase
      .from('usuarios')
      .select('cliente_id, clientes(*)')
      .eq('id', userId)
      .maybeSingle();
    setCliente(data?.clientes || null);
    setCarregando(false);
  }

  async function recarregarCliente() {
    if (session) await carregarCliente(session.user.id);
  }

  return (
    <AuthContext.Provider value={{ session, cliente, carregando, recarregarCliente }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
