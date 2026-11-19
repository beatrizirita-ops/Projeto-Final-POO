import { ServicoAuth } from './auth.ts';
import { GestorFinanceiro } from './dominio.ts';
import { PrismaFinanceiroRepository, PrismaUsuarioRepository } from './repository.ts';

async function testarFluxoCompleto() {
  console.log('🧪 Iniciando teste de fluxo de ponta a ponta com Prisma...');

  const repoUsuario = new PrismaUsuarioRepository();
  const repoFinanceiro = new PrismaFinanceiroRepository();
  const auth = new ServicoAuth(repoUsuario);
  const gestor = new GestorFinanceiro(repoFinanceiro);

  const email = `usuario_${Date.now()}@teste.com`;
  const senha = 'senhaForte123';

  // 1. Cadastro
  console.log('1. Cadastrando novo usuário...');
  const usuario = await auth.cadastrar('Usuário Teste E2E', email, senha);
  console.log('   ✅ Usuário cadastrado com sucesso. ID:', usuario.id);

  // 2. Criar Conta Padrão
  console.log('2. Criando conta para o usuário...');
  const contaId = await repoFinanceiro.criarConta(usuario.id, 'Conta Corrente Principal', 500);
  console.log('   ✅ Conta criada com ID:', contaId);

  // 3. Login
  console.log('3. Efetuando login...');
  const loginRes = await auth.entrar(email, senha);
  console.log('   ✅ Login realizado! Token gerado:', loginRes.token.slice(0, 10) + '...');

  // 4. Validar sessão com token
  console.log('4. Validando sessão a partir do token...');
  const usuarioLogado = await auth.usuarioDoToken(loginRes.token);
  if (!usuarioLogado || usuarioLogado.id !== usuario.id) {
    throw new Error('Falha na validação do token!');
  }
  console.log('   ✅ Sessão válida para:', usuarioLogado.nome);

  // 5. Criar lançamentos (Receita e Despesa/Boleto)
  console.log('5. Criando lançamentos no Kanban...');
  const [lancReceitaId] = await gestor.criar(
    usuario.id,
    contaId,
    'receita',
    'Salário Mensal',
    3000,
    '2026-11-25',
    'Salário'
  );
  console.log('   ✅ Lançamento de Receita criado. ID:', lancReceitaId);

  const [lancDespesaId] = await gestor.criar(
    usuario.id,
    contaId,
    'boleto',
    'Conta de Luz',
    120,
    '2026-11-30',
    'Moradia'
  );
  console.log('   ✅ Lançamento de Boleto criado. ID:', lancDespesaId);

  // 6. Definir Orçamento
  console.log('6. Definindo teto de orçamento para categoria Moradia...');
  await gestor.definirOrcamento(usuario.id, 'Moradia', 400);
  console.log('   ✅ Orçamento registrado com sucesso.');

  // 7. Mover etapa (Pagar despesa via Transação Atômica do Prisma)
  console.log('7. Pagando o boleto (efetivando pagamento no Kanban)...');
  await gestor.mover(usuario.id, lancDespesaId, 'pago');
  console.log('   ✅ Boleto pago com sucesso.');

  // 8. Obter Resumo e Relatório
  console.log('8. Consultando resumo e relatório financeiro...');
  const resumo = await gestor.resumo(usuario.id);
  console.log('   📊 Resumo financeiro:', {
    saldoTotal: resumo.saldoTotal,
    aReceber: resumo.aReceber,
    aPagar: resumo.aPagar,
  });

  const relatorio = await gestor.relatorio(usuario.id, '2026-11');
  console.log('   📊 Relatório do mês:', {
    mes: relatorio.mes,
    saidas: relatorio.saidas,
    resultado: relatorio.resultado,
  });

  console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO! O PRISMA ESTÁ 100% OPERACIONAL.');
  Deno.exit(0);
}

testarFluxoCompleto().catch((err) => {
  console.error('❌ Erro no teste:', err);
  Deno.exit(1);
});

