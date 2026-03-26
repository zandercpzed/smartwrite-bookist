---
name: Golden Rules (Regras de Ouro)
description: Protocolo fundamental de trabalho do projeto Smartwrite Bookist
---

# Skill: Golden Rules (Regras de Ouro)

## Quando Usar Esta Skill

Execute esta skill:

- **Início de cada sessão** (via workflow `/sod`, step 1)
- Quando houver dúvida sobre procedimentos
- Após violação de uma regra

---

## Regras de Ouro — Smartwrite Bookist

### 1. Princípio Fundamental

Nenhuma execução de código, criação de arquivos ou alteração de ambiente será feita sem autorização expressa do Zander.

### 2. Rituais Obrigatórios (Rotinas)

O trabalho **sempre** deve ser encapsulado por estes workflows:

- **SOD (Start of Day):** `/sod` — Contexto, Ambiente, Planejamento.
- **EOD (End of Day):** `/eod` — Documentação, Git Sync, Handover.
- **EOW (End of Week):** `/eow` — Revisão de Sprint, Testes, Cleanup.

_Motivo:_ Consistência e rastreabilidade. Nenhuma sessão começa sem contexto, nenhuma termina sem registro.

---

### 3. Ciclo de Trabalho Obrigatório (A.P.A.E.)

**Todas** as interações de desenvolvimento devem seguir esta ordem:

1. **ANALISAR**
   - Entender o pedido
   - Ler arquivos relevantes (prioridade: local > busca externa)
   - Verificar estado atual do código/ambiente
   - Identificar problemas e requisitos

2. **PLANEJAR**
   - Propor solução detalhada com lista de passos
   - **OBRIGATÓRIO:** Criar/atualizar `task.md` e `implementation_plan.md` **antes** de pedir autorização
   - Nunca guardar o plano apenas na memória da sessão — sempre em disco

3. **AUTORIZAR**
   - Solicitar validação explícita do Zander
   - Perguntar: _"Posso prosseguir?"_
   - **AGUARDAR** resposta afirmativa. Se não houve "Sim", não há execução.

4. **EXECUTAR**
   - Implementar apenas o que foi aprovado no plano
   - Ao término, atualizar `_docs/03_BACKLOG.md` com status dos itens concluídos
   - Rodar `/eod` ao final da sessão

---

### 4. Tolerância Zero a Alucinação

1. **Não inventar capacidades:** Se uma ação não é possível tecnicamente, diga _"Não consigo fazer isso"_. Nunca simule.
2. **Não chutar:** Se não sabe, pergunte.
3. **Hierarquia de busca obrigatória:**
   - 1º: Localmente (`.agent/`, `_docs/`, `_arquitetura/`, código fonte)
   - 2º: Busca externa (apenas se necessário e autorizado)

---

### 5. Pastas Protegidas (não enviar ao GitHub)

As seguintes pastas são **locais** e devem constar no `.gitignore`:

- `_bkps/` — Backups manuais locais
- `_resources/` — Assets brutos, referências pesadas

> ⚠️ `_docs/`, `_arquitetura/` e `_agent/` são parte da documentação do projeto e **devem** ir para o repositório remoto.

---

### 6. Regra do Erro Único (Fail-Fast)

Se uma operação falhar **uma única vez**:

1. **PARE** a execução
2. Leia os logs
3. Explique o erro ao Zander
4. **Aguarde** decisão sobre como corrigir

Se falhar **2x pelo mesmo motivo**:

1. **PARE IMEDIATAMENTE** — não tente força bruta
2. Comunique e aguarde instruções

---

### 7. Comando "PARE" (Interrupção Imediata)

Se o Zander disser **"PARE"**, "STOP" ou "CHEGA":

1. **INTERROMPA** imediatamente — nem termine o passo atual
2. **NÃO JUSTIFIQUE** ações anteriores
3. Confirme a parada e aguarde novas instruções em estado neutro

_Motivo:_ O usuário pode ter visto um erro crítico que o agente ainda não percebeu.

---

## Checklist de Validação (antes de cada ação significativa)

- [ ] Entendi completamente o pedido? *(ANALISAR)*
- [ ] Criei/atualizei o plano em disco? *(PLANEJAR)*
- [ ] Obtive autorização explícita do Zander? *(AUTORIZAR)*
- [ ] O que afirmei é tecnicamente 100% verdadeiro? *(ANTI-ALUCINAÇÃO)*
- [ ] Vou modificar pastas protegidas? *(Se sim, STOP)*
- [ ] Esta é a 2ª falha consecutiva pelo mesmo motivo? *(Se sim, STOP)*
