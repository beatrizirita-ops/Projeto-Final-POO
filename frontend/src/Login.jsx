import { useState } from 'react';
import { api } from './api.js';

// Uma tela só, com dois modos: entrar ou criar conta
export default function Login({ onEntrar }) {
  const [modo, setModo] = useState('entrar');
  const [form, setForm] = useState({ nome: '', email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const cadastro = modo === 'cadastrar';
  const campo = (nome) => ({ value: form[nome], onChange: (e) => setForm({ ...form, [nome]: e.target.value }) });

  const enviar = async (e) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const usuario = cadastro
        ? await api.cadastrar(form.nome, form.email, form.senha)
        : await api.entrar(form.email, form.senha);
      onEntrar(usuario);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login">
      <h1>Caixa</h1>
      <p className="sub">Organize contas, boletos e pagamentos em um só quadro.</p>
      <form onSubmit={enviar}>
        <h2>{cadastro ? 'Criar conta' : 'Entrar'}</h2>
        {cadastro && (
          <label>Nome<input {...campo('nome')} autoComplete="name" required /></label>
        )}
        <label>E-mail<input type="email" {...campo('email')} autoComplete="email" required /></label>
        <label>
          Senha
          <input type="password" {...campo('senha')} minLength={cadastro ? 6 : undefined}
            autoComplete={cadastro ? 'new-password' : 'current-password'} required />
        </label>
        {cadastro && <small>Use pelo menos 6 caracteres.</small>}
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button type="submit" disabled={enviando}>{cadastro ? 'Criar conta' : 'Entrar'}</button>
      </form>
      <button className="sec troca" onClick={() => { setModo(cadastro ? 'entrar' : 'cadastrar'); setErro(''); }}>
        {cadastro ? 'Já tenho conta' : 'Ainda não tenho conta'}
      </button>
    </div>
  );
}
