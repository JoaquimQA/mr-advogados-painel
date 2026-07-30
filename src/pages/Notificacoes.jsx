import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { useIsMobile } from '../lib/useIsMobile';

const SEVERIDADES = [
  { key: 'todas', label: 'Todas' },
  { key: 'urgente', label: '🔴 Urgente' },
  { key: 'acao', label: '🟡 Ação necessária' },
  { key: 'info', label: '🟢 Informativo' },
];

const SEVERIDADE_STYLE = {
  urgente: { bg: '#FCEBEB', color: '#791F1F' },
  acao: { bg: '#FAEEDA', color: '#854F0B' },
  info: { bg: '#EAF3DE', color: '#3B6D11' },
};

export default function Notificacoes() {
  const { cliente } = useAuth();
  const isMobile = useIsMobile();
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [somenteNaoLidas, setSomenteNaoLidas] = useState(false);

  useEffect(() => {
    if (!cliente) return;
    carregar();
  }, [cliente]);

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('cliente_id', cliente.id)
      .order('criado_em', { ascending: false })
      .limit(200);
    setNotificacoes(data || []);
    setCarregando(false);
  }

  async function marcarLida(id) {
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
  }

  async function marcarTodasLidas() {
    const idsNaoLidas = notificacoes.filter((n) => !n.lida).map((n) => n.id);
    if (idsNaoLidas.length === 0) return;
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    await supabase.from('notificacoes').update({ lida: true }).eq('cliente_id', cliente.id).eq('lida', false);
  }

  function formataQuando(iso) {
    const isoUtc = /[Zz]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`;
    const d = new Date(isoUtc);
    return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function linkWhatsApp(numero) {
    return `https://wa.me/${numero}`;
  }

  const listaFiltrada = notificacoes.filter((n) => {
    if (filtro !== 'todas' && n.severidade !== filtro) return false;
    if (somenteNaoLidas && n.lida) return false;
    return true;
  });

  const contagens = SEVERIDADES.reduce((acc, s) => {
    acc[s.key] = s.key === 'todas' ? notificacoes.length : notificacoes.filter((n) => n.severidade === s.key).length;
    return acc;
  }, {});
  const totalNaoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <div>
      <div style={{ ...styles.topRow, ...(isMobile ? styles.topRowMobile : {}) }}>
        <div>
          <h1 style={{ ...styles.title, ...(isMobile ? styles.titleMobile : {}) }}>Notificações</h1>
          <div style={styles.sub}>
            {totalNaoLidas > 0 ? `${totalNaoLidas} não lida${totalNaoLidas === 1 ? '' : 's'}` : 'Tudo em dia por aqui.'}
          </div>
        </div>
        {totalNaoLidas > 0 && (
          <button style={{ ...styles.btnSecondary, ...(isMobile ? { width: '100%' } : {}) }} onClick={marcarTodasLidas}>
            Marcar todas como lidas
          </button>
        )}
      </div>

      <div style={{ ...styles.filterRow, ...(isMobile ? styles.filterRowMobile : {}) }}>
        {SEVERIDADES.map((s) => (
          <div
            key={s.key}
            onClick={() => setFiltro(s.key)}
            style={{ ...styles.chip, ...(isMobile ? styles.chipMobile : {}), ...(filtro === s.key ? styles.chipActive : {}) }}
          >
            {s.label} ({contagens[s.key]})
          </div>
        ))}
        <div
          onClick={() => setSomenteNaoLidas((v) => !v)}
          style={{ ...styles.chip, ...(isMobile ? styles.chipMobile : {}), ...(somenteNaoLidas ? styles.chipActive : {}) }}
        >
          Só não lidas
        </div>
      </div>

      {carregando && <div style={{ color: '#6b7893' }}>Carregando...</div>}
      {!carregando && listaFiltrada.length === 0 && (
        <div style={{ color: '#6b7893', fontSize: 15 }}>Nenhuma notificação por aqui.</div>
      )}

      {listaFiltrada.map((n) => {
        const sv = SEVERIDADE_STYLE[n.severidade] || SEVERIDADE_STYLE.info;
        return (
          <div key={n.id} style={{ ...styles.card, ...(n.lida ? {} : styles.cardNaoLida) }}>
            <div style={{ ...styles.faixa, background: sv.bg }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{n.titulo}</div>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sv.bg, color: sv.color }}>
                  {SEVERIDADES.find((s) => s.key === n.severidade)?.label.replace(/^[^\s]+\s/, '') || n.severidade}
                </span>
                {!n.lida && <span style={styles.pontoNaoLida} />}
              </div>
              {n.mensagem && <div style={{ fontSize: 13.5, color: '#6b7893', marginTop: 4 }}>{n.mensagem}</div>}
              <div style={{ fontSize: 12, color: '#6b7893', marginTop: 6 }}>
                {formataQuando(n.criado_em)}
                {n.contato_nome ? ` · ${n.contato_nome}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {n.contato_numero && (
                <a href={linkWhatsApp(n.contato_numero)} target="_blank" rel="noopener noreferrer" style={styles.btnWpp} title="Chamar no WhatsApp">💬</a>
              )}
              {!n.lida && (
                <button onClick={() => marcarLida(n.id)} style={styles.btnMarcar} title="Marcar como lida">✓</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  topRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  topRowMobile: { flexDirection: 'column', gap: 14, marginBottom: 18 },
  title: { fontFamily: 'Fraunces, serif', fontSize: 34, fontWeight: 600, marginBottom: 6 },
  titleMobile: { fontSize: 24 },
  sub: { color: '#6b7893', fontSize: 16 },
  btnSecondary: { background: 'transparent', color: '#6b7893', border: '1.5px solid #E4E7EE', padding: '11px 18px', borderRadius: 12, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' },
  filterRow: { display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' },
  filterRowMobile: { flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 6, WebkitOverflowScrolling: 'touch' },
  chip: { padding: '9px 16px', borderRadius: 20, border: '1.5px solid #E4E7EE', fontSize: 13.5, fontWeight: 600, color: '#6b7893', background: 'white', cursor: 'pointer' },
  chipMobile: { whiteSpace: 'nowrap', flexShrink: 0 },
  chipActive: { background: '#22C55E', color: 'white', borderColor: '#22C55E' },
  card: { background: 'white', border: '1px solid #E4E7EE', borderRadius: 16, padding: '16px 18px', marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', overflow: 'hidden' },
  cardNaoLida: { borderColor: '#22C55E' },
  faixa: { width: 4, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0 },
  pontoNaoLida: { width: 8, height: 8, borderRadius: '50%', background: '#22C55E', flexShrink: 0 },
  btnWpp: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#25D366', color: 'white', width: 34, height: 34, borderRadius: 10, textDecoration: 'none', fontSize: 15, flexShrink: 0 },
  btnMarcar: { background: '#EAF3DE', color: '#3B6D11', border: 'none', width: 34, height: 34, borderRadius: 10, fontSize: 15, fontWeight: 700, flexShrink: 0, cursor: 'pointer' },
};
