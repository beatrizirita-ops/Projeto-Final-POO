export { Dinheiro } from './dinheiro.ts';
export { Vencimento } from './vencimento.ts';
export { ContaBancaria } from './conta-bancaria.ts';

import { Dinheiro } from './dinheiro.ts';
import { Vencimento } from './vencimento.ts';

// ===== Tipos (Aula 8: union types) =====
export type Tipo = 'receita' | 'despesa' | 'boleto';
export type Etapa = 'pendente' | 'agendado' | 'pago'; // colunas do kanban
export const ETAPAS: readonly Etapa[] = ['pendente', 'agendado', 'pago'];
export const CATEGORIAS = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Salário', 'Outros'] as const;
export type Categoria = typeof CATEGORIAS[number];

// ===== Interface + polimorfismo (Aula 6) =====
export interface Lancamento {
  readonly tipo: Tipo;
  readonly descricao: string;
  readonly valor: Dinheiro;
  readonly vencimento: Vencimento;
  valorAtualizado(hoje: Date): Dinheiro; // cada tipo calcula do seu jeito
  efeitoNoSaldo(hoje: Date): Dinheiro;   // + entra dinheiro, - sai dinheiro
}

export class Receita implements Lancamento {
  readonly tipo = 'receita';
  constructor(
    public readonly descricao: string,
    public readonly valor: Dinheiro,
    public readonly vencimento: Vencimento,
  ) {}
  valorAtualizado(): Dinheiro { return this.valor; }
  efeitoNoSaldo(): Dinheiro { return this.valor; }
}

export class Despesa implements Lancamento {
  readonly tipo = 'despesa';
  constructor(
    public readonly descricao: string,
    public readonly valor: Dinheiro,
    public readonly vencimento: Vencimento,
  ) {}
  valorAtualizado(): Dinheiro { return this.valor; }
  efeitoNoSaldo(): Dinheiro { return Dinheiro.ZERO.subtrair(this.valor); }
}

// Boleto vencido paga multa de 2% + juros de 0,033% ao dia
export class Boleto implements Lancamento {
  readonly tipo = 'boleto';
  constructor(
    public readonly descricao: string,
    public readonly valor: Dinheiro,
    public readonly vencimento: Vencimento,
  ) {}

  valorAtualizado(hoje: Date): Dinheiro {
    const dias = this.vencimento.diasAte(hoje);
    if (dias === 0) return this.valor;
    const fatorMultaEJuros = 1 + 0.02 + 0.00033 * dias;
    return this.valor.multiplicar(fatorMultaEJuros);
  }

  efeitoNoSaldo(hoje: Date): Dinheiro {
    return Dinheiro.ZERO.subtrair(this.valorAtualizado(hoje));
  }
}

// Valida os dados e escolhe a classe certa (regra de negócio no domínio)
export function criarLancamento(
  tipo: Tipo,
  descricao: string,
  valor: number | Dinheiro,
  vencimento: string | Vencimento,
): Lancamento {
  if (!descricao.trim()) throw new Error('Informe a descrição.');

  const vlr = valor instanceof Dinheiro ? valor : Dinheiro.deReais(valor);
  if (vlr.ehNegativo() || vlr.ehZero()) throw new Error('O valor deve ser maior que zero.');

  const venc = vencimento instanceof Vencimento ? vencimento : Vencimento.deISO(vencimento);

  switch (tipo) {
    case 'receita': return new Receita(descricao.trim(), vlr, venc);
    case 'despesa': return new Despesa(descricao.trim(), vlr, venc);
    case 'boleto': return new Boleto(descricao.trim(), vlr, venc);
    default: throw new Error('Tipo inválido.');
  }
}

// ===== Recorrência: outra interface com polimorfismo (Aula 6) =====
export interface Recorrencia { dataDaParcela(inicial: string, indice: number): string }
const fmtData = (d: Date) => d.toLocaleDateString('sv-SE');

export class Unica implements Recorrencia {
  dataDaParcela(inicial: string): string { return inicial; }
}
export class Semanal implements Recorrencia {
  dataDaParcela(inicial: string, n: number): string {
    return Vencimento.deISO(inicial).adicionarDias(7 * n).formatarISO();
  }
}
export class Mensal implements Recorrencia {
  dataDaParcela(inicial: string, n: number): string {
    return Vencimento.deISO(inicial).adicionarMeses(n).formatarISO();
  }
}
export function criarRecorrencia(tipo: string): Recorrencia {
  switch (tipo) {
    case 'mensal': return new Mensal();
    case 'semanal': return new Semanal();
    default: return new Unica();
  }
}

// ===== Encapsulamento (Aula 3): o saldo só muda por aplicar() e é protegido por Dinheiro =====
export class Conta {
  private saldo: Dinheiro;

  constructor(
    public readonly id: number,
    public readonly nome: string,
    saldoInicial: number | Dinheiro,
  ) {
    this.saldo = saldoInicial instanceof Dinheiro ? saldoInicial : Dinheiro.deReais(saldoInicial);
  }

  getSaldo(): number {
    return this.saldo.emReais();
  }

  getSaldoDinheiro(): Dinheiro {
    return this.saldo;
  }

  aplicar(lancamento: Lancamento, hoje: Date): void {
    const efeito = lancamento.efeitoNoSaldo(hoje);
    const novoSaldo = this.saldo.somar(efeito);
    if (novoSaldo.ehNegativo()) {
      throw new Error(`Saldo insuficiente na conta ${this.nome}.`);
    }
    this.saldo = novoSaldo;
  }
}

// ===== DTOs: só dados, para gravar no banco e enviar como JSON (Aula 9) =====
export interface ContaData { id: number; nome: string; saldo: number }
export interface LancamentoData {
  id: number; contaId: number; tipo: Tipo; descricao: string;
  valor: number; vencimento: string; etapa: Etapa;
  categoria: Categoria;
  valorPago: number | null; // quanto saiu de fato (um boleto pago em atraso inclui juros)
}
export interface OrcamentoData { categoria: string; limite: number }
export type LancamentoView = LancamentoData & { valorAtualizado: number; vencido: boolean };

// ===== Repository (Aulas 9 e 10): contrato assíncrono. Todo dado pertence a um usuário =====
export interface FinanceiroRepository {
  listarContas(usuarioId: number): Promise<ContaData[]>;
  criarConta(usuarioId: number, nome: string, saldoInicial: number): Promise<number>;
  listarLancamentos(usuarioId: number): Promise<LancamentoData[]>;
  buscarLancamento(id: number, usuarioId: number): Promise<LancamentoData | undefined>;
  criarLancamento(dados: Omit<LancamentoData, 'id'>): Promise<number>;
  moverEtapa(id: number, etapa: Etapa): Promise<void>;
  efetivarPagamento(lancamentoId: number, contaId: number, novoSaldo: number, valorPago: number): Promise<void>;
  removerLancamento(id: number, usuarioId: number): Promise<void>;
  atualizarLancamento(id: number, d: Pick<LancamentoData, 'contaId' | 'tipo' | 'descricao' | 'valor' | 'vencimento' | 'categoria'>): Promise<void>;
  listarOrcamentos(usuarioId: number): Promise<OrcamentoData[]>;
  definirOrcamento(usuarioId: number, categoria: string, limite: number): Promise<void>;
}

const hojeISO = (d: Date) => d.toLocaleDateString('sv-SE'); // yyyy-mm-dd no fuso local
const arred = (n: number) => Math.round(n * 100) / 100;

// ===== Serviço: recebe o repository por injeção de dependência =====
export class GestorFinanceiro {
  constructor(private readonly repo: FinanceiroRepository) {}

  async listar(uid: number): Promise<LancamentoView[]> {
    const hoje = new Date();
    return (await this.repo.listarLancamentos(uid)).map((d) => {
      const obj = criarLancamento(d.tipo, d.descricao, d.valor, d.vencimento);
      return {
        ...d,
        valorAtualizado: d.valorPago ?? obj.valorAtualizado(hoje).emReais(),
        vencido: d.etapa !== 'pago' && obj.vencimento.estaVencido(hoje),
      };
    });
  }

  private categoriaValida(c: string): Categoria {
    return (CATEGORIAS as readonly string[]).includes(c) ? (c as Categoria) : 'Outros';
  }

  // repetir = 'unica' | 'mensal' | 'semanal'; gera todas as parcelas de uma vez
  async criar(uid: number, contaId: number, tipo: Tipo, descricao: string, valor: number, vencimento: string, categoria: string, repetir = 'unica', vezes = 1): Promise<number[]> {
    criarLancamento(tipo, descricao, valor, vencimento); // só para validar
    if (!(await this.repo.listarContas(uid)).some((c) => c.id === contaId)) throw new Error('Conta não encontrada.');
    const regra = criarRecorrencia(repetir);
    const total = repetir === 'unica' ? 1 : Math.min(60, Math.max(1, Math.floor(vezes) || 1));
    const ids: number[] = [];
    for (let i = 0; i < total; i++) {
      ids.push(await this.repo.criarLancamento({
        contaId, tipo, valor, etapa: 'pendente', categoria: this.categoriaValida(categoria), valorPago: null,
        descricao: total > 1 ? `${descricao.trim()} (${i + 1}/${total})` : descricao.trim(),
        vencimento: regra.dataDaParcela(vencimento, i),
      }));
    }
    return ids;
  }

  async editar(uid: number, id: number, d: { contaId: number; tipo: Tipo; descricao: string; valor: number; vencimento: string; categoria: string }): Promise<void> {
    const atual = await this.repo.buscarLancamento(id, uid);
    if (!atual) throw new Error('Lançamento não encontrado.');
    if (atual.etapa === 'pago') throw new Error('Lançamento pago não pode ser editado.');
    criarLancamento(d.tipo, d.descricao, d.valor, d.vencimento); // valida
    if (!(await this.repo.listarContas(uid)).some((c) => c.id === d.contaId)) throw new Error('Conta não encontrada.');
    await this.repo.atualizarLancamento(id, { ...d, descricao: d.descricao.trim(), categoria: this.categoriaValida(d.categoria) });
  }

  async definirOrcamento(uid: number, categoria: string, limite: number): Promise<void> {
    if (!(CATEGORIAS as readonly string[]).includes(categoria) || categoria === 'Salário') throw new Error('Categoria inválida para orçamento.');
    if (!Number.isFinite(limite) || limite < 0) throw new Error('O limite deve ser zero ou maior (zero remove o limite).');
    await this.repo.definirOrcamento(uid, categoria, limite);
  }

  async mover(uid: number, id: number, etapa: Etapa): Promise<void> {
    if (!ETAPAS.includes(etapa)) throw new Error('Etapa inválida.');
    const d = await this.repo.buscarLancamento(id, uid); // só acha se for do usuário
    if (!d) throw new Error('Lançamento não encontrado.');
    if (d.etapa === etapa) return;
    if (d.etapa === 'pago') throw new Error('Lançamento já pago não pode voltar de etapa.');
    if (etapa !== 'pago') return this.repo.moverEtapa(id, etapa);

    // Pagar: aplica na conta e grava tudo em uma transação
    const dc = (await this.repo.listarContas(uid)).find((c) => c.id === d.contaId);
    if (!dc) throw new Error('Conta não encontrada.');
    const conta = new Conta(dc.id, dc.nome, dc.saldo);
    const agora = new Date();
    const lanc = criarLancamento(d.tipo, d.descricao, d.valor, d.vencimento);
    conta.aplicar(lanc, agora);
    await this.repo.efetivarPagamento(id, conta.id, conta.getSaldo(), lanc.valorAtualizado(agora).emReais());
  }

  async resumo(uid: number) {
    const [contas, lancs] = await Promise.all([this.repo.listarContas(uid), this.listar(uid)]);
    const abertos = lancs.filter((l) => l.etapa !== 'pago');
    const hoje = new Date();
    const em7Dias = Vencimento.deDate(hoje).adicionarDias(7).formatarISO();

    const saldoTotal = contas.reduce((acc, c) => acc.somar(Dinheiro.deReais(c.saldo)), Dinheiro.ZERO);
    const aReceber = abertos
      .filter((l) => l.tipo === 'receita')
      .reduce((acc, l) => acc.somar(Dinheiro.deReais(l.valor)), Dinheiro.ZERO);
    const aPagar = abertos
      .filter((l) => l.tipo !== 'receita')
      .reduce((acc, l) => acc.somar(Dinheiro.deReais(l.valorAtualizado)), Dinheiro.ZERO);

    return {
      saldoTotal: saldoTotal.emReais(),
      aReceber: aReceber.emReais(),
      aPagar: aPagar.emReais(),
      vencidos: abertos.filter((l) => l.vencido).length,
      vencemEm7Dias: abertos.filter((l) => !l.vencido && l.vencimento <= em7Dias).length,
    };
  }

  // Relatório do mês (AAAA-MM): considera os lançamentos que vencem nesse mês
  async relatorio(uid: number, mes: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new Error('Mês inválido. Use o formato AAAA-MM.');
    const todos = await this.listar(uid);
    const limites = new Map((await this.repo.listarOrcamentos(uid)).map((o) => [o.categoria, o.limite]));
    const doMes = (m: string) => todos.filter((l) => l.vencimento.startsWith(m));
    const soma = (itens: LancamentoView[]) => arred(itens.reduce((s, l) => s + l.valorAtualizado, 0));
    const pago = (l: LancamentoView) => l.etapa === 'pago';
    const lancs = doMes(mes);
    const saidas = lancs.filter((l) => l.tipo !== 'receita');
    const [ano, n] = mes.split('-').map(Number);
    const anterior = n === 1 ? `${ano - 1}-12` : `${ano}-${String(n - 1).padStart(2, '0')}`;
    const totalSaidas = soma(saidas);
    const grupos = new Map<string, number>();
    for (const l of saidas) grupos.set(l.categoria, (grupos.get(l.categoria) ?? 0) + l.valorAtualizado);
    for (const c of limites.keys()) if (!grupos.has(c)) grupos.set(c, 0); // categoria com limite aparece mesmo sem gasto
    const entradas = soma(lancs.filter((l) => l.tipo === 'receita' && pago(l)));
    const saidasPagas = soma(saidas.filter(pago));
    return {
      mes,
      entradas,
      saidas: saidasPagas,
      resultado: arred(entradas - saidasPagas),
      previstoEntradas: soma(lancs.filter((l) => l.tipo === 'receita' && !pago(l))),
      previstoSaidas: soma(saidas.filter((l) => !pago(l))),
      totalSaidas,
      saidasMesAnterior: soma(doMes(anterior).filter((l) => l.tipo !== 'receita')),
      porCategoria: [...grupos]
        .map(([categoria, total]) => ({
          categoria, total: arred(total), percentual: totalSaidas ? Math.round((total / totalSaidas) * 100) : 0,
          limite: limites.get(categoria) ?? null, estourou: limites.has(categoria) && total > limites.get(categoria)!,
        }))
        .sort((a, b) => b.total - a.total),
      maiores: [...saidas].sort((a, b) => b.valorAtualizado - a.valorAtualizado).slice(0, 5)
        .map((l) => ({ descricao: l.descricao, categoria: l.categoria, valor: l.valorAtualizado, etapa: l.etapa })),
    };
  }
}
