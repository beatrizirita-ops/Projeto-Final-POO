// ===== Cadastro e login (contrato + serviço, mesmo padrão do Repository) =====
export interface UsuarioData { id: number; nome: string; email: string }

export interface UsuarioRepository {
  criarUsuario(nome: string, email: string, senhaHash: string): Promise<number>;
  buscarPorEmail(email: string): Promise<(UsuarioData & { senhaHash: string }) | undefined>;
  criarSessao(token: string, usuarioId: number, expiraEm: number): Promise<void>;
  buscarPorToken(token: string, agora: number): Promise<UsuarioData | undefined>;
  removerSessao(token: string): Promise<void>;
}

const hex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

// A senha nunca é guardada: grava-se "salt:hash" (PBKDF2, 100 mil iterações)
async function gerarHash(senha: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const chave = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100_000 }, chave, 256);
  return hex(bits);
}

export class ServicoAuth {
  private static readonly MAX_FALHAS = 5;
  private static readonly BLOQUEIO_MS = 15 * 60_000;
  private static readonly SESSAO_MS = 7 * 24 * 3_600_000; // a sessão vale 7 dias
  private readonly tentativas = new Map<string, { falhas: number; ate: number }>(); // fica na memória

  constructor(private readonly repo: UsuarioRepository) {}

  async cadastrar(nome: string, email: string, senha: string): Promise<UsuarioData> {
    email = email.trim().toLowerCase();
    if (!nome.trim()) throw new Error('Informe seu nome.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('E-mail inválido.');
    if (senha.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
    if (await this.repo.buscarPorEmail(email)) throw new Error('Este e-mail já está cadastrado.');
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const id = await this.repo.criarUsuario(nome.trim(), email, `${salt}:${await gerarHash(senha, salt)}`);
    return { id, nome: nome.trim(), email };
  }

  async entrar(email: string, senha: string): Promise<{ token: string; usuario: UsuarioData }> {
    const chave = email.trim().toLowerCase();
    const t = this.tentativas.get(chave);
    if (t && t.ate > Date.now()) {
      throw new Error(`Muitas tentativas erradas. Tente de novo em ${Math.ceil((t.ate - Date.now()) / 60_000)} min.`);
    }
    const u = await this.repo.buscarPorEmail(chave);
    const [salt = '', esperado = ''] = u?.senhaHash.split(':') ?? [];
    if (!u || (await gerarHash(senha, salt)) !== esperado) {
      const falhas = (t?.falhas ?? 0) + 1;
      this.tentativas.set(chave, falhas >= ServicoAuth.MAX_FALHAS ? { falhas: 0, ate: Date.now() + ServicoAuth.BLOQUEIO_MS } : { falhas, ate: 0 });
      throw new Error('E-mail ou senha incorretos.');
    }
    this.tentativas.delete(chave);
    const token = hex(crypto.getRandomValues(new Uint8Array(32)));
    await this.repo.criarSessao(token, u.id, Date.now() + ServicoAuth.SESSAO_MS);
    return { token, usuario: { id: u.id, nome: u.nome, email: u.email } };
  }

  usuarioDoToken(token: string) { return this.repo.buscarPorToken(token, Date.now()); }
  sair(token: string) { return this.repo.removerSessao(token); }
}
