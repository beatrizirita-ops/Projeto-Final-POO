# Ticket 02: Encapsulamento com Value Objects (Dinheiro e Vencimento)

- **Tipo**: `wayfinder:task`
- **Status**: Aberto (Fronteira)
- **Bloqueado por**: Nenhum

---

## 🎯 Objetivo
Substituir o uso de tipos primitivos crus (`number` solto para dinheiro e `string` solta para datas de vencimento) por **Value Objects imutáveis**, demonstrando o princípio de **Encapsulamento** e proteção contra estados inválidos no modelo de domínio.

---

## 📝 Requisitos de Implementação

1. **Classe `Dinheiro` (Value Object)**:
   - Atributo privado e imutável `private readonly centavos: number` (para evitar erros de arredondamento de ponto flutuante).
   - Métodos públicos:
     - `static deReais(valor: number): Dinheiro` (valida se o número é finito).
     - `static deCentavos(centavos: number): Dinheiro`.
     - `somar(outro: Dinheiro): Dinheiro`.
     - `subtrair(outro: Dinheiro): Dinheiro`.
     - `multiplicar(fator: number): Dinheiro`.
     - `emReais(): number` (retorna `centavos / 100`).
     - `formatar(): string` (retorna formatado em R$).
     - `menorQue(outro: Dinheiro): boolean`.
     - `ehNegativo(): boolean`.
   - Lançar exceções caso operações tentem criar quantias inválidas.

2. **Classe `Vencimento` (Value Object)**:
   - Atributo privado e imutável `private readonly data: Date`.
   - Validação no construtor ou factory estática `Vencimento.criar(dataISO: string)`.
   - Métodos:
     - `estaVencido(emData?: Date): boolean`.
     - `diasAte(emData?: Date): number`.
     - `adicionarDias(dias: number): Vencimento`.
     - `adicionarMeses(meses: number): Vencimento`.
     - `formatarISO(): string`.

3. **Refatoração no Domínio**:
   - Atualizar a interface `Lancamento` e a classe base de `Conta` para operar com instâncias de `Dinheiro` e `Vencimento`.

---

## 🏁 Critério de Aceite
- [ ] Classes `Dinheiro` e `Vencimento` implementadas com atributos privados e imutabilidade garantida.
- [ ] Regras de arredondamento centralizadas em `Dinheiro`.
- [ ] Lançamentos instanciados usando os Value Objects em vez de valores literais desprotegidos.

