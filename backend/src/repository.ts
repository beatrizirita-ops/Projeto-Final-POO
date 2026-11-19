import { DatabaseSync } from 'node:sqlite';
import { prisma } from './prisma.ts';
import type { ContaData, Etapa, FinanceiroRepository, LancamentoData, OrcamentoData } from './dominio.ts';
import type { UsuarioData, UsuarioRepository } from './auth.ts';

const COLUNAS = 'l.id, l.conta_id AS contaId, l.tipo, l.descricao, l.valor, l.vencimento, l.etapa, l.categoria, l.valor_pago AS valorPago';

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
    return contas.map((c) => ({ id: c.id, nome: c.nome, saldo: c.saldo }));
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

  // Transação Atômica com Prisma: saldo e etapa são atualizados juntos
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

// ==========================================
// 3. Classe SQLite Legada (para compatibilidade temporária)
// ==========================================
export class SqliteRepository implements FinanceiroRepository, UsuarioRepository {
  private readonly db: DatabaseSync;

  constructor(arquivo: string) {
    this.db = new DatabaseSync(arquivo);
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessoes (
        token TEXT PRIMARY KEY,
        usuario_id INTEGER NOT NULL,
        expira_em INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      );
      CREATE TABLE IF NOT EXISTS orcamentos (
        usuario_id INTEGER NOT NULL,
        categoria TEXT NOT NULL,
        limite REAL NOT NULL,
        PRIMARY KEY (usuario_id, categoria),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      );
      CREATE TABLE IF NOT EXISTS contas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        saldo REAL NOT NULL DEFAULT 0,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      );
      CREATE TABLE IF NOT EXISTS lancamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conta_id INTEGER NOT NULL,
        tipo TEXT NOT NULL,
        descricao TEXT NOT NULL,
        valor REAL NOT NULL,
        vencimento TEXT NOT NULL,
        etapa TEXT NOT NULL DEFAULT 'pendente',
        categoria TEXT NOT NULL DEFAULT 'Outros',
        valor_pago REAL,
        FOREIGN KEY (conta_id) REFERENCES contas(id)
      );
    `);
    for (const coluna of ["categoria TEXT NOT NULL DEFAULT 'Outros'", 'valor_pago REAL']) {
      try { this.db.exec(`ALTER TABLE lancamentos ADD COLUMN ${coluna}`); } catch { /* a coluna já existe */ }
    }
    try { this.db.exec('ALTER TABLE sessoes ADD COLUMN expira_em INTEGER NOT NULL DEFAULT 0'); } catch { /* já existe */ }
  }

  // ---------- usuários ----------
  async criarUsuario(nome: string, email: string, senhaHash: string): Promise<number> {
    const r = this.db.prepare('INSERT INTO usuarios (nome, email, senha_hash) VALUES (:nome, :email, :senhaHash)').run({ nome, email, senhaHash });
    return Number(r.lastInsertRowid);
  }

  async buscarPorEmail(email: string) {
    return this.db.prepare('SELECT id, nome, email, senha_hash AS senhaHash FROM usuarios WHERE email = :email')
      .get({ email }) as unknown as (UsuarioData & { senhaHash: string }) | undefined;
  }

  async criarSessao(token: string, usuarioId: number, expiraEm: number): Promise<void> {
    this.db.prepare('INSERT INTO sessoes (token, usuario_id, expira_em) VALUES (:token, :usuarioId, :expiraEm)').run({ token, usuarioId, expiraEm });
  }

  async buscarPorToken(token: string, agora: number): Promise<UsuarioData | undefined> {
    return this.db.prepare(
      'SELECT u.id, u.nome, u.email FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token = :token AND s.expira_em > :agora',
    ).get({ token, agora }) as unknown as UsuarioData | undefined;
  }

  async removerSessao(token: string): Promise<void> {
    this.db.prepare('DELETE FROM sessoes WHERE token = :token').run({ token });
  }

  // ---------- finanças (sempre filtradas pelo usuário) ----------
  async listarContas(usuarioId: number): Promise<ContaData[]> {
    return this.db.prepare('SELECT id, nome, saldo FROM contas WHERE usuario_id = :usuarioId ORDER BY id')
      .all({ usuarioId }) as unknown as ContaData[];
  }

  async criarConta(usuarioId: number, nome: string, saldoInicial: number): Promise<number> {
    const r = this.db.prepare('INSERT INTO contas (usuario_id, nome, saldo) VALUES (:usuarioId, :nome, :saldo)')
      .run({ usuarioId, nome, saldo: saldoInicial });
    return Number(r.lastInsertRowid);
  }

  async listarLancamentos(usuarioId: number): Promise<LancamentoData[]> {
    return this.db.prepare(
      `SELECT ${COLUNAS} FROM lancamentos l JOIN contas c ON c.id = l.conta_id
       WHERE c.usuario_id = :usuarioId ORDER BY l.vencimento, l.id`,
    ).all({ usuarioId }) as unknown as LancamentoData[];
  }

  async buscarLancamento(id: number, usuarioId: number): Promise<LancamentoData | undefined> {
    return this.db.prepare(
      `SELECT ${COLUNAS} FROM lancamentos l JOIN contas c ON c.id = l.conta_id
       WHERE l.id = :id AND c.usuario_id = :usuarioId`,
    ).get({ id, usuarioId }) as unknown as LancamentoData | undefined;
  }

  async criarLancamento(d: Omit<LancamentoData, 'id'>): Promise<number> {
    const r = this.db.prepare(
      `INSERT INTO lancamentos (conta_id, tipo, descricao, valor, vencimento, etapa, categoria, valor_pago)
       VALUES (:contaId, :tipo, :descricao, :valor, :vencimento, :etapa, :categoria, :valorPago)`,
    ).run({ ...d });
    return Number(r.lastInsertRowid);
  }

  async moverEtapa(id: number, etapa: Etapa): Promise<void> {
    this.db.prepare('UPDATE lancamentos SET etapa = :etapa WHERE id = :id').run({ etapa, id });
  }

  async efetivarPagamento(lancamentoId: number, contaId: number, novoSaldo: number, valorPago: number): Promise<void> {
    this.db.exec('BEGIN TRANSACTION');
    try {
      this.db.prepare('UPDATE contas SET saldo = :saldo WHERE id = :id').run({ saldo: novoSaldo, id: contaId });
      this.db.prepare("UPDATE lancamentos SET etapa = 'pago', valor_pago = :valorPago WHERE id = :id").run({ valorPago, id: lancamentoId });
      this.db.exec('COMMIT');
    } catch (erro) {
      this.db.exec('ROLLBACK');
      throw erro;
    }
  }

  async atualizarLancamento(id: number, d: Pick<LancamentoData, 'contaId' | 'tipo' | 'descricao' | 'valor' | 'vencimento' | 'categoria'>): Promise<void> {
    this.db.prepare(
      `UPDATE lancamentos SET conta_id = :contaId, tipo = :tipo, descricao = :descricao, valor = :valor,
       vencimento = :vencimento, categoria = :categoria WHERE id = :id AND etapa != 'pago'`,
    ).run({ ...d, id });
  }

  async listarOrcamentos(usuarioId: number): Promise<OrcamentoData[]> {
    return this.db.prepare('SELECT categoria, limite FROM orcamentos WHERE usuario_id = :usuarioId').all({ usuarioId }) as unknown as OrcamentoData[];
  }

  async definirOrcamento(usuarioId: number, categoria: string, limite: number): Promise<void> {
    if (limite === 0) {
      this.db.prepare('DELETE FROM orcamentos WHERE usuario_id = :usuarioId AND categoria = :categoria').run({ usuarioId, categoria });
      return;
    }
    this.db.prepare(
      `INSERT INTO orcamentos (usuario_id, categoria, limite) VALUES (:usuarioId, :categoria, :limite)
       ON CONFLICT(usuario_id, categoria) DO UPDATE SET limite = excluded.limite`,
    ).run({ usuarioId, categoria, limite });
  }

  async removerLancamento(id: number, usuarioId: number): Promise<void> {
    this.db.prepare(
      'DELETE FROM lancamentos WHERE id = :id AND conta_id IN (SELECT id FROM contas WHERE usuario_id = :usuarioId)',
    ).run({ id, usuarioId });
  }
}
