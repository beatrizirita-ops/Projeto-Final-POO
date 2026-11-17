import { useEffect, useState } from 'react';
import { api } from './api.js';
import { brl } from './format.js';

const mesAtual = () => new Date().toLocaleDateString('sv-SE').slice(0, 7);
const nomeMes = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export default function Relatorio() {
  const [mes, setMes] = useState(mesAtual());
  const [r, setR] = useState(null);
  const [erro, setErro] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [orc, setOrc] = useState({ categoria: 'Lazer', limite: '' });
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    setErro('');
    api.relatorio(mes).then(setR).catch((e) => setErro(e.message));
  }, [mes, versao]);

  useEffect(() => { api.categorias().then(setCategorias).catch(() => {}); }, []);

  const salvarOrcamento = async (e) => {
    e.preventDefault();
    try {
      setErro('');
      await api.definirOrcamento(orc.categoria, Number(orc.limite || 0));
      setOrc({ ...orc, limite: '' });
      setVersao((v) => v + 1);
    } catch (err) {
      setErro(err.message);
    }
  };

  // CSV com ; e BOM para abrir direto no Excel em português
  const exportar = () => {
    const linhas = ['Categoria;Total;Percentual', ...r.porCategoria.map((c) => `${c.categoria};${c.total.toFixed(2).replace('.', ',')};${c.percentual}%`)];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' }));
    Object.assign(document.createElement('a'), { href: url, download: `gastos-${mes}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  const vazio = r && r.totalSaidas === 0 && r.entradas === 0 && r.previstoEntradas === 0;
  const diff = r ? r.totalSaidas - r.saidasMesAnterior : 0;
  const comparacao = !r ? '' : r.saidasMesAnterior === 0
    ? 'Sem gastos no mês anterior para comparar.'
    : `${Math.abs(Math.round((diff / r.saidasMesAnterior) * 100))}% ${diff > 0 ? 'a mais' : 'a menos'} que no mês anterior (${brl(r.saidasMesAnterior)}).`;

  return (
    <section className="relatorio">
      <div className="rel-topo">
        <label>Mês<input type="month" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} /></label>
        {r && !vazio && <button className="sec" onClick={exportar}>Exportar gastos (CSV)</button>}
      </div>
      {erro && <p className="erro" role="alert">{erro}</p>}
      {vazio && <p className="vazio">Nenhum lançamento vence em {nomeMes(mes)}. Adicione lançamentos no quadro.</p>}
      {r && !vazio && (
        <>
          <h2 className="rel-titulo">{nomeMes(mes)}</h2>
          <dl className="indicadores rel-numeros">
            <div><dt>Entradas recebidas</dt><dd className="entra">{brl(r.entradas)}</dd></div>
            <div><dt>Saídas pagas</dt><dd className="sai">{brl(r.saidas)}</dd></div>
            <div><dt>Resultado do mês</dt><dd className={r.resultado < 0 ? 'alerta' : 'entra'}>{brl(r.resultado)}</dd></div>
          </dl>
          <p className="dica">Ainda previsto neste mês: {brl(r.previstoEntradas)} a receber e {brl(r.previstoSaidas)} a pagar.</p>

          <h3>Gastos por categoria <span className="qtd">{brl(r.totalSaidas)} no total</span></h3>
          <p className="dica">{comparacao}</p>
          {r.porCategoria.length === 0 && <p className="vazio">Sem gastos neste mês.</p>}
          <ul className="barras">
            {r.porCategoria.map((c) => (
              <li key={c.categoria}>
                <span>{c.categoria}</span>
                <div className="trilho"><div className="preenche" style={{ width: `${c.percentual}%` }} /></div>
                <span className={`valor ${c.estourou ? 'alerta' : ''}`}>
                  {brl(c.total)}{c.limite != null ? ` de ${brl(c.limite)}${c.estourou ? ', passou do limite' : ''}` : ` (${c.percentual}%)`}
                </span>
              </li>
            ))}
          </ul>

          {r.maiores.length > 0 && (
            <>
              <h3>Maiores gastos</h3>
              <ul className="maiores">
                {r.maiores.map((g, i) => (
                  <li key={i}><span>{g.descricao} <em>{g.categoria}{g.etapa === 'pago' ? '' : ', ainda não pago'}</em></span><strong>{brl(g.valor)}</strong></li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      <h3>Orçamento mensal</h3>
      <p className="dica">Defina um limite de gasto por categoria. O relatório avisa quando ele for ultrapassado. Informe 0 para remover o limite.</p>
      <form className="novo" onSubmit={salvarOrcamento}>
        <select value={orc.categoria} onChange={(e) => setOrc({ ...orc, categoria: e.target.value })} aria-label="Categoria">
          {categorias.filter((c) => c !== 'Salário').map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="number" min="0" step="0.01" placeholder="Limite por mês (R$)" value={orc.limite} onChange={(e) => setOrc({ ...orc, limite: e.target.value })} aria-label="Limite por mês" required />
        <button type="submit">Definir limite</button>
      </form>
    </section>
  );
}
