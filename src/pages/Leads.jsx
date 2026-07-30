import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { useIsMobile } from '../lib/useIsMobile';

const CLASSIFICACOES = [
  { key: 'todos', label: 'Todos' },
  { key: 'novo', label: 'Novo' },
  { key: 'quente', label: '🔥 Quente' },
  { key: 'frio', label: 'Frio' },
  { key: 'cliente', label: 'Já é cliente' },
];

const CLASS_STYLE = {
  novo: { bg: '#E6F1FB', color: '#0C447C' },
  quente: { bg: '#FAEEDA', color: '#854F0B' },
  frio: { bg: '#F1EFE8', color: '#5F5E5A' },
  cliente: { bg: '#EAF3DE', color: '#3B6D11' },
};

export default function Leads() {
  const { cliente } = useAuth();
  const isMobile = useIsMobile();
  const [contatos, setContatos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [novoLead, setNovoLead] = useState({ nome: '', numero: '', area_interesse: '' });
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [erroNovo, setErroNovo] = useState('');

  useEffect(() => {
    if (!cliente) return;
    carregar();
  }, [cliente]);

  function normalizaNumero(raw) {
    let n = String(raw || '').replace(/\D/g, '');
    if (n.length === 10 || n.length === 11) n = '55' + n;
    return n;
  }

  async function criarLead() {
    setErroNovo('');
    const numero = normalizaNumero(novoLead.numero);
    if (!numero) { setErroNovo('Informe um número de WhatsApp.'); return; }
    setSalvandoNovo(true);
    const { error } = await supabase.from('contatos').insert({
      cliente_id: cliente.id,
      numero,
      nome: novoLead.nome || null,
      area_interesse: novoLead.area_interesse || null,
      classificacao_lead: 'novo',
      origem: 'manual',
    });
    setSalvandoNovo(false);
    if (error) {
      setErroNovo(error.code === '23505' ? 'Esse número já está cadastrado.' : 'Não consegui salvar. Tenta de novo.');
      return;
    }
    setModalAberto(false);
    setNovoLead({ nome: '', numero: '', area_interesse: '' });
    carregar();
  }

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase
      .from('contatos')
      .select('*')
      .eq('cliente_id', cliente.id)
      .order('ultima_interacao', { ascending: false, nullsFirst: false });
    setContatos(data || []);
    setCarregando(false);
  }

  async function mudarClassificacao(id, valor) {
    setContatos((prev) => prev.map((c) => (c.id === id ? { ...c, classificacao_lead: valor } : c)));
    await supabase.from('contatos').update({ classificacao_lead: valor }).eq('id', id);
  }

  async function excluir(c) {
    if (!confirm(`Excluir ${c.nome || c.numero} da base? Essa ação não pode ser desfeita.`)) return;
    setContatos((prev) => prev.filter((x) => x.id !== c.id));
    await supabase.from('contatos').delete().eq('id', c.id);
  }

  const [modalProcesso, setModalProcesso] = useState(null);
  const [numeroProcessoInput, setNumeroProcessoInput] = useState('');

  function abrirVinculoProcesso(c) {
    setModalProcesso(c);
    setNumeroProcessoInput(c.numero_processo || '');
  }

  async function salvarProcesso() {
    const valor = numeroProcessoInput.trim();
    await supabase
      .from('contatos')
      .update({ numero_processo: valor || null, status_processo: valor ? 'em_andamento' : null })
      .eq('id', modalProcesso.id);
    setContatos((prev) => prev.map((c) => (c.id === modalProcesso.id ? { ...c, numero_processo: valor || null } : c)));
    setModalProcesso(null);
  }

  function linkWhatsApp(numero) {
    return `https://wa.me/${numero}`;
  }

  const listaFiltrada = contatos.filter((c) => {
    if (filtro !== 'todos' && (c.classificacao_lead || 'novo') !== filtro) return false;
    if (busca.trim()) {
      const alvo = busca.toLowerCase();
      if (!(c.nome || '').toLowerCase().includes(alvo) && !(c.numero || '').includes(alvo)) return false;
    }
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'flex-start', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: 14, marginBottom: 6 }}>
        <div>
          <h1 style={{ ...styles.title, ...(isMobile ? styles.titleMobile : {}) }}>Leads</h1>
          <div style={styles.sub}>{contatos.length} contatos na sua base.</div>
        </div>
        <button onClick={() => setModalAberto(true)} style={styles.btnPrimary}>+ Criar lead</button>
      </div>

      <div style={{ ...styles.filterRow, ...(isMobile ? styles.filterRowMobile : {}) }}>
        {CLASSIFICACOES.map((f) => (
          <div key={f.key} onClick={() => setFiltro(f.key)} style={{ ...styles.chip, ...(filtro === f.key ? styles.chipActive : {}) }}>
            {f.label}
          </div>
        ))}
      </div>

      <input style={styles.busca} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou número" />

      {carregando && <div style={{ color: '#6b7893' }}>Carregando...</div>}
      {!carregando && listaFiltrada.length === 0 && <div style={{ color: '#6b7893', fontSize: 15 }}>Nenhum lead encontrado.</div>}

      {listaFiltrada.map((c) => {
        const sv = CLASS_STYLE[c.classificacao_lead || 'novo'] || CLASS_STYLE.novo;
        return (
          <div key={c.id} style={{ ...styles.card, ...(isMobile ? styles.cardMobile : {}) }}>
            <div style={styles.avatar}>{(c.nome || c.numero || '??').slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{c.nome || 'Sem nome'}</div>
                {c.em_handoff && <span style={styles.pontoHandoff} title="Aguardando atendimento humano" />}
              </div>
              <div style={{ fontSize: 13, color: '#6b7893' }}>{c.numero}</div>
              {(c.area_interesse || c.numero_processo) && (
                <div style={{ fontSize: 12.5, color: '#6b7893', marginTop: 3 }}>
                  {c.area_interesse ? `Área: ${c.area_interesse}` : ''}
                  {c.area_interesse && c.numero_processo ? ' · ' : ''}
                  {c.numero_processo ? `Processo: ${c.numero_processo}` : ''}
                </div>
              )}
            </div>
            {c.urgencia === 'alta' && <span style={styles.badgeUrgente}>Urgente</span>}
            <select
              value={c.classificacao_lead || 'novo'}
              onChange={(e) => mudarClassificacao(c.id, e.target.value)}
              style={{ ...styles.select, background: sv.bg, color: sv.color }}
            >
              {CLASSIFICACOES.filter((f) => f.key !== 'todos').map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
            <a href={linkWhatsApp(c.numero)} target="_blank" rel="noopener noreferrer" style={styles.btnWpp} title="Chamar no WhatsApp">💬</a>
            <button onClick={() => abrirVinculoProcesso(c)} style={{ ...styles.btnWpp, background: c.numero_processo ? '#0C447C' : '#E4E7EE', color: c.numero_processo ? 'white' : '#6b7893' }} title="Vincular processo">⚖️</button>
            <button onClick={() => excluir(c)} style={styles.btnDelete} title="Excluir">🗑️</button>
          </div>
        );
      })}

      {modalAberto && (
        <div style={styles.overlay} onClick={() => !salvandoNovo && setModalAberto(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18, fontFamily: 'Fraunces, serif' }}>Criar lead</div>

            <label style={styles.label}>Nome</label>
            <input style={styles.input} value={novoLead.nome} onChange={(e) => setNovoLead({ ...novoLead, nome: e.target.value })} placeholder="Nome do contato" />

            <label style={styles.label}>Número do WhatsApp</label>
            <input style={styles.input} value={novoLead.numero} onChange={(e) => setNovoLead({ ...novoLead, numero: e.target.value })} placeholder="51999999999" />

            <label style={styles.label}>Área de interesse (opcional)</label>
            <input style={styles.input} value={novoLead.area_interesse} onChange={(e) => setNovoLead({ ...novoLead, area_interesse: e.target.value })} placeholder="Ex: Trabalhista" />

            {erroNovo && <div style={{ color: '#c0392b', fontSize: 13, marginTop: 10 }}>{erroNovo}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={criarLead} disabled={salvandoNovo} style={styles.btnPrimary}>{salvandoNovo ? 'Salvando...' : 'Criar'}</button>
              <button onClick={() => setModalAberto(false)} style={styles.btnSecondary}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {modalProcesso && (
        <div style={styles.overlay} onClick={() => setModalProcesso(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6, fontFamily: 'Fraunces, serif' }}>Vincular processo</div>
            <div style={{ fontSize: 13.5, color: '#6b7893', marginBottom: 16 }}>{modalProcesso.nome || modalProcesso.numero}</div>

            <label style={styles.label}>Número do processo</label>
            <input
              style={styles.input}
              value={numeroProcessoInput}
              onChange={(e) => setNumeroProcessoInput(e.target.value)}
              placeholder="0000000-00.0000.0.00.0000"
            />
            <div style={{ fontSize: 12.5, color: '#6b7893', marginTop: 6 }}>Deixa em branco e salva pra desvincular.</div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={salvarProcesso} style={styles.btnPrimary}>Salvar</button>
              <button onClick={() => setModalProcesso(null)} style={styles.btnSecondary}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { fontFamily: 'Fraunces, serif', fontSize: 34, fontWeight: 600, marginBottom: 6 },
  titleMobile: { fontSize: 24 },
  sub: { color: '#6b7893', fontSize: 16, marginBottom: 20 },
  filterRow: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  filterRowMobile: { flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 6 },
  chip: { padding: '8px 14px', borderRadius: 20, border: '1.5px solid #E4E7EE', fontSize: 13, fontWeight: 600, color: '#6b7893', background: 'white', cursor: 'pointer', whiteSpace: 'nowrap' },
  chipActive: { background: '#22C55E', color: 'white', borderColor: '#22C55E' },
  busca: { width: '100%', maxWidth: 340, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E4E7EE', fontSize: 14, marginBottom: 20, boxSizing: 'border-box' },
  card: { background: 'white', border: '1px solid #E4E7EE', borderRadius: 16, padding: '14px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 },
  cardMobile: { flexWrap: 'wrap' },
  avatar: { width: 40, height: 40, borderRadius: '50%', background: '#F0997B33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#993C1D', fontSize: 13, flexShrink: 0 },
  pontoHandoff: { width: 8, height: 8, borderRadius: '50%', background: '#BA7517', flexShrink: 0 },
  badgeUrgente: { background: '#FCEBEB', color: '#791F1F', padding: '4px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, flexShrink: 0 },
  select: { border: 'none', borderRadius: 10, padding: '8px 12px', fontSize: 12.5, fontWeight: 700, flexShrink: 0 },
  btnWpp: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#25D366', width: 34, height: 34, borderRadius: 10, textDecoration: 'none', fontSize: 15, flexShrink: 0 },
  btnDelete: { background: 'transparent', color: '#E24B4A', border: '1.5px solid #E4E7EE', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', flexShrink: 0 },
  btnPrimary: { background: '#22C55E', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 12, fontSize: 14.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSecondary: { background: 'transparent', color: '#6b7893', border: '1.5px solid #E4E7EE', padding: '12px 20px', borderRadius: 12, fontSize: 14.5, fontWeight: 700, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(20,29,46,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 },
  modal: { background: 'white', borderRadius: 20, padding: 28, width: 400, maxWidth: '100%' },
  label: { display: 'block', fontWeight: 600, fontSize: 13.5, marginTop: 14, marginBottom: 6 },
  input: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E4E7EE', fontSize: 14.5, boxSizing: 'border-box' },
};
