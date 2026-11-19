// ===== Value Object: Dinheiro (Encapsulamento e Imutabilidade) =====
export class Dinheiro {
  private readonly centavos: number;

  private constructor(centavos: number) {
    if (!Number.isFinite(centavos)) {
      throw new Error('Valor monetário inválido.');
    }
    this.centavos = Math.round(centavos);
  }

  static readonly ZERO = new Dinheiro(0);

  static deReais(valor: number): Dinheiro {
    if (!Number.isFinite(valor)) {
      throw new Error('O valor em reais deve ser um número finito.');
    }
    return new Dinheiro(Math.round(valor * 100));
  }

  static deCentavos(centavos: number): Dinheiro {
    return new Dinheiro(centavos);
  }

  somar(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this.centavos + outro.centavos);
  }

  subtrair(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this.centavos - outro.centavos);
  }

  multiplicar(fator: number): Dinheiro {
    if (!Number.isFinite(fator)) {
      throw new Error('O fator de multiplicação deve ser um número válido.');
    }
    return new Dinheiro(Math.round(this.centavos * fator));
  }

  emReais(): number {
    return this.centavos / 100;
  }

  emCentavos(): number {
    return this.centavos;
  }

  formatar(): string {
    return this.emReais().toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  menorQue(outro: Dinheiro): boolean {
    return this.centavos < outro.centavos;
  }

  maiorQue(outro: Dinheiro): boolean {
    return this.centavos > outro.centavos;
  }

  igualA(outro: Dinheiro): boolean {
    return this.centavos === outro.centavos;
  }

  ehNegativo(): boolean {
    return this.centavos < 0;
  }

  ehZero(): boolean {
    return this.centavos === 0;
  }
}

