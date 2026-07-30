import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function entrar() {
    setErro('');
    if (!email || !senha) { setErro('Preenche e-mail e senha.'); return; }
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) { setErro('E-mail ou senha incorretos.'); return; }
    navigate('/');
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.brand}>MR <span style={{ color: 'var(--moss, #22C55E)' }}>Advogados</span></div>
        <div style={styles.sub}>Acesse o painel do seu escritório</div>

        <label style={styles.label}>E-mail</label>
        <input style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@escritorio.com" />

        <label style={styles.label}>Senha</label>
        <input
          style={styles.input}
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
          onKeyDown={(e) => e.key === 'Enter' && entrar()}
        />

        {erro && <div style={styles.erro}>{erro}</div>}

        <button style={styles.btn} onClick={entrar} disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F1EA' },
  card: { background: 'white', borderRadius: 20, padding: 40, width: 380, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' },
  brand: { fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 600, color: '#141d2e', marginBottom: 4 },
  sub: { color: '#6b7893', fontSize: 14, marginBottom: 28 },
  label: { display: 'block', fontWeight: 600, fontSize: 13.5, marginBottom: 6, marginTop: 16 },
  input: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E4E7EE', fontSize: 14.5, boxSizing: 'border-box' },
  erro: { color: '#c0392b', fontSize: 13, marginTop: 12 },
  btn: { width: '100%', marginTop: 24, background: '#22C55E', color: 'white', border: 'none', padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
};
