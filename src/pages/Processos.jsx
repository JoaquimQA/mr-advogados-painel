import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { useIsMobile } from '../lib/useIsMobile';

const STATUS_OPCOES = [
  { key: 'em_andamento', label: 'Em andamento' },
  { key: 'concluido', label: 'Concluído' },
  { key: 'suspenso', label: 'Suspenso' },
];

const STATUS_STYLE = {
  em_andamento: { bg: '#E6F1FB', color: '#0C447C' },
  concluido: { bg: '#EAF3DE', color: '#3B6D11' },
  suspenso: { bg: '#F1EFE8', color: '#5F5E5A' },
};

export default function Processos() {
  const { cliente } = useAuth();
  const isMobile = useIsMobile();
  const [processos, setProcessos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (!cliente) return;
    carregar();
  }, [cliente]);

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase
      .from('contatos')
      .select('*')
      .eq('cliente_id', cliente.id)
      .not('numero_processo', 'is', null)
      .neq('numero_processo', '')
      .order('ultima_consulta_processo_em', { ascending: false, nullsFirst: false });
    setProcessos(data || []);
    setCarregando(false);
  }

  async function mudarStatus(id, valor) {
    setProcessos((prev) => prev.map((p) => (p.id === id ? { ...p, status_processo: valor } : p)));
    await supabase.from('contatos').update({ status_processo: valor }).eq('id', id);
  }

  function formataQuando(iso) {
    if (!iso) return 'nunca consultado';
    const isoUtc = /[Zz]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`;
    return new Date(isoUtc).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const listaFiltrada = processos.filter((p) => {
    if (!busca.trim()) return true;
    const alvo = busca.toLowerCase();
    return (p.nome || '').toLowerCase().includes(alvo) || (p.numero_processo || '').includes(alvo);
  });

  return (
    <div>
      <h1 style={{ ...styles.title, ...(isMobile ? styles.titleMobile : {}) }}>Processos</h1>
      <div style={styles.sub}>{processos.length} clientes com processo em acompanhamento.</div>

      <input style={styles.busca} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou número do processo" />

      {carregando && <div style={{ color: '#6b7893' }}>Carregando...</div>}
      {!carregando && listaFiltrada.length === 0 && (
        <div style={styles.vazio}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚖️</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#141d2e', marginBottom: 6 }}>Nenhum processo cadastrado ainda</div>
          <div style={{ fontSize: 14, maxWidth: 340, margin: '0 auto', lineHeight: 1.5 }}>
            Quando um cliente informar o número de um processo pelo WhatsApp, ele aparece aqui automaticamente.
          </div>
        </div>
      )}

      {listaFiltrada.map((p) => {
        const sv = STATUS_STYLE[p.status_processo || 'em_andamento'] || STATUS_STYLE.em_andamento;
        return (
          <div key={p.id} style={{ ...styles.card, ...(isMobile ? styles.cardMobile : {}) }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.nome || p.numero}</div>
              <div style={{ fontSize: 13.5, color: '#6b7893', fontFamily: 'monospace', marginTop: 2 }}>{p.numero_processo}</div>
              {p.ultima_movimentacao && (
                <div style={{ fontSize: 13, color: '#141d2e', marginTop: 8, background: '#F5F1EA', padding: '8px 12px', borderRadius: 10 }}>
                  {p.ultima_movimentacao}
                </div>
              )}
              <div style={{ fontSize: 12, color: '#6b7893', marginTop: 6 }}>Última consulta: {formataQuando(p.ultima_consulta_processo_em)}</div>
            </div>
            <select
              value={p.status_processo || 'em_andamento'}
              onChange={(e) => mudarStatus(p.id, e.target.value)}
              style={{ ...styles.select, background: sv.bg, color: sv.color }}
            >
              {STATUS_OPCOES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
            <a href={`https://wa.me/${p.numero}`} target="_blank" rel="noopener noreferrer" style={styles.btnWpp} title="Chamar no WhatsApp">💬</a>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  title: { fontFamily: 'Fraunces, serif', fontSize: 34, fontWeight: 600, marginBottom: 6 },
  titleMobile: { fontSize: 24 },
  sub: { color: '#6b7893', fontSize: 16, marginBottom: 20 },
  busca: { width: '100%', maxWidth: 360, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E4E7EE', fontSize: 14, marginBottom: 22, boxSizing: 'border-box' },
  vazio: { textAlign: 'center', padding: '48px 20px', background: 'white', border: '1px solid #E4E7EE', borderRadius: 16 },
  card: { background: 'white', border: '1px solid #E4E7EE', borderRadius: 16, padding: '16px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 },
  cardMobile: { flexWrap: 'wrap' },
  select: { border: 'none', borderRadius: 10, padding: '8px 12px', fontSize: 12.5, fontWeight: 700, flexShrink: 0 },
  btnWpp: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#25D366', width: 34, height: 34, borderRadius: 10, textDecoration: 'none', fontSize: 15, flexShrink: 0 },
};
