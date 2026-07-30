import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useIsMobile } from '../lib/useIsMobile';

const navItems = [
  { to: '/', label: 'Leads', icon: '👥', end: true },
  { to: '/processos', label: 'Processos', icon: '⚖️' },
  { to: '/conversas', label: 'Conversas', icon: '💬' },
  { to: '/notificacoes', label: 'Notificações', icon: '🔔', notifKey: true },
  { to: '/configuracoes', label: 'Configurações', icon: '⚙️' },
];

export default function Layout({ children, cliente }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuAberto, setMenuAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    if (!cliente) return;
    buscarNaoLidas();
    const intervalo = setInterval(buscarNaoLidas, 60000);
    return () => clearInterval(intervalo);
  }, [cliente]);

  async function buscarNaoLidas() {
    const { count } = await supabase
      .from('notificacoes')
      .select('id', { count: 'exact', head: true })
      .eq('cliente_id', cliente.id)
      .eq('lida', false);
    setNaoLidas(count || 0);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  function fecharMenu() {
    if (isMobile) setMenuAberto(false);
  }

  return (
    <div style={styles.shell}>
      {isMobile && (
        <div style={styles.topbar}>
          <button onClick={() => setMenuAberto(true)} style={styles.hamburgerBtn} aria-label="Abrir menu">☰</button>
          <div style={styles.topbarBrand}>MR Advogados</div>
        </div>
      )}

      {isMobile && menuAberto && <div style={styles.overlay} onClick={fecharMenu} />}

      <div
        style={{
          ...styles.sidebar,
          ...(isMobile ? { ...styles.sidebarMobile, transform: menuAberto ? 'translateX(0)' : 'translateX(-100%)' } : {}),
        }}
      >
        <div>
          {isMobile && <button onClick={fecharMenu} style={styles.closeBtn} aria-label="Fechar menu">✕</button>}
          <div style={styles.brand}>MR Advogados</div>
          <div style={styles.brandSub}>{cliente?.nome_negocio || '...'}</div>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={fecharMenu}
              style={({ isActive }) => ({ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) })}
            >
              <span>{item.icon}</span> {item.label}
              {item.notifKey && naoLidas > 0 && <span style={styles.badge}>{naoLidas > 9 ? '9+' : naoLidas}</span>}
            </NavLink>
          ))}
        </div>

        <button onClick={handleLogout} style={styles.logoutBtn}>Sair</button>
      </div>

      <div style={{ ...styles.main, ...(isMobile ? styles.mainMobile : {}) }}>{children}</div>
    </div>
  );
}

const styles = {
  shell: { display: 'flex', minHeight: '100vh', background: '#F5F1EA' },
  topbar: { position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: '#EFE9DE', borderBottom: '1px solid #E4E7EE', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', zIndex: 30 },
  hamburgerBtn: { background: 'transparent', border: 'none', fontSize: 22, lineHeight: 1, color: '#1F3D2C', padding: 4 },
  topbarBrand: { fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, color: '#1F3D2C' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(43,38,34,0.4)', zIndex: 39 },
  sidebar: { width: 240, background: '#EFE9DE', borderRight: '1px solid #E4E7EE', padding: '32px 20px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  sidebarMobile: { position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40, width: '80%', maxWidth: 280, transition: 'transform 0.25s ease', boxShadow: '2px 0 16px rgba(0,0,0,0.15)' },
  closeBtn: { background: 'transparent', border: 'none', fontSize: 20, color: '#6b7893', marginBottom: 12, padding: 4, alignSelf: 'flex-end', display: 'block' },
  brand: { fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600, marginBottom: 4, color: '#1F3D2C' },
  brandSub: { fontSize: 13, color: '#6b7893', marginBottom: 40 },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, fontSize: 15, fontWeight: 500, color: '#6b7893', marginBottom: 4, textDecoration: 'none' },
  navItemActive: { background: '#22C55E', color: 'white' },
  badge: { marginLeft: 'auto', background: '#E24B4A', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20, minWidth: 18, textAlign: 'center' },
  logoutBtn: { background: 'transparent', border: '1px solid #E4E7EE', borderRadius: 12, padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#6b7893', cursor: 'pointer' },
  main: { flex: 1, padding: '44px 48px', maxWidth: 1100, width: '100%' },
  mainMobile: { padding: '72px 16px 32px', maxWidth: '100%' },
};
