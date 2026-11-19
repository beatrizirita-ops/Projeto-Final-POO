# Ticket 01: Modelagem e Integração do ORM Prisma

- **Tipo**: `wayfinder:task`
- **Status**: [CONCLUÍDO]
- **Bloqueado por**: Nenhum

---

## 🎯 Objetivo
Substituir o acesso a dados manual com strings SQL diretas e `node:sqlite` pelo **Prisma ORM**, configurando o schema relacional em SQLite e gerando os tipos automáticos para o backend.

---

## 📝 Requisitos de Implementação

1. **Configuração do Prisma**:
   - Inicializar o Prisma no backend (`prisma/schema.prisma`) com SQLite (`file:./financeiro.db` ou `file:./dev.db`).
   - Mapear os modelos de dados:
     - `Usuario`: id, nome, email, senhaHash, relacoes com contas, sessoes e orcamentos.
     - `Sessao`: token, usuarioId, expiraEm.
     - `Conta`: id, usuarioId, nome, saldo, tipo (enum/string: `CORRENTE`, `POUPANCA`, `CARTAO`), limiteCredito, taxaCashback, diaAniversario.
     - `Lancamento`: id, contaId, tipo, descricao, valor, vencimento, etapa, categoria, valorPago.
     - `Orcamento`: usuarioId, categoria, limite.

2. **Refatoração da Camada de Repositório (`backend/src/repository.ts`)**:
   - Atualizar a classe `PrismaFinanceiroRepository` e `PrismaUsuarioRepository` para utilizar o cliente gerado do Prisma (`prisma.conta`, `prisma.lancamento`, etc.).
   - Manter as interfaces de contrato `FinanceiroRepository` e `UsuarioRepository` no domínio, demonstrando **Inversão de Dependência**.

3. **Validação**:
   - Gerar as migrations do Prisma (`npx prisma migrate dev` ou `npx prisma db push`).
   - Testar operações básicas de leitura, escrita e transações (`prisma.$transaction`).

---

## 🏁 Critério de Aceite
- [x] Schema do Prisma criado e refletindo todas as entidades.
- [x] Código compilando com TypeScript e Deno sem erros de sintaxe SQL manual.
- [x] Operações de cadastro, login, contas e lançamentos funcionando através do Prisma Client.

