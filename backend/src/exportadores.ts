import { Dinheiro } from './dinheiro.ts';

// ===== Interfaces de Exportação de Relatório (Abstração e Polimorfismo) =====
export interface DadosRelatorioMes {
  readonly mes: string;
  readonly entradas: number;
  readonly saidas: number;
  readonly resultado: number;
  readonly previstoEntradas: number;
  readonly previstoSaidas: number;
  readonly totalSaidas: number;
  readonly saidasMesAnterior: number;
  readonly porCategoria: ReadonlyArray<{
    readonly categoria: string;
    readonly total: number;
    readonly percentual: number;
    readonly limite: number | null;
    readonly estourou: boolean;
  }>;
  readonly maiores: ReadonlyArray<{
    readonly descricao: string;
    readonly categoria: string;
    readonly valor: number;
    readonly etapa: string;
  }>;
}

export interface ConteudoExportado {
  readonly conteudo: string;
  readonly mimeType: string;
  readonly extensao: string;
}

export interface ExportadorRelatorio {
  exportar(dados: DadosRelatorioMes): ConteudoExportado;
}

const fmtBRL = (valor: number) => Dinheiro.deReais(valor).formatar();

// ===== Implementação Polimórfica 1: ExportadorCsv =====
export class ExportadorCsv implements ExportadorRelatorio {
  exportar(dados: DadosRelatorioMes): ConteudoExportado {
    const linhas: string[] = [
      `Relatório Financeiro;${dados.mes}`,
      '',
      'Resumo do Período;Valor',
      `Entradas Pagas;${fmtBRL(dados.entradas)}`,
      `Saídas Pagas;${fmtBRL(dados.saidas)}`,
      `Resultado;${fmtBRL(dados.resultado)}`,
      `Previsto Entradas;${fmtBRL(dados.previstoEntradas)}`,
      `Previsto Saídas;${fmtBRL(dados.previstoSaidas)}`,
      `Total Saídas;${fmtBRL(dados.totalSaidas)}`,
      '',
      'Categoria;Total;Percentual;Limite;Estourou',
      ...dados.porCategoria.map((c) =>
        [
          c.categoria,
          fmtBRL(c.total),
          `${c.percentual}%`,
          c.limite !== null ? fmtBRL(c.limite) : '-',
          c.estourou ? 'Sim' : 'Não',
        ].join(';')
      ),
      '',
      'Maiores Gastos;Categoria;Valor;Etapa',
      ...dados.maiores.map((m) =>
        [m.descricao, m.categoria, fmtBRL(m.valor), m.etapa].join(';')
      ),
    ];

    return {
      conteudo: '\uFEFF' + linhas.join('\r\n'),
      mimeType: 'text/csv;charset=utf-8',
      extensao: 'csv',
    };
  }
}

// ===== Implementação Polimórfica 2: ExportadorJson =====
export class ExportadorJson implements ExportadorRelatorio {
  exportar(dados: DadosRelatorioMes): ConteudoExportado {
    const payload = {
      metadados: {
        mes: dados.mes,
        geradoEm: new Date().toISOString(),
        formato: 'json',
      },
      resumo: {
        entradas: dados.entradas,
        saidas: dados.saidas,
        resultado: dados.resultado,
        previstoEntradas: dados.previstoEntradas,
        previstoSaidas: dados.previstoSaidas,
        totalSaidas: dados.totalSaidas,
        saidasMesAnterior: dados.saidasMesAnterior,
      },
      porCategoria: dados.porCategoria,
      maioresGastos: dados.maiores,
    };

    return {
      conteudo: JSON.stringify(payload, null, 2),
      mimeType: 'application/json;charset=utf-8',
      extensao: 'json',
    };
  }
}
