// ===== Value Object: Vencimento (Encapsulamento de Datas e Prazos) =====
export class Vencimento {
  private readonly data: Date;

  private constructor(data: Date) {
    this.data = new Date(data.getTime());
  }

  static deISO(dataISO: string): Vencimento {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) {
      throw new Error('Data de vencimento inválida. Use o formato YYYY-MM-DD.');
    }

    const [ano, mes, dia] = dataISO.split('-').map(Number);
    const d = new Date(ano, mes - 1, dia);

    // Valida se a data realmente existe no calendário (ex: 2026-02-31 é inválido)
    if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) {
      throw new Error('Data de vencimento inexistente no calendário.');
    }

    return new Vencimento(d);
  }

  static deDate(data: Date): Vencimento {
    const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    return new Vencimento(d);
  }

  formatarISO(): string {
    const ano = this.data.getFullYear();
    const mes = String(this.data.getMonth() + 1).padStart(2, '0');
    const dia = String(this.data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  estaVencido(emData: Date = new Date()): boolean {
    const hojeZero = new Date(emData.getFullYear(), emData.getMonth(), emData.getDate()).getTime();
    return this.data.getTime() < hojeZero;
  }

  // Retorna a quantidade de dias de atraso decorridos em relação à data informada (mínimo 0)
  diasAte(emData: Date = new Date()): number {
    const hojeZero = new Date(emData.getFullYear(), emData.getMonth(), emData.getDate()).getTime();
    const diffMs = hojeZero - this.data.getTime();
    if (diffMs <= 0) return 0;
    return Math.floor(diffMs / 86_400_000);
  }

  adicionarDias(dias: number): Vencimento {
    const nova = new Date(this.data.getTime());
    nova.setDate(nova.getDate() + dias);
    return new Vencimento(nova);
  }

  adicionarMeses(meses: number): Vencimento {
    const ano = this.data.getFullYear();
    const mes = this.data.getMonth();
    const dia = this.data.getDate();

    const totalMeses = mes + meses;
    const novoAno = ano + Math.floor(totalMeses / 12);
    const novoMes = ((totalMeses % 12) + 12) % 12;

    // Garante que dia 31 em mês curto caia no último dia daquele mês
    const ultimoDiaDoMes = new Date(novoAno, novoMes + 1, 0).getDate();
    const diaAjustado = Math.min(dia, ultimoDiaDoMes);

    return new Vencimento(new Date(novoAno, novoMes, diaAjustado));
  }

  ehIgualA(outro: Vencimento): boolean {
    return this.data.getTime() === outro.data.getTime();
  }
}

