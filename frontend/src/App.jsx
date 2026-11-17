import { useEffect, useState } from 'react';
import { api, temToken } from './api.js';
import Login from './Login.jsx';
import Relatorio from './Relatorio.jsx';
import { brl, data } from './format.js';

const ETAPAS = [
  { id: 'pendente', titulo: 'Pendentes', dica: 'Ainda não programados' },
  { id: 'agendado', titulo: 'Agendados', dica: 'Pagamento programado' },
  { id: 'pago', titulo: 'Pagos', dica: 'Já saiu ou entrou na conta' },
];
const TIPOS = { receita: 'Receita', despesa: 'Despesa', boleto: 'Boleto' };
const hoje = () => new Date().toLocaleDateString('sv-SE');

const FORM_VAZIO = { tipo: 'boleto', descricao: '', valor: '', vencimento: hoje(), contaId: '', categoria: 'Outros', repetir: 'unica', vezes: '12' };

function Painel({ usuario, onSair }) {
  const [resumo, setResumo] = useState(null);
  const [contas, setContas] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState('quadro');
  const [editando, setEditando] = useState(null); // id do lançamento em edição
  const [categorias, setCategorias] = useState([]);
  const [novaConta, setNovaConta] = useState({ nome: '', saldo: '' });

  // Busca tudo em paralelo (Promise.all) e atualiza o estado
  const refresh = async () => {
    const [r, c, l, cat] = await Promise.all([api.resumo(), api.listarContas(), api.listarLancamentos(), api.categorias()]);
    setResumo(r);
    setCategorias(cat);
    setContas(c);
    setLancamentos(l);
    setForm((f) => (f.contaId || !c[0] ? f : { ...f, contaId: String(c[0].id) }));
  };

  // Executa a operação no backend e depois consulta os dados de novo
  const action = async (operation) => {
    try {
      setErro('');
      await operation();
      await refresh();
    } catch (e) {
      setErro(e.message);
    }
  };

  useEffect(() => { action(async () => {}); }, []);

  const criar = (e) => {
    e.preventDefault();
    action(async () => {
      const dados = { ...form, contaId: Number(form.contaId), valor: Number(form.valor), vezes: Number(form.vezes) };
      if (editando) { await api.editar(editando, dados); setEditando(null); }
      else await api.criarLancamento(dados);
      setForm((f) => ({ ...FORM_VAZIO, contaId: f.contaId, tipo: f.tipo }));
    });
  };

  const iniciarEdicao = (l) => {
    setEditando(l.id);
    setForm({ tipo: l.tipo, descricao: l.descricao, valor: String(l.valor), vencimento: l.vencimento, contaId: String(l.contaId), categoria: l.categoria, repetir: 'unica', vezes: '12' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelarEdicao = () => { setEditando(null); setForm((f) => ({ ...FORM_VAZIO, contaId: f.contaId })); };

  const criarConta = (e) => {
    e.preventDefault();
    action(async () => {
      await api.criarConta(novaConta.nome, Number(novaConta.saldo || 0));
      setNovaConta({ nome: '', saldo: '' });
    });
  };

  const proxima = { pendente: 'agendado', agendado: 'pago' };
  const anterior = { agendado: 'pendente' };
  const nomeConta = (id) => contas.find((c) => c.id === id)?.nome ?? '';

  return (
    <div className="app">
      <div className="barra">
        <span>Olá, {usuario.nome}</span>
        <button className="sec" onClick={onSair}>Sair</button>
      </div>

      <header className="topo">
        <div className="saldo">
          <span className="rotulo">Saldo em conta</span>
          <strong>{resumo ? brl(resumo.saldoTotal) : '—'}</strong>
        </div>
        <dl className="indicadores">
          <div><dt>A receber</dt><dd className="entra">{resumo ? brl(resumo.aReceber) : '—'}</dd></div>
          <div><dt>A pagar</dt><dd className="sai">{resumo ? brl(resumo.aPagar) : '—'}</dd></div>
          <div><dt>Vencem em 7 dias</dt><dd>{resumo ? resumo.vencemEm7Dias : '—'}</dd></div>
          <div><dt>Vencidos</dt><dd className={resumo?.vencidos ? 'alerta' : ''}>{resumo ? resumo.vencidos : '—'}</dd></div>
        </dl>
      </header>

      {erro && <p className="erro" role="alert">{erro}</p>}

      <nav className="abas">
        <button className={aba === 'quadro' ? 'ativa' : ''} onClick={() => setAba('quadro')}>Quadro</button>
        <button className={aba === 'relatorio' ? 'ativa' : ''} onClick={() => setAba('relatorio')}>Relatório do mês</button>
      </nav>

      {aba === 'relatorio' ? <Relatorio /> : (<>
      <form className="novo" onSubmit={criar}>
        <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} aria-label="Tipo">
          {Object.entries(TIPOS).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
        </select>
        <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} aria-label="Categoria">
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} aria-label="Descrição" required />
        <input type="number" step="0.01" min="0.01" placeholder="Valor (R$)" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} aria-label="Valor" required />
        <input type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} aria-label="Vencimento" required />
        {!editando && (
          <>
            <select value={form.repetir} onChange={(e) => setForm({ ...form, repetir: e.target.value })} aria-label="Repetição">
              <option value="unica">Não repetir</option>
              <option value="mensal">Todo mês</option>
              <option value="semanal">Toda semana</option>
            </select>
            {form.repetir !== 'unica' && (
              <input type="number" min="2" max="60" value={form.vezes} onChange={(e) => setForm({ ...form, vezes: e.target.value })} aria-label="Quantas vezes repetir" title="Quantas vezes repetir" />
            )}
          </>
        )}
        <select value={form.contaId} onChange={(e) => setForm({ ...form, contaId: e.target.value })} aria-label="Conta">
          {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <button type="submit">{editando ? 'Salvar alterações' : 'Adicionar lançamento'}</button>
        {editando && <button type="button" className="sec" onClick={cancelarEdicao}>Cancelar edição</button>}
      </form>

      <main className="quadro">
        {ETAPAS.map((etapa) => {
          const itens = lancamentos.filter((l) => l.etapa === etapa.id);
          return (
            <section key={etapa.id} className="coluna">
              <h2>{etapa.titulo} <span className="qtd">{itens.length}</span></h2>
              <p className="dica">{etapa.dica}</p>
              {itens.length === 0 && <p className="vazio">Nenhum lançamento aqui. Adicione um acima.</p>}
              {itens.map((l) => (
                <article key={l.id} className={`item ${l.tipo} ${l.vencido ? 'vencido' : ''}`}>
                  <div className="linha">
                    <span className="desc">{l.descricao}</span>
                    <span className={l.tipo === 'receita' ? 'entra' : 'sai'}>
                      {l.tipo === 'receita' ? '+' : '−'} {brl(l.valorAtualizado)}
                    </span>
                  </div>
                  <div className="meta">
                    {TIPOS[l.tipo]}, {l.categoria}, vence em {data(l.vencimento)}, {nomeConta(l.contaId)}
                    {l.valorAtualizado !== l.valor && <em> (original {brl(l.valor)}, com multa e juros)</em>}
                  </div>
                  {l.vencido && <div className="selo">Vencido</div>}
                  <div className="acoes">
                    {anterior[l.etapa] && <button className="sec" onClick={() => action(() => api.mover(l.id, anterior[l.etapa]))}>Voltar</button>}
                    {proxima[l.etapa] && (
                      <button onClick={() => action(() => api.mover(l.id, proxima[l.etapa]))}>
                        {proxima[l.etapa] === 'pago' ? (l.tipo === 'receita' ? 'Receber' : 'Pagar') : 'Agendar'}
                      </button>
                    )}
                    {l.etapa !== 'pago' && (
                      <>
                        <button className="sec" onClick={() => iniciarEdicao(l)}>Editar</button>
                        <button className="sec" onClick={() => action(() => api.remover(l.id))}>Excluir</button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </section>
          );
        })}
      </main>

      <form className="novo conta" onSubmit={criarConta}>
        <input placeholder="Nome da nova conta (ex.: Carteira)" value={novaConta.nome} onChange={(e) => setNovaConta({ ...novaConta, nome: e.target.value })} aria-label="Nome da conta" required />
        <input type="number" step="0.01" placeholder="Saldo inicial (R$)" value={novaConta.saldo} onChange={(e) => setNovaConta({ ...novaConta, saldo: e.target.value })} aria-label="Saldo inicial" />
        <button type="submit" className="sec">Criar conta</button>
      </form>
      </>)}
    </div>
  );
}

// Decide qual tela mostrar: login ou painel
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(temToken());

  useEffect(() => {
    if (temToken()) api.eu().then(setUsuario).catch(() => {}).finally(() => setVerificando(false));
    const expirou = () => setUsuario(null);
    window.addEventListener('sessao-expirada', expirou);
    return () => window.removeEventListener('sessao-expirada', expirou);
  }, []);

  const sair = async () => { await api.sair(); setUsuario(null); };

  if (verificando) return null;
  return usuario ? <Painel usuario={usuario} onSair={sair} /> : <Login onEntrar={setUsuario} />;
}
