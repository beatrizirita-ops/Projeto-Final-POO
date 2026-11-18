# Ticket 05: Integração de Rotas e Atualização da Interface

- **Tipo**: `wayfinder:task`
- **Status**: Bloqueado
- **Bloqueado por**: Ticket 03 (Hierarquia de Contas), Ticket 04 (Exportadores)

---

## 🎯 Objetivo
Expor os novos recursos de POO na API REST do backend e atualizar o frontend para que o usuário possa selecionar o tipo de conta (Corrente, Poupança, Cartão de Crédito) e exportar relatórios em CSV ou JSON.

---

## 📝 Requisitos de Implementação

1. **Rotas da API**:
   - Atualizar a rota `POST /contas` para aceitar `tipo` (`corrente`, `poupanca`, `cartao`) e campos específicos (ex.: limite de crédito).
   - Adicionar rota `POST /contas/:id/render` para disparar o cálculo do rendimento da poupança.
   - Adicionar rota `POST /contas/:id/resgatar-cashback` para transferir cashback do cartão para outra conta.
   - Atualizar a rota de exportação para suportar o seletor de formato (CSV e JSON).

2. **Frontend (React)**:
   - Formulário de criação de contas:
     - Adicionar seletor do tipo de conta: **Conta Corrente**, **Conta Poupança (rende todo dia 15)** e **Cartão de Crédito (com cashback)**.
     - Se cartão de crédito for escolhido: exibir campo para informar limite de crédito.
   - Exibição das contas:
     - Badge indicando o tipo da conta e saldo atual.
     - No caso de cartão: mostrar fatura atual e cashback acumulado com botão para resgatar.
   - Na tela de relatório:
     - Adicionar botões: "Exportar CSV" e "Exportar JSON".

---

## 🏁 Critério de Aceite
- [ ] Usuário consegue cadastrar os 3 tipos de contas na interface.
- [ ] Informações de cashback e rendimento são visíveis e acionáveis pelo usuário.
- [ ] Exportação nos dois formatos funcionando diretamente pelo navegador.

