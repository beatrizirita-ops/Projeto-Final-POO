# Relatório Técnico de Implementação — Projeto Caixa (Gestão Financeira)
**Disciplina:** Programação Orientada a Objetos (POO) — UNIFESP SJC

---

## 1. Visão Geral do Projeto

O **Caixa** é um sistema completo de gestão financeira pessoal e empresarial leve, estruturado no modelo de quadro Kanban com fluxo financeiro (**Pendente → Agendado → Pago**). A aplicação conta com separação completa entre backend e frontend, persistência em banco relacional SQLite e autenticação multiusuário.

---

## 2. Estrutura do Repositório

```text
Projeto-Final-POO-main/
├── backend/
│   ├── deno.json               # Configuração do runtime Deno e scripts de execução
│   ├── package.json            # Metadados e dependências locais
│   └── src/
│       ├── dominio.ts          # Regras de negócio, POO (classes, interfaces, polimorfismo)
│       ├── auth.ts             # Serviço de autenticação, hashing de senhas e sessões
│       ├── repository.ts       # Acesso a dados via SQLite (Repository Pattern e transações)
│       ├── server.ts           # Servidor HTTP REST (Deno.serve) e injeção de dependências
│       └── financeiro.db       # Banco de dados SQLite local
├── frontend/
│   ├── index.html              # Ponto de entrada HTML
│   ├── vite.config.js          # Configuração Vite com proxy reverso para backend (:3000)
│   ├── package.json            # Scripts e dependências do React / Vite
│   └── src/
│       ├── main.jsx            # Inicialização do React (ReactDOM.createRoot)
│       ├── App.jsx             # Componente raiz, painel Kanban e gestão de lançamentos
│       ├── Login.jsx           # Tela unificada de login e cadastro
│       ├── Relatorio.jsx       # Relatório mensal comparativo, orçamentos e exportação CSV
│       ├── api.js              # Camada cliente de consumo da API REST com JWT/Bearer
│       ├── format.js           # Funções utilitárias de formatação monetária e datas
│       └── styles.css          # Estilização completa da interface
├── package.json                # Configuração raiz
└── README.md                   # Documentação do projeto
```

---

## 3. Conceitos de Orientação a Objetos e Boas Práticas Aplicadas

O código do backend foi desenvolvido para aplicar diretamente conceitos fundamentais da disciplina:

### 3.1. Abstração e Interfaces (Contratos)
- **`Lancamento` (`dominio.ts`)**: Define o contrato essencial de qualquer transação financeira:
  - `valorAtualizado(hoje: Date): number`
  - `efeitoNoSaldo(hoje: Date): number`
- **`Recorrencia` (`dominio.ts`)**: Interface para cálculo de datas futuras de parcelas:
  - `dataDaParcela(inicial: string, indice: number): string`
- **`FinanceiroRepository` e `UsuarioRepository` (`dominio.ts` e `auth.ts`)**: Contratos de persistência desacoplados da tecnologia de banco.

### 3.2. Polimorfismo e Herança por Interface
- **Especializações de `Lancamento`**:
  - `Receita`: Não altera o valor nominal; tem efeito positivo no saldo (`+valor`).
  - `Despesa`: Não altera o valor nominal; tem efeito negativo no saldo (`-valor`).
  - `Boleto`: Implementa cálculo dinâmico de juros e multa caso esteja em atraso (multa de 2% + juros de 0,033% ao dia sobre os dias de atraso). Seu efeito no saldo deduz o valor já acrescido dos juros.
- **Especializações de `Recorrencia`**:
  - `Unica`: Mantém a data original.
  - `Semanal`: Calcula incrementos de 7 dias por parcela.
  - `Mensal`: Calcula incrementos mensais preservando ou ajustando o último dia do mês para meses de 28/30 dias.

### 3.3. Encapsulamento
- **Classe `Conta` (`dominio.ts`)**:
  - O atributo `saldo` é estritamente privado (`private saldo: number`).
  - Não é possível alterar o saldo diretamente via atribuição arbitrária. A modificação só ocorre pelo método `aplicar(lancamento: Lancamento, hoje: Date)`, que valida regra de negócio (impede que o saldo fique negativo).

### 3.4. Padrões de Projeto (Design Patterns)
- **Factory Method**:
  - `criarLancamento(...)`: Valida dados de entrada (descrição, valor positivo, data válida) e instancia a classe correta (`Receita`, `Despesa` ou `Boleto`).
  - `criarRecorrencia(...)`: Instancia a estratégia adequada (`Unica`, `Semanal` ou `Mensal`).
- **Repository Pattern**:
  - A classe `SqliteRepository` implementa tanto `FinanceiroRepository` quanto `UsuarioRepository`, isolando SQL e persistência da lógica de negócio.
- **Injeção de Dependência (DI)**:
  - As classes de serviço `GestorFinanceiro` e `ServicoAuth` recebem os repositórios em seus construtores, facilitando testes e desacoplamento.

---

## 4. O Que Foi Implementado no Sistema

### 4.1. Backend
1. **Autenticação e Segurança**:
   - Criptografia com algoritmo PBKDF2 (SHA-256 com salt aleatório e 100.000 iterações).
   - Bloqueio temporário (15 minutos) após 5 tentativas consecutivas de login incorreto (proteção anti-brute force).
   - Sessões gerenciadas com tokens aleatórios persistidos em banco e expiração em 7 dias.
   - Isolamento de dados por usuário (`usuario_id` em todas as consultas e operações).

2. **Gestão de Contas e Lançamentos**:
   - Criação automática de "Conta corrente" no cadastro do usuário.
   - Suporte a múltiplas contas por usuário (ex: Carteira, Poupança, Banco Digital).
   - Tipos de lançamento: Receita, Despesa e Boleto (com recálculo automático de juros).
   - Lançamentos recorrentes com parcelamento automático (em até 60 parcelas semanais ou mensais).
   - Edição e exclusão de lançamentos pendentes/agendados.

3. **Fluxo Kanban e Transações ACID**:
   - Movimentação entre etapas: `Pendente` → `Agendado` → `Pago` (e retorno de `Agendado` para `Pendente`).
   - Ao mover para `Pago`, o saldo da conta associada é debitado ou creditado dentro de uma transação SQLite (`BEGIN TRANSACTION ... COMMIT / ROLLBACK`), garantindo integridade atômica. Lançamentos pagos ficam protegidos contra edições retroativas.

4. **Orçamentos e Relatórios Mensais**:
   - Definição de tetos orçamentários por categoria de gasto (Alimentação, Moradia, Lazer, etc.).
   - Endpoint de resumo com saldo total, valores a receber, valores a pagar, lançamentos vencidos e a vencer em 7 dias.
   - Endpoint de relatório detalhado: total de entradas, total de saídas, resultado líquido, despesas agrupadas por categoria com alerta visual de estouro de limite e comparativo com o mês anterior.

### 4.2. Frontend
1. **Autenticação Integrada**:
   - Tela limpa para alternar entre "Entrar" e "Criar conta".
   - Persistência de token no `localStorage` e interceptador que redireciona ao login caso a sessão expire.
2. **Dashboard Kanban Interativo**:
   - Indicadores numéricos no topo: Saldo, A Receber, A Pagar, Vencendo em 7 dias e Alerta de Vencidos.
   - Três colunas Kanban mostrando os cards com badges visuais (tipo, categoria, conta, aviso de boleto com juros e selo de vencido).
   - Botões de ação em cada cartão: "Agendar", "Pagar/Receber", "Voltar", "Editar" e "Excluir".
   - Formulário ágil para novos lançamentos com suporte a repetição periódica.
   - Criação de novas contas diretamente no rodapé do painel.
3. **Módulo de Relatórios e Metas**:
   - Seletor de mês dinâmico (`input type="month"`).
   - Indicadores de fluxo de caixa (Entradas, Saídas, Resultado e previsões em aberto).
   - Gráfico de barras com percentual por categoria e destaque em vermelho para categorias que estouraram o orçamento.
   - Tabela dos 5 maiores gastos do mês selecionado.
   - Gerenciador de limite mensal por categoria.
   - Exportação de dados do mês em formato **CSV com codificação UTF-8 com BOM** (compatível com Microsoft Excel em português).

---

## 5. Conclusão

O projeto atende com excelência os objetivos de POO ao utilizar TypeScript para demonstrar tipos estáticos, encapsulamento rígido, polimorfismo via interfaces, padrões de projeto arquiteturais e separação estrita de camadas (Domínio, Repositório, Serviço e Interface HTTP).

