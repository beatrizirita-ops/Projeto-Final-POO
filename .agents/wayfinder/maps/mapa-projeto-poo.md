# Mapa Wayfinder: Evolução de POO do Projeto Caixa

## Destination
Transformar o backend do projeto Caixa em uma referência didática completa dos pilares de Programação Orientada a Objetos (POO), integrando:
1. ORM **Prisma** para persistência objeto-relacional tipada.
2. Hierarquia de **Contas Bancárias** com herança e polimorfismo (`ContaCorrente`, `CartaoCredito` com cashback, `ContaPoupanca` com rendimento no dia 15).
3. **Value Objects** para encapsulamento rígido (`Dinheiro`, `Vencimento`).
4. **Interfaces de Exportação** polimórficas (CSV, JSON).

## Notes
- **Disciplina**: POO — UNIFESP SJC.
- **Restrição**: NÃO utilizar padrões de projeto avançados (ex.: Observer) que ainda não foram ensinados na disciplina. Focar nos 4 pilares: Abstração, Encapsulamento, Herança e Polimorfismo.
- **Tracker local**: Diretório `.agents/wayfinder/maps/tickets/`.

## Decisions so far
- [x] **ORM Definido**: Prisma selecionado para mapeamento objeto-relacional do SQLite.
- [x] **Escopo de Contas**: Cartão de Crédito com cashback e Conta Poupança com rendimento no dia 15.
- [x] **Escopo de Padrões**: Padrões GoF avançados (como Observer) foram descartados para manter alinhamento com a ementa atual da disciplina.
- [x] **Ticket 01 Concluído**: Integração do Prisma ORM com SQLite, schemas de Usuário, Sessão, Conta, Lançamento e Orçamento, e repositórios desacoplados (`PrismaUsuarioRepository` e `PrismaFinanceiroRepository`).
- [x] **Ticket 02 Concluído**: Encapsulamento com Value Objects imutáveis (`Dinheiro` em centavos e `Vencimento` com datas seguras) aplicado em `Lancamento`, `Conta` e `GestorFinanceiro`.
- [x] **Ticket 03 Concluído**: Hierarquia de contas bancárias com classe abstrata `ContaBancaria` e subclasses polimórficas `ContaCorrente`, `ContaPoupanca` (rendimento no dia 15) e `CartaoCredito` (limite e cashback).
- [x] **Ticket 04 Concluído**: Subsistema de exportação de relatórios com interface `ExportadorRelatorio`, implementações polimórficas (`ExportadorCsv` e `ExportadorJson`) e rota `/relatorio/exportar`.

## Frontier (Abertos e Disponíveis para Execução)
- [ ] [Ticket 05: Integração de Rotas e Atualização da Interface](tickets/ticket-05-rotas-e-frontend.md) — Exposição das novas contas e exportação no frontend.

## Blocked (Aguardando dependências da fronteira)
*(Nenhum ticket bloqueado no momento)*

## Not yet specified
- Mecanismo de fechamento e virada de fatura do Cartão de Crédito.
- Exportação em PDF como terceira implementação da interface de exportação.

## Out of scope
- Padrão Observer / Barramento de eventos (GoF) — descartado pelo usuário por não fazer parte da ementa atual da disciplina.

