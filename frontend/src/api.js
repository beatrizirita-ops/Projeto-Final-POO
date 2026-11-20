// Camada HTTP: único lugar do frontend que conhece as URLs do backend.
// O token de login fica guardado no navegador e vai em todo pedido (cabeçalho Authorization).
let token = localStorage.getItem('token');

export const temToken = () => Boolean(token);
function guardarToken(novo) {
  token = novo;
  if (novo) localStorage.setItem('token', novo);
  else localStorage.removeItem('token');
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...options.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const dados = await res.json().catch(() => null);
  if (res.status === 401 && token) {
    guardarToken(null);
    window.dispatchEvent(new Event('sessao-expirada')); // volta para a tela de login
  }
  if (!res.ok) throw new Error(dados?.erro ?? `Erro ${res.status}`);
  return dados;
}

const enviar = (metodo, url, corpo) =>
  request(url, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });

export const api = {
  // autenticação
  cadastrar: async (nome, email, senha) => {
    const r = await enviar('POST', '/auth/cadastro', { nome, email, senha });
    guardarToken(r.token);
    return r.usuario;
  },
  entrar: async (email, senha) => {
    const r = await enviar('POST', '/auth/login', { email, senha });
    guardarToken(r.token);
    return r.usuario;
  },
  eu: () => request('/auth/eu'),
  sair: async () => {
    try { await enviar('POST', '/auth/logout', {}); } catch { /* sem sessão no servidor, segue */ }
    guardarToken(null);
  },
  // finanças
  resumo: () => request('/resumo'),
  relatorio: (mes) => request(`/relatorio?mes=${mes}`),
  exportarRelatorio: async (mes, formato) => {
    const res = await fetch(`/relatorio/exportar?mes=${mes}&formato=${formato}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const dados = await res.json().catch(() => null);
      throw new Error(dados?.erro ?? `Erro ${res.status}`);
    }
    return res.blob();
  },
  categorias: () => request('/categorias'),
  listarContas: () => request('/contas'),
  listarLancamentos: () => request('/lancamentos'),
  criarConta: (dados) => enviar('POST', '/contas', dados),
  renderPoupanca: (id) => enviar('POST', `/contas/${id}/render`, {}),
  resgatarCashback: (id, paraContaId) => enviar('POST', `/contas/${id}/resgatar-cashback`, { paraContaId }),
  criarLancamento: (dados) => enviar('POST', '/lancamentos', dados),
  editar: (id, dados) => enviar('PATCH', `/lancamentos/${id}`, dados),
  definirOrcamento: (categoria, limite) => enviar('PUT', `/orcamentos/${encodeURIComponent(categoria)}`, { limite }),
  mover: (id, etapa) => enviar('PATCH', `/lancamentos/${id}`, { etapa }),
  remover: (id) => request(`/lancamentos/${id}`, { method: 'DELETE' }),
};
