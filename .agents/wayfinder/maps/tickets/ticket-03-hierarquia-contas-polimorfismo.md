# Ticket 03: Herança e Polimorfismo nas Contas Bancárias

- **Tipo**: `wayfinder:task`
- **Status**: Bloqueado
- **Bloqueado por**: Ticket 01 (Prisma), Ticket 02 (Value Objects)

---

## 🎯 Objetivo
Implementar uma hierarquia de herança e polimorfismo para modelar diferentes categorias de contas financeiras:
1. `ContaBancaria` (Classe base abstrata)
2. `ContaCorrente` (Subclasse)
3. `ContaPoupanca` (Subclasse com rendimento no dia 15)
4. `CartaoCredito` (Subclasse com limite e acúmulo de cashback)

---

## 📝 Requisitos de Implementação

1. **Classe Abstrata `ContaBancaria`**:
   - Atributos protegidos/privados: `id`, `usuarioId`, `nome`, `saldo: Dinheiro`.
   - Método abstrato: `aplicar(lancamento: Lancamento, dataOperacao: Date): void`.
   - Métodos concretos: `getSaldo(): Dinheiro`, `creditar(quantia: Dinheiro): void`, `debitar(quantia: Dinheiro): void`.

2. **Subclasse `ContaCorrente`**:
   - Regra padrão: debita e credita sem permitir saldo negativo (a não ser que configurado cheque especial).

3. **Subclasse `ContaPoupanca`**:
   - Atributo privado `private readonly diaAniversario: number = 15`.
   - Atributo privado `private readonly taxaRendimento: number` (ex.: 0.5% ao mês).
   - Método polimórfico `render(dataAtual: Date): Dinheiro`:
     - Se `dataAtual.getDate() === 15`, calcula o rendimento sobre o saldo positivo e credita na conta.
     - Caso contrário, não gera rendimento.

4. **Subclasse `CartaoCredito`**:
   - Atributo privado `private readonly limite: Dinheiro`.
   - Atributo privado `private faturaAtual: Dinheiro = Dinheiro.deReais(0)`.
   - Atributo privado `private cashbackAcumulado: Dinheiro = Dinheiro.deReais(0)`.
   - Atributo privado `private readonly taxaCashback: number` (ex.: 1% do valor das compras).
   - Sobrescrita do método `aplicar()`:
     - Para despesas no cartão: verifica se `faturaAtual + valor <= limite`.
     - Adiciona o valor à fatura e calcula o cashback correspondente (ex: 1% de volta adicionado a `cashbackAcumulado`).
   - Método `resgatarCashback(paraConta: ContaBancaria)`:
     - Zera o cashback do cartão e transfere o valor para a conta de destino indicada.

---

## 🏁 Critério de Aceite
- [ ] Classe abstrata e subclasses com métodos abstratos e sobrescritas polimórficas funcionais.
- [ ] Teste unitário ou verificação demonstrando:
  - O rendimento da Poupança ocorrendo especificamente quando simulado no dia 15.
  - A geração e acúmulo de cashback no Cartão de Crédito e validação de limite da fatura.

