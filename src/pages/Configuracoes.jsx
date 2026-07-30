import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { useIsMobile } from '../lib/useIsMobile';

const AREAS_SUGERIDAS = ['Cível', 'Trabalhista', 'Família', 'Criminal', 'Tributário', 'Empresarial', 'Previdenciário', 'Consumidor'];
const N8N_URL = 'https://mrstudio-n8n.xcvesy.easypanel.host';

export default function Configuracoes() {
  const { cliente, recarregarCliente } = useAuth();
  const isMobile = useIsMobile();
  const [aba, setAba] = useState('atendimento');

  const [nomeAgente, setNomeAgente] = useState('');
  const [instrucoes, setInstrucoes] = useState('');
  const [areas, setAreas] = useState([]);
  const [disclaimer, setDisclaimer] = useState('');
  const [numeroHumano, setNumeroHumano] = useState('');
  const [agente24h, setAgente24h] = useState(true);
  const [horaAbertura, setHoraAbertura] = useState('09:00');
  const [horaFechamento, setHoraFechamento] = useState('18:00');
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (!cliente) return;
    setNomeAgente(cliente.nome_agente || '');
    setInstrucoes(cliente.instrucoes_atendimento || '');
    setAreas(cliente.areas_atuacao || []);
    setDisclaimer(cliente.disclaimer_padrao || '');
    setNumeroHumano(cliente.numero_humano || '');
    setAgente24h(cliente.agente_24h !== false);
    setHoraAbertura(cliente.horario_abertura || '09:00');
    setHoraFechamento(cliente.horario_fechamento || '18:00');
  }, [cliente]);

  function toggleArea(area) {
    setAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
  }

  async function salvar() {
    setSalvando(true);
    await supabase
      .from('clientes')
      .update({
        nome_agente: nomeAgente,
        instrucoes_atendimento: instrucoes,
        areas_atuacao: areas,
        disclaimer_padrao: disclaimer,
        numero_humano: numeroHumano,
        agente_24h: agente24h,
        horario_abertura: horaAbertura,
        horario_fechamento: horaFechamento,
      })
      .eq('id', cliente.id);
    await recarregarCliente();
    setSalvando(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }

  return (
    <div>
      <h1 style={{ ...styles.title, ...(isMobile ? styles.titleMobile : {}) }}>Configurações</h1>
      <div style={styles.sub}>Como seu assistente atende, e a conexão com o WhatsApp.</div>

      <div style={styles.tabs}>
        <div onClick={() => setAba('atendimento')} style={{ ...styles.tab, ...(aba === 'atendimento' ? styles.tabActive : {}) }}>Atendimento</div>
        <div onClick={() => setAba('whatsapp')} style={{ ...styles.tab, ...(aba === 'whatsapp' ? styles.tabActive : {}) }}>WhatsApp</div>
      </div>

      {aba === 'atendimento' && (
        <div style={styles.card}>
          <label style={styles.label}>Nome do assistente</label>
          <input style={styles.input} value={nomeAgente} onChange={(e) => setNomeAgente(e.target.value)} placeholder="Ex: Assistente do escritório" />

          <label style={styles.label}>Como o assistente deve falar</label>
          <textarea
            style={{ ...styles.input, minHeight: 90 }}
            value={instrucoes}
            onChange={(e) => setInstrucoes(e.target.value)}
            placeholder="Ex: fale de forma formal e acolhedora, sem gírias. Trate o cliente sempre por 'senhor(a)'."
          />

          <label style={styles.label}>Áreas de atuação do escritório</label>
          <div style={styles.areasGrid}>
            {AREAS_SUGERIDAS.map((a) => (
              <div key={a} onClick={() => toggleArea(a)} style={{ ...styles.areaChip, ...(areas.includes(a) ? styles.areaChipAtiva : {}) }}>
                {a}
              </div>
            ))}
          </div>
          <div style={styles.help}>O assistente usa isso pra saber se um assunto está dentro do que o escritório atende.</div>

          <label style={styles.label}>Aviso padrão pro cliente (disclaimer)</label>
          <textarea style={{ ...styles.input, minHeight: 70 }} value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} />
          <div style={styles.help}>Aparece na primeira resposta de cada conversa nova, deixando claro que não substitui uma consulta formal.</div>

          <label style={styles.label}>Seu número (recebe os avisos de lead qualificado)</label>
          <input style={styles.input} value={numeroHumano} onChange={(e) => setNumeroHumano(e.target.value)} placeholder="5551999999999" />

          <div style={styles.divider} />

          <div style={styles.checkboxRow}>
            <input type="checkbox" checked={agente24h} onChange={(e) => setAgente24h(e.target.checked)} style={{ width: 20, height: 20, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Atender 24 horas</div>
              <div style={{ fontSize: 13, color: '#6b7893' }}>Se desligado, define o horário abaixo.</div>
            </div>
          </div>

          {!agente24h && (
            <div style={{ display: 'flex', gap: 12, marginTop: 14, ...(isMobile ? { flexDirection: 'column' } : {}) }}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Abre às</label>
                <input type="time" value={horaAbertura} onChange={(e) => setHoraAbertura(e.target.value)} style={styles.input} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Fecha às</label>
                <input type="time" value={horaFechamento} onChange={(e) => setHoraFechamento(e.target.value)} style={styles.input} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 26 }}>
            <button onClick={salvar} disabled={salvando} style={styles.btnPrimary}>{salvando ? 'Salvando...' : 'Salvar configuração'}</button>
            {salvo && <span style={{ color: '#3B6D11', fontSize: 13.5, fontWeight: 600 }}>Salvo ✓</span>}
          </div>
        </div>
      )}

      {aba === 'whatsapp' && <WhatsAppConecta cliente={cliente} />}
    </div>
  );
}

function WhatsAppConecta({ cliente }) {
  const [status, setStatus] = useState(cliente?.qrcode_status || 'aguardando');
  const [qrcode, setQrcode] = useState(cliente?.qrcode_base64 || null);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    if (status !== 'disponivel') return;
    const intervalo = setInterval(verificarStatus, 4000);
    return () => clearInterval(intervalo);
  }, [status]);

  async function verificarStatus() {
    const { data } = await supabase.from('clientes').select('qrcode_status').eq('id', cliente.id).maybeSingle();
    if (data?.qrcode_status) setStatus(data.qrcode_status);
  }

  async function gerarQrCode() {
    setGerando(true);
    try {
      const resp = await fetch(`${N8N_URL}/webhook/mradv-criar-instancia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: cliente.id, nome_negocio: cliente.nome_negocio }),
      });
      const json = await resp.json();
      if (json?.qrcode) {
        setQrcode(json.qrcode);
        setStatus('disponivel');
      }
    } catch (e) {
      alert('Não consegui gerar o QR Code. Tenta de novo.');
    }
    setGerando(false);
  }

  if (status === 'conectado') {
    return (
      <div style={styles.card}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>WhatsApp conectado</div>
          <div style={{ color: '#6b7893', fontSize: 14 }}>Seu assistente já está atendendo pelo número configurado.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      {qrcode ? (
        <div style={{ textAlign: 'center' }}>
          <img src={`data:image/png;base64,${qrcode}`} alt="QR Code do WhatsApp" style={{ width: 240, maxWidth: '100%' }} />
          <div style={{ color: '#6b7893', fontSize: 13.5, marginTop: 12 }}>Abre o WhatsApp do escritório → Aparelhos conectados → escaneia esse código.</div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ color: '#6b7893', fontSize: 14, marginBottom: 16 }}>Conecta o WhatsApp do escritório pra o assistente começar a atender.</div>
          <button onClick={gerarQrCode} disabled={gerando} style={styles.btnPrimary}>{gerando ? 'Gerando...' : 'Gerar QR Code'}</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { fontFamily: 'Fraunces, serif', fontSize: 34, fontWeight: 600, marginBottom: 6 },
  titleMobile: { fontSize: 24 },
  sub: { color: '#6b7893', fontSize: 16, marginBottom: 24 },
  tabs: { display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #E4E7EE' },
  tab: { padding: '10px 4px', marginRight: 20, fontSize: 14.5, fontWeight: 600, color: '#6b7893', cursor: 'pointer', borderBottom: '2px solid transparent' },
  tabActive: { color: '#1F3D2C', borderBottom: '2px solid #22C55E' },
  card: { background: 'white', border: '1px solid #E4E7EE', borderRadius: 16, padding: '24px 26px', maxWidth: 560 },
  label: { display: 'block', fontWeight: 600, fontSize: 14, marginTop: 18, marginBottom: 6 },
  input: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E4E7EE', fontSize: 14.5, boxSizing: 'border-box', fontFamily: 'inherit' },
  help: { fontSize: 12.5, color: '#6b7893', marginTop: 6, lineHeight: 1.4 },
  areasGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  areaChip: { padding: '8px 14px', borderRadius: 20, border: '1.5px solid #E4E7EE', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#6b7893', background: '#F5F1EA' },
  areaChipAtiva: { borderColor: '#22C55E', background: '#EAF3DE', color: '#3B6D11' },
  divider: { height: 1, background: '#E4E7EE', margin: '22px 0' },
  checkboxRow: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: '#F5F1EA', borderRadius: 12 },
  btnPrimary: { background: '#22C55E', color: 'white', border: 'none', padding: '13px 22px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
};
