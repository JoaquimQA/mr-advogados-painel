import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { useIsMobile } from '../lib/useIsMobile';

const MODULO_LABEL = {
  fluxo_base: 'Atendimento',
  agente_vendedor: 'Vendas',
  confirmacao_agenda: 'Agendamento',
  reativacao: 'Reativação',
};

export default function Conversas() {
  const { cliente } = useAuth();
  const isMobile = useIsMobile();
  const [contatos, setContatos] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [carregandoThread, setCarregandoThread] = useState(false);
  const [encerrando, setEncerrando] = useState(false);

  useEffect(() => {
    if (!cliente) return;
    carregarContatos();
    const intervalo = setInterval(carregarContatos, 15000);
    return () => clearInterval(intervalo);
  }, [cliente]);

  async function carregarContatos() {
    setCarregandoLista(true);
    const { data } = await supabase
      .from('contatos')
      .select('*')
      .eq('cliente_id', cliente.id)
      .order('ultima_interacao', { ascending: false, nullsFirst: false });
    setContatos(data || []);
    setCarregandoLista(false);
  }

  useEffect(() => {
    if (!selecionado || !cliente) return;
    const intervalo = setInterval(() => {
      carregarMensagens(selecionado);
    }, 4000);
    return () => clearInterval(intervalo);
  }, [selecionado, cliente]);

  async function abrirConversa(c) {
    setSelecionado(c);
    setCarregandoThread(true);
    setMensagens([]);
    await carregarMensagens(c);
    setCarregandoThread(false);
  }

  async function carregarMensagens(c) {
    const { data } = await supabase
      .from('conversas')
      .select('*')
      .eq('cliente_id', cliente.id)
      .eq('numero', c.numero)
      .order('criado_em', { ascending: true })
      .limit(200);
    setMensagens(data || []);
  }

  async function encerrarHandoff() {
    if (!selecionado) return;
    setEncerrando(true);
    await supabase
      .from('contatos')
      .update({ em_handoff: false })
      .eq('cliente_id', cliente.id)
      .eq('numero', selecionado.numero);
    setSelecionado({ ...selecionado, em_handoff: false });
    setContatos((prev) => prev.map((c) => (c.id === selecionado.id ? { ...c, em_handoff: false } : c)));
    setEncerrando(false);
  }

  function formataQuando(iso) {
    if (!iso) return '';
    // O Supabase retorna timestamp sem "Z" no final — sem isso, o navegador interpreta
    // a data como se já estivesse no fuso local, dobrando o deslocamento na conversão.
    const isoUtc = /[Zz]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`;
    const d = new Date(isoUtc);
    return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  const listaFiltrada = contatos.filter((c) => {
    if (!busca.trim()) return true;
    const alvo = busca.toLowerCase();
    return (c.nome || '').toLowerCase().includes(alvo) || (c.numero || '').includes(alvo);
  });

  function linkWhatsApp(numero) {
    return `https://wa.me/${numero}`;
  }

  const painelLista = (
    <div style={{ ...styles.listaPane, ...(isMobile ? styles.listaPaneMobile : {}) }}>
      <div style={styles.buscaBox}>
        <input
          style={styles.buscaInput}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou número"
        />
      </div>
      <div style={styles.listaScroll}>
        {carregandoLista && <div style={{ padding: 20, color: '#6b7893' }}>Carregando...</div>}
        {!carregandoLista && listaFiltrada.length === 0 && (
          <div style={{ padding: 20, color: '#6b7893', fontSize: 14 }}>Nenhum contato encontrado.</div>
        )}
        {listaFiltrada.map((c) => (
          <div
            key={c.id}
            onClick={() => abrirConversa(c)}
            style={{
              ...styles.itemLista,
              ...(selecionado?.id === c.id ? styles.itemListaAtivo : {}),
            }}
          >
            <div style={styles.avatar}>{(c.nome || c.numero || '??').slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.nome || c.numero}
                </div>
                {c.em_handoff && <span style={styles.pontoHandoff} title="Aguardando atendimento humano" />}
              </div>
              <div style={{ fontSize: 12.5, color: '#6b7893' }}>{c.numero}</div>
            </div>
            <div style={{ fontSize: 11, color: '#6b7893', flexShrink: 0 }}>
              {c.ultima_interacao ? formataQuando(c.ultima_interacao).split(' ')[1] : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const painelThread = (
    <div style={styles.threadPane}>
      {!selecionado && (
        <div style={styles.threadVazia}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>💬</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#141d2e', marginBottom: 6 }}>Suas conversas aparecem aqui</div>
          <div style={{ fontSize: 14, maxWidth: 300, lineHeight: 1.5 }}>
            Selecione um contato à esquerda pra ver o histórico completo de mensagens entre o assistente e o cliente.
          </div>
        </div>
      )}
      {selecionado && (
        <>
          <div style={styles.threadHeader}>
            {isMobile && (
              <button onClick={() => setSelecionado(null)} style={styles.btnVoltar}>← Voltar</button>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{selecionado.nome || selecionado.numero}</div>
              <div style={{ fontSize: 12.5, color: '#6b7893' }}>{selecionado.numero} · {selecionado.etapa}</div>
            </div>
            <a href={linkWhatsApp(selecionado.numero)} target="_blank" rel="noopener noreferrer" style={styles.btnWpp}>💬 WhatsApp</a>
            <button onClick={() => carregarMensagens(selecionado)} style={styles.btnAtualizar} title="Atualizar conversa">🔄</button>
            {selecionado.em_handoff && (
              <button onClick={encerrarHandoff} disabled={encerrando} style={styles.btnEncerrar}>
                {encerrando ? 'Encerrando...' : 'Encerrar atendimento assistido'}
              </button>
            )}
          </div>

          {selecionado.em_handoff && (
            <div style={styles.avisoHandoff}>
              ⚠️ Esse contato está aguardando atendimento humano — a IA não está respondendo automaticamente agora.
            </div>
          )}

          <div style={styles.threadScroll}>
            {carregandoThread && <div style={{ padding: 20, color: '#6b7893' }}>Carregando conversa...</div>}
            {!carregandoThread && mensagens.length === 0 && (
              <div style={{ padding: 20, color: '#6b7893', fontSize: 14 }}>Nenhuma mensagem registrada ainda com esse contato.</div>
            )}
            {mensagens.map((m) => {
              const ehCliente = m.role === 'cliente';
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: ehCliente ? 'flex-start' : 'flex-end', marginBottom: 10 }}>
                  <div style={{ maxWidth: '75%' }}>
                    <div style={{ ...styles.bolha, ...(ehCliente ? styles.bolhaCliente : styles.bolhaAgente) }}>
                      {m.texto}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#6b7893', marginTop: 3, textAlign: ehCliente ? 'left' : 'right' }}>
                      {formataQuando(m.criado_em)}
                      {m.intencao ? ` · ${m.intencao}` : ''}
                      {m.modulo ? ` · ${MODULO_LABEL[m.modulo] || m.modulo}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div>
      <h1 style={{ ...styles.title, ...(isMobile ? styles.titleMobile : {}) }}>Conversas</h1>
      <div style={styles.sub}>Veja exatamente o que a IA está conversando com cada cliente.</div>

      <div style={{ ...styles.wrapper, ...(isMobile ? styles.wrapperMobile : {}) }}>
        {isMobile ? (selecionado ? painelThread : painelLista) : (
          <>
            {painelLista}
            {painelThread}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  title: { fontFamily: 'Fraunces, serif', fontSize: 34, fontWeight: 600, marginBottom: 6 },
  titleMobile: { fontSize: 24 },
  sub: { color: '#6b7893', fontSize: 16, marginBottom: 28 },
  wrapper: { display: 'flex', gap: 20, height: '70vh', minHeight: 480 },
  wrapperMobile: { flexDirection: 'column', height: 'auto', minHeight: 'auto' },

  listaPane: { width: 320, flexShrink: 0, background: 'white', border: '1px solid #E4E7EE', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  listaPaneMobile: { width: '100%' },
  buscaBox: { padding: 14, borderBottom: '1px solid #E4E7EE' },
  buscaInput: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E4E7EE', fontSize: 14, background: '#F5F1EA' },
  listaScroll: { flex: 1, overflowY: 'auto' },
  itemLista: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1px solid #E4E7EE', cursor: 'pointer' },
  itemListaAtivo: { background: '#EAF3DE' },
  avatar: { width: 38, height: 38, borderRadius: '50%', background: '#F0997B33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#993C1D', fontSize: 13, flexShrink: 0 },
  pontoHandoff: { width: 8, height: 8, borderRadius: '50%', background: '#854F0B', flexShrink: 0 },

  threadPane: { flex: 1, background: 'white', border: '1px solid #E4E7EE', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  threadVazia: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7893', fontSize: 15, textAlign: 'center', padding: 20 },
  threadHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid #E4E7EE' },
  btnVoltar: { background: 'none', border: 'none', color: '#3B6D11', fontWeight: 700, fontSize: 14, padding: 0 },
  btnWpp: { background: '#25D366', color: 'white', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0 },
  btnAtualizar: { background: '#F1EFE8', border: '1.5px solid #E4E7EE', borderRadius: 10, width: 36, height: 36, fontSize: 15, cursor: 'pointer', flexShrink: 0 },
  btnEncerrar: { background: '#22C55E', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' },
  avisoHandoff: { padding: '10px 18px', background: '#FAEEDA', color: '#854F0B', fontSize: 13, fontWeight: 600 },
  threadScroll: { flex: 1, overflowY: 'auto', padding: '18px' },
  bolha: { padding: '10px 14px', borderRadius: 14, fontSize: 14, lineHeight: 1.4 },
  bolhaCliente: { background: '#F1EFE8', color: '#141d2e', borderBottomLeftRadius: 4 },
  bolhaAgente: { background: '#22C55E', color: 'white', borderBottomRightRadius: 4 },
};
