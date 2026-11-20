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
