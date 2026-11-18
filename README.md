# Caixa — Gestão Financeira Pessoal em Kanban

> **Projeto Final da disciplina de Programação Orientada a Objetos (POO)**  
> **Universidade Federal de São Paulo (UNIFESP) — Campus São José dos Campos (SJC)**

---

## 💡 Sobre o Projeto

O **Caixa** é um aplicativo completo de gestão financeira com foco em simplicidade e controle visual. Ele utiliza a metáfora de um **quadro Kanban** para organizar as obrigações financeiras e entradas monetárias:

$$\text{Pendente} \longrightarrow \text{Agendado} \longrightarrow \text{Pago}$$

Cada lançamento (receita, despesa ou boleto) é representado por um cartão que transita pelas colunas. Ao ser marcado como **Pago**, o sistema executa uma transação atômica em banco de dados SQLite, atualizando o saldo da conta correspondente com garantia de integridade.

### Principais Funcionalidades:
- **Autenticação Segura Multi-usuário**: Cadastro e login com hash PBKDF2 (SHA-256 + 100k iterações) e proteção contra força bruta.
- **Múltiplas Contas**: Criação e gestão de saldos separados (Conta Corrente, Carteira, Poupança, etc.).
- **Polimorfismo Financeiro**:
  - **Receitas**: Entradas positivas no saldo.
  - **Despesas**: Saídas nominais da conta.
  - **Boletos**: Cálculo automático em tempo real de **multa (2%) e juros diários (0,033%/dia)** caso esteja em atraso.
- **Recorrência & Parcelamento**: Agendamento automático semanal ou mensal (até 60 parcelas com tratamento de viradas de mês).
- **Orçamentos & Metas**: Limites mensais por categoria de gasto com alertas visuais de estouro.
- **Relatório Mensal Comparativo**: Visão de fluxo de caixa, comparativo com mês anterior, maiores despesas e exportação em planilha **CSV** (compatível com Excel).

---

## 🛠️ Tecnologias Utilizadas

- **Backend**:
  - [Deno](https://deno.com/) / [TypeScript](https://www.typescriptlang.org/)
  - SQLite nativo (`node:sqlite`)
  - Web Crypto API nativa (criptografia PBKDF2)
- **Frontend**:
  - [React](https://react.dev/)
  - [Vite](https://vitejs.dev/)
  - CSS3 puro e responsivo

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
Certifique-se de ter instalado em seu computador:
1. **[Node.js](https://nodejs.org/)** (v18+ recomendado) e **npm**
2. **[Deno](https://deno.land/)** (v1.x ou v2.x)

---

### Passo 1: Iniciar o Backend

Abra um terminal na pasta `backend`:

#### Opção A (Recomendada - usa o Deno já empacotado no projeto com npm):
```powershell
cd backend
npm run dev
```

#### Opção B (Executando o binário local diretamente):
```powershell
cd backend
.\node_modules\@deno\win32-x64\deno.exe task dev
```

#### Opção C (Se preferir instalar o Deno globalmente no Windows):
Execute no PowerShell:
```powershell
irm https://deno.land/install.ps1 | iex
```
Depois feche e reabra o terminal e rode:
```powershell
cd backend
deno task dev
```

---

### Passo 2: Iniciar o Frontend

Em outro terminal, acesse a pasta `frontend`:

```bash
cd frontend
npm install
npm run dev
```

O Vite iniciará o servidor de desenvolvimento e disponibilizará o link no terminal (geralmente **`http://localhost:5173`**).

---

### Passo 3: Utilizando o Sistema

1. Acesse **`http://localhost:5173`** no seu navegador.
2. Na tela inicial, clique em **"Ainda não tenho conta"** para criar seu usuário e senha.
3. Uma conta corrente inicial será criada automaticamente.
4. Você já pode cadastrar receitas, despesas, boletos e navegar entre as abas **Quadro** e **Relatório do mês**!

---

## 📚 Documentação Técnica de POO

Para uma análise detalhada dos pilares de Programação Orientada a Objetos implementados (Abstração, Polimorfismo, Encapsulamento, Injeção de Dependências e Padrões de Projeto), consulte o arquivo:
- [RELATORIO_IMPLEMENTACAO.md](RELATORIO_IMPLEMENTACAO.md)
