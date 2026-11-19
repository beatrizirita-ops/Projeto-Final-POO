import { prisma } from './prisma.ts';
import type { ContaData, Etapa, FinanceiroRepository, LancamentoData, OrcamentoData } from './dominio.ts';
import type { UsuarioData, UsuarioRepository } from './auth.ts';

// ==========================================
// 1. Repositório de Usuários com Prisma ORM
// ==========================================
export class PrismaUsuarioRepository implements UsuarioRepository {
  async criarUsuario(nome: string, email: string, senhaHash: string): Promise<number> {
    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash,
      },
    });
    return usuario.id;
  }

  async buscarPorEmail(email: string): Promise<(UsuarioData & { senhaHash: string }) | undefined> {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });
    if (!usuario) return undefined;
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      senhaHash: usuario.senhaHash,
    };
  }

  async criarSessao(token: string, usuarioId: number, expiraEm: number): Promise<void> {
    await prisma.sessao.create({
      data: {
        token,
        usuarioId,
        expiraEm: BigInt(expiraEm),
      },
    });
  }

  async buscarPorToken(token: string, agora: number): Promise<UsuarioData | undefined> {
    const sessao = await prisma.sessao.findUnique({
      where: { token },
      include: { usuario: true },
    });

    if (!sessao || Number(sessao.expiraEm) <= agora) {
      return undefined;
    }

    return {
      id: sessao.usuario.id,
      nome: sessao.usuario.nome,
      email: sessao.usuario.email,
    };
  }

  async removerSessao(token: string): Promise<void> {
    await prisma.sessao.deleteMany({
      where: { token },
    });
  }
}

// ==========================================
// 2. Repositório Financeiro com Prisma ORM
// ==========================================
export class PrismaFinanceiroRepository implements FinanceiroRepository {
  async listarContas(usuarioId: number): Promise<ContaData[]> {
    const contas = await prisma.conta.findMany({
      where: { usuarioId },
      orderBy: { id: 'asc' },
    });
    return contas.map((c) => ({
      id: c.id,
      nome: c.nome,
      saldo: c.saldo,
      tipo: c.tipo,
      limiteCredito: c.limiteCredito,
      taxaCashback: c.taxaCashback,
      diaAniversario: c.diaAniversario,
    }));
  }

  async criarConta(usuarioId: number, nome: string, saldoInicial: number): Promise<number> {
    const conta = await prisma.conta.create({
      data: {
        usuarioId,
        nome,
        saldo: saldoInicial,
      },
    });
    return conta.id;
  }

  async listarLancamentos(usuarioId: number): Promise<LancamentoData[]> {
    const lancamentos = await prisma.lancamento.findMany({
      where: {
        conta: {
          usuarioId,
        },
      },
      orderBy: [{ vencimento: 'asc' }, { id: 'asc' }],
    });

    return lancamentos.map((l) => ({
      id: l.id,
      contaId: l.contaId,
      tipo: l.tipo as LancamentoData['tipo'],
      descricao: l.descricao,
      valor: l.valor,
      vencimento: l.vencimento,
      etapa: l.etapa as Etapa,
      categoria: l.categoria as LancamentoData['categoria'],
      valorPago: l.valorPago,
    }));
  }

  async buscarLancamento(id: number, usuarioId: number): Promise<LancamentoData | undefined> {
    const l = await prisma.lancamento.findFirst({
      where: {
        id,
        conta: {
          usuarioId,
        },
      },
    });
    if (!l) return undefined;
    return {
      id: l.id,
      contaId: l.contaId,
      tipo: l.tipo as LancamentoData['tipo'],
      descricao: l.descricao,
      valor: l.valor,
      vencimento: l.vencimento,
      etapa: l.etapa as Etapa,
      categoria: l.categoria as LancamentoData['categoria'],
      valorPago: l.valorPago,
    };
  }

  async criarLancamento(d: Omit<LancamentoData, 'id'>): Promise<number> {
    const l = await prisma.lancamento.create({
      data: {
        contaId: d.contaId,
        tipo: d.tipo,
        descricao: d.descricao,
        valor: d.valor,
        vencimento: d.vencimento,
        etapa: d.etapa,
        categoria: d.categoria,
        valorPago: d.valorPago,
      },
    });
    return l.id;
  }

  async moverEtapa(id: number, etapa: Etapa): Promise<void> {
    await prisma.lancamento.update({
      where: { id },
      data: { etapa },
    });
  }

  // Transação Atômica: garante que o saldo e a etapa mudem juntos usando prisma.$transaction
  async efetivarPagamento(lancamentoId: number, contaId: number, novoSaldo: number, valorPago: number): Promise<void> {
    await prisma.$transaction([
      prisma.conta.update({
        where: { id: contaId },
        data: { saldo: novoSaldo },
      }),
      prisma.lancamento.update({
        where: { id: lancamentoId },
        data: { etapa: 'pago', valorPago },
      }),
    ]);
  }

  async atualizarLancamento(
    id: number,
    d: Pick<LancamentoData, 'contaId' | 'tipo' | 'descricao' | 'valor' | 'vencimento' | 'categoria'>,
  ): Promise<void> {
    await prisma.lancamento.updateMany({
      where: { id, etapa: { not: 'pago' } },
      data: {
        contaId: d.contaId,
        tipo: d.tipo,
        descricao: d.descricao,
        valor: d.valor,
        vencimento: d.vencimento,
        categoria: d.categoria,
      },
    });
  }

  async listarOrcamentos(usuarioId: number): Promise<OrcamentoData[]> {
    const orcamentos = await prisma.orcamento.findMany({
      where: { usuarioId },
    });
    return orcamentos.map((o) => ({ categoria: o.categoria, limite: o.limite }));
  }

  async definirOrcamento(usuarioId: number, categoria: string, limite: number): Promise<void> {
    if (limite === 0) {
      await prisma.orcamento.deleteMany({
        where: { usuarioId, categoria },
      });
      return;
    }

    await prisma.orcamento.upsert({
      where: {
        usuarioId_categoria: {
          usuarioId,
          categoria,
        },
      },
      create: {
        usuarioId,
        categoria,
        limite,
      },
      update: {
        limite,
      },
    });
  }

  async removerLancamento(id: number, usuarioId: number): Promise<void> {
    await prisma.lancamento.deleteMany({
      where: {
        id,
        conta: {
          usuarioId,
        },
      },
    });
  }
}
