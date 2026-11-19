import { Dinheiro } from './dinheiro.ts';
import type { Lancamento } from './dominio.ts';

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
