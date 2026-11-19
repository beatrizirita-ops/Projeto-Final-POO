import { CATEGORIAS, GestorFinanceiro } from './dominio.ts';
import { ServicoAuth } from './auth.ts';
import { PrismaFinanceiroRepository, PrismaUsuarioRepository } from './repository.ts';

// Injeção de dependência com Prisma ORM
const repoFinanceiro = new PrismaFinanceiroRepository();
const repoUsuario = new PrismaUsuarioRepository();

const gestor = new GestorFinanceiro(repoFinanceiro);
const auth = new ServicoAuth(repoUsuario);

const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve({ port: 3000 }, async (req) => {
  const url = new URL(req.url);
  const [recurso, id] = url.pathname.split('/').filter(Boolean);
  const m = req.method;

  try {
    const corpo = m === 'POST' || m === 'PATCH' || m === 'PUT' ? await req.json().catch(() => ({})) : {};

    // ----- rotas públicas -----
    if (recurso === 'auth' && id === 'cadastro' && m === 'POST') {
      const u = await auth.cadastrar(String(corpo.nome ?? ''), String(corpo.email ?? ''), String(corpo.senha ?? ''));
      await repoFinanceiro.criarConta(u.id, 'Conta corrente', 0); // toda pessoa nova ganha uma conta
      return json(await auth.entrar(corpo.email, corpo.senha), 201);
    }
    if (recurso === 'auth' && id === 'login' && m === 'POST') {
      return json(await auth.entrar(String(corpo.email ?? ''), String(corpo.senha ?? '')));
    }

    // ----- rotas protegidas: exigem o token no cabeçalho Authorization -----
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const usuario = await auth.usuarioDoToken(token);
    if (!usuario) return json({ erro: 'Faça login para continuar.' }, 401);
    const uid = usuario.id;

    if (recurso === 'auth' && id === 'eu' && m === 'GET') return json(usuario);
    if (recurso === 'auth' && id === 'logout' && m === 'POST') { await auth.sair(token); return json({ ok: true }); }

    if (recurso === 'resumo' && m === 'GET') return json(await gestor.resumo(uid));
    if (recurso === 'relatorio' && m === 'GET') return json(await gestor.relatorio(uid, url.searchParams.get('mes') ?? ''));
    if (recurso === 'categorias' && m === 'GET') return json(CATEGORIAS);
    if (recurso === 'orcamentos' && id && m === 'PUT') {
      await gestor.definirOrcamento(uid, decodeURIComponent(id), Number(corpo.limite));
      return json({ ok: true });
    }
    if (recurso === 'contas' && m === 'GET') return json(await repoFinanceiro.listarContas(uid));
    if (recurso === 'contas' && m === 'POST') {
      if (!String(corpo.nome ?? '').trim()) throw new Error('Informe o nome da conta.');
      return json({ id: await repoFinanceiro.criarConta(uid, corpo.nome.trim(), Number(corpo.saldoInicial ?? 0)) }, 201);
    }
    if (recurso === 'lancamentos' && !id && m === 'GET') return json(await gestor.listar(uid));
    if (recurso === 'lancamentos' && !id && m === 'POST') {
      const ids = await gestor.criar(uid, Number(corpo.contaId), corpo.tipo, String(corpo.descricao ?? ''), Number(corpo.valor), String(corpo.vencimento ?? ''), String(corpo.categoria ?? ''), String(corpo.repetir ?? 'unica'), Number(corpo.vezes ?? 1));
      return json({ ids }, 201);
    }
    if (recurso === 'lancamentos' && id && m === 'PATCH') {
      if (corpo.etapa) await gestor.mover(uid, Number(id), corpo.etapa);
      else await gestor.editar(uid, Number(id), { contaId: Number(corpo.contaId), tipo: corpo.tipo, descricao: String(corpo.descricao ?? ''), valor: Number(corpo.valor), vencimento: String(corpo.vencimento ?? ''), categoria: String(corpo.categoria ?? '') });
      return json({ ok: true });
    }
    if (recurso === 'lancamentos' && id && m === 'DELETE') {
      await repoFinanceiro.removerLancamento(Number(id), uid);
      return new Response(null, { status: 204 });
    }
    return json({ erro: 'Rota não encontrada.' }, 404);
  } catch (e) {
    return json({ erro: (e as Error).message }, 400);
  }
});
