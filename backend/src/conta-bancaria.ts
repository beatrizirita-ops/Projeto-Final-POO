import { Dinheiro } from './dinheiro.ts';
import type { ContaData, Lancamento } from './dominio.ts';

// ===== Classe Abstrata: ContaBancaria (Base da Hierarquia POO) =====
export abstract class ContaBancaria {
  protected saldo: Dinheiro;

  constructor(
    public readonly id: number,
    public readonly nome: string,
    saldoInicial: number | Dinheiro,
    public readonly usuarioId?: number,
  ) {
    this.saldo = saldoInicial instanceof Dinheiro ? saldoInicial : Dinheiro.deReais(saldoInicial);
  }

  getSaldo(): number {
    return this.saldo.emReais();
  }

  getSaldoDinheiro(): Dinheiro {
    return this.saldo;
  }

  creditar(quantia: Dinheiro): void {
    if (quantia.ehNegativo()) {
      throw new Error('A quantia para crédito deve ser positiva.');
    }
    this.saldo = this.saldo.somar(quantia);
  }

  debitar(quantia: Dinheiro): void {
    if (quantia.ehNegativo()) {
      throw new Error('A quantia para débito deve ser positiva.');
    }
    const novoSaldo = this.saldo.subtrair(quantia);
    if (novoSaldo.ehNegativo()) {
      throw new Error(`Saldo insuficiente na conta ${this.nome}.`);
    }
    this.saldo = novoSaldo;
  }

  // Método polimórfico abstrato: cada subclasse implementará sua própria regra
  abstract aplicar(lancamento: Lancamento, dataOperacao: Date): void;
}

// ===== Subclasse: ContaCorrente =====
export class ContaCorrente extends ContaBancaria {
  aplicar(lancamento: Lancamento, dataOperacao: Date): void {
    const efeito = lancamento.efeitoNoSaldo(dataOperacao);
    if (efeito.ehNegativo()) {
      this.debitar(Dinheiro.ZERO.subtrair(efeito));
    } else {
      this.creditar(efeito);
    }
  }
}

// ===== Subclasse: ContaPoupanca =====
export class ContaPoupanca extends ContaBancaria {
  private readonly diaAniversario: number;
  private readonly taxaRendimento: number;

  constructor(
    id: number,
    nome: string,
    saldoInicial: number | Dinheiro,
    usuarioId?: number,
    diaAniversario = 15,
    taxaRendimento = 0.005, // 0,5% ao mês
  ) {
    super(id, nome, saldoInicial, usuarioId);
    this.diaAniversario = diaAniversario;
    this.taxaRendimento = taxaRendimento;
  }

  aplicar(lancamento: Lancamento, dataOperacao: Date): void {
    const efeito = lancamento.efeitoNoSaldo(dataOperacao);
    if (efeito.ehNegativo()) {
      this.debitar(Dinheiro.ZERO.subtrair(efeito));
    } else {
      this.creditar(efeito);
    }
  }

  render(dataAtual: Date): Dinheiro {
    if (dataAtual.getDate() !== this.diaAniversario || this.saldo.ehNegativo() || this.saldo.ehZero()) {
      return Dinheiro.ZERO;
    }
    const rendimento = this.saldo.multiplicar(this.taxaRendimento);
    this.creditar(rendimento);
    return rendimento;
  }
}

// ===== Subclasse: CartaoCredito =====
export class CartaoCredito extends ContaBancaria {
  private readonly limite: Dinheiro;
  private faturaAtual: Dinheiro;
  private cashbackAcumulado: Dinheiro;
  private readonly taxaCashback: number;

  constructor(
    id: number,
    nome: string,
    limite: number | Dinheiro,
    usuarioId?: number,
    taxaCashback = 0.01, // 1% de cashback
    faturaInicial: number | Dinheiro = 0,
    cashbackInicial: number | Dinheiro = 0,
  ) {
    const lim = limite instanceof Dinheiro ? limite : Dinheiro.deReais(limite);
    const fat = faturaInicial instanceof Dinheiro ? faturaInicial : Dinheiro.deReais(faturaInicial);
    super(id, nome, lim.subtrair(fat), usuarioId);
    this.limite = lim;
    this.faturaAtual = fat;
    this.cashbackAcumulado = cashbackInicial instanceof Dinheiro ? cashbackInicial : Dinheiro.deReais(cashbackInicial);
    this.taxaCashback = taxaCashback;
  }

  getLimite(): Dinheiro {
    return this.limite;
  }

  getFaturaAtual(): Dinheiro {
    return this.faturaAtual;
  }

  getCashbackAcumulado(): Dinheiro {
    return this.cashbackAcumulado;
  }

  aplicar(lancamento: Lancamento, dataOperacao: Date): void {
    const efeito = lancamento.efeitoNoSaldo(dataOperacao);
    if (efeito.ehNegativo()) {
      const valorCompra = Dinheiro.ZERO.subtrair(efeito);
      const novaFatura = this.faturaAtual.somar(valorCompra);
      if (novaFatura.maiorQue(this.limite)) {
        throw new Error(`Limite insuficiente no cartão ${this.nome}.`);
      }
      this.faturaAtual = novaFatura;
      const cashback = valorCompra.multiplicar(this.taxaCashback);
      this.cashbackAcumulado = this.cashbackAcumulado.somar(cashback);
      this.saldo = this.limite.subtrair(this.faturaAtual);
    } else {
      const novaFatura = this.faturaAtual.subtrair(efeito);
      this.faturaAtual = novaFatura.ehNegativo() ? Dinheiro.ZERO : novaFatura;
      this.saldo = this.limite.subtrair(this.faturaAtual);
    }
  }

  resgatarCashback(paraConta: ContaBancaria): Dinheiro {
    if (this.cashbackAcumulado.ehZero()) {
      return Dinheiro.ZERO;
    }
    const valorResgatado = this.cashbackAcumulado;
    paraConta.creditar(valorResgatado);
    this.cashbackAcumulado = Dinheiro.ZERO;
    return valorResgatado;
  }
}

// ===== Factory Polimórfica de Contas =====
export function criarContaBancaria(d: ContaData): ContaBancaria {
  switch (d.tipo) {
    case 'POUPANCA':
      return new ContaPoupanca(
        d.id,
        d.nome,
        d.saldo,
        undefined,
        d.diaAniversario ?? 15,
      );
    case 'CARTAO': {
      const limite = d.limiteCredito ?? d.saldo;
      const fatura = Math.max(0, limite - d.saldo);
      return new CartaoCredito(
        d.id,
        d.nome,
        limite,
        undefined,
        d.taxaCashback ?? 0.01,
        fatura,
      );
    }
    case 'CORRENTE':
    default:
      return new ContaCorrente(d.id, d.nome, d.saldo);
  }
}
