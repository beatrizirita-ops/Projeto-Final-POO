# Diretrizes de Desenvolvimento e Contexto do Agente

## Contexto do Projeto
Este repositório é o **Projeto Final da disciplina de Programação Orientada a Objetos (POO)** da UNIFESP São José dos Campos.
Trata-se do sistema **Caixa (Gestão Financeira Pessoal em Kanban)**, composto por:
- **Backend**: Deno / Node.js + TypeScript com foco estrito na aplicação dos conceitos de POO (Encapsulamento, Herança, Polimorfismo, Abstração e Interfaces).
- **Frontend**: React + Vite com interface estilo Kanban e relatórios financeiros.

> **Importante para a Disciplina de POO:**
> - Ainda **NÃO** foram abordados formalmente padrões de projeto GoF complexos (evitar Observer, Decorator excessivo, etc.). O foco primordial deve ser:
>   - **Encapsulamento e Ocultação de Informação** (Value Objects, atributos privados, métodos de negócio).
>   - **Herança e Polimorfismo** (Hierarquia de classes de contas com regras especializadas).
>   - **Abstração e Interfaces** (Contratos claros para persistência e exportação).
>   - **Integração com ORM (Prisma)** para mapeamento objeto-relacional estruturado.

---

## 🧭 Metodologia Obrigatória: Wayfinder

Todas as etapas de evolução, refatoração e implementação deste repositório **DEVEM** ser conduzidas e rastreadas através da metodologia **Wayfinder** (`.agents/skills/wayfinder/SKILL.md`).

### Regras do Wayfinder para este Repositório:
1. **Mapa Canônico Local**:
   O mapa principal do projeto está localizado em:
   `[.agents/wayfinder/maps/mapa-projeto-poo.md](file:///c:/Users/analu/Downloads/Projeto-Final-POO-main/.agents/wayfinder/maps/mapa-projeto-poo.md)`
2. **Tickets Individuais**:
   Cada ticket de decisão/implementação possui um arquivo dedicado em `.agents/wayfinder/maps/tickets/`.
3. **Fluxo de Trabalho**:
   - Todo agente ao iniciar deve ler o mapa de wayfinding para entender a fronteira atual.
   - NUNCA execute tarefas sem consultar o mapa e o respectivo ticket.
   - Ao concluir uma tarefa de um ticket:
     - Marque o status do ticket como `[CONCLUÍDO]`.
     - Atualize o mapa principal na seção **Decisões / Implementações Realizadas**.
     - Desbloqueie o próximo ticket na fronteira.

