import {
  CartaoCredito,
  ContaBancaria,
  ContaCorrente,
  ContaPoupanca,
  criarContaBancaria,
  criarLancamento,
} from './dominio.ts';

function assert(condicao: boolean, msg: string) {
  if (!condicao) throw new Error(`Falha na asserção: ${msg}`);
}

console.log('🧪 Iniciando testes de Herança e Polimorfismo das Contas Bancárias...');

// 1. Polimorfismo via array tipado com a classe base abstrata ContaBancaria
const contas: ContaBancaria[] = [
  criarContaBancaria({ id: 1, nome: 'Corrente', saldo: 500, tipo: 'CORRENTE' }),
  criarContaBancaria({ id: 2, nome: 'Poupança', saldo: 1000, tipo: 'POUPANCA', diaAniversario: 15 }),
  criarContaBancaria({ id: 3, nome: 'Cartão', saldo: 800, tipo: 'CARTAO', limiteCredito: 800, taxaCashback: 0.01 }),
];

assert(contas[0] instanceof ContaCorrente, 'Factory deve instanciar ContaCorrente');
assert(contas[1] instanceof ContaPoupanca, 'Factory deve instanciar ContaPoupanca');
assert(contas[2] instanceof CartaoCredito, 'Factory deve instanciar CartaoCredito');

const compra = criarLancamento('despesa', 'Compra Teste', 200, '2026-11-20');
for (const c of contas) {
  c.aplicar(compra, new Date());
}

assert(contas[0].getSaldo() === 300, 'ContaCorrente deve debitar para 300');
assert(contas[1].getSaldo() === 800, 'ContaPoupanca deve debitar para 800');
assert(contas[2].getSaldo() === 600, 'CartaoCredito deve reduzir limite disponível para 600');
console.log('   ✅ Polimorfismo de aplicar() validado nas 3 subclasses.');

// 2. Rendimento da Poupança exclusivamente no dia 15
const poupanca = contas[1] as ContaPoupanca;
const rendDia16 = poupanca.render(new Date(2026, 10, 16));
assert(rendDia16.emReais() === 0, 'Não deve render fora do dia 15');
const rendDia15 = poupanca.render(new Date(2026, 10, 15));
assert(rendDia15.emReais() === 4, 'Deve render 0,5% de 800 = 4 no dia 15');
assert(poupanca.getSaldo() === 804, 'Saldo da poupança deve atualizar para 804');
console.log('   ✅ Rendimento da ContaPoupanca no dia 15 validado.');

// 3. Limite, Cashback e Resgate no Cartão de Crédito
const cartao = contas[2] as CartaoCredito;
assert(cartao.getFaturaAtual().emReais() === 200, 'Fatura atual deve ser 200');
assert(cartao.getCashbackAcumulado().emReais() === 2, 'Cashback acumulado deve ser 1% de 200 = 2');

let bloqueouLimite = false;
try {
  cartao.aplicar(criarLancamento('despesa', 'Compra acima do limite', 700, '2026-11-20'), new Date());
} catch {
  bloqueouLimite = true;
}
assert(bloqueouLimite, 'CartaoCredito deve bloquear compra acima do limite');

const resgatado = cartao.resgatarCashback(contas[0]);
assert(resgatado.emReais() === 2, 'Deve resgatar R$ 2 de cashback');
assert(contas[0].getSaldo() === 302, 'ContaCorrente deve receber os R$ 2 de cashback');
assert(cartao.getCashbackAcumulado().emReais() === 0, 'Cashback no cartão deve zerar após resgate');
console.log('   ✅ Limite, cashback e resgate do CartaoCredito validados.');

console.log('\n🎉 TODOS OS TESTES DE HERANÇA E POLIMORFISMO PASSARAM COM SUCESSO!');
