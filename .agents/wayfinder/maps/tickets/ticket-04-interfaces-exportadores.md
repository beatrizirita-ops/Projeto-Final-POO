# Ticket 04: Abstração e Polimorfismo para Exportadores de Relatório

- **Tipo**: `wayfinder:task`
- **Status**: [CONCLUÍDO]
- **Bloqueado por**: Nenhum

---

## 🎯 Objetivo
Aplicar os conceitos de **Interface e Polimorfismo** criando um subsistema de exportação de dados com múltiplos formatos de saída (CSV e JSON), desacoplando a geração do relatório do formato do arquivo.

---

## 📝 Requisitos de Implementação

1. **Interface de Contrato `ExportadorRelatorio`**:
   ```typescript
   export interface ConteudoExportado {
     readonly conteudo: string;
     readonly mimeType: string;
     readonly extensao: string;
   }

   export interface ExportadorRelatorio {
     exportar(dados: DadosRelatorioMes): ConteudoExportado;
   }
   ```

2. **Implementação `ExportadorCsv`**:
   - Gera o arquivo separado por `;` com codificação UTF-8 com BOM.
   - Formata os valores monetários em formato brasileiro (`R$ X,XX`).
   - Mime type: `text/csv;charset=utf-8`.

3. **Implementação `ExportadorJson`**:
   - Gera um JSON estruturado com metadados do relatório, detalhamento das categorias e resumo do período.
   - Mime type: `application/json`.

4. **Integração no Serviço e Rota**:
   - Criação da rota `/relatorio/exportar?mes=AAAA-MM&formato=csv|json`.
   - O controlador recebe o formato desejado, obtém a instância polimórfica correspondente e retorna o download apropriado.

---

## 🏁 Critério de Aceite
- [x] Interface `ExportadorRelatorio` bem definida e documentada.
- [x] Pelo menos duas classes polimórficas (`ExportadorCsv` e `ExportadorJson`) implementando o mesmo método `exportar()`.
- [x] Endpoint no backend respondendo com os arquivos gerados de acordo com o parâmetro informado.

