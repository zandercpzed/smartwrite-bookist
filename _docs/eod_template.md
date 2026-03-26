---
description: Rotina de Fim de Dia - Status, Git Sync, Backup e Deploy
---

# Rotina EOD (Fim de Dia)

1. Verificar Status do Git
   // turbo

```bash
git status
```

2. Git Add & Commit Automático
   // turbo

```bash
git add -A
git commit -m "chore(sync): snapshot EOD" || echo "✅ Nada novo para commitar"
```

3. Push para o Remoto
   // turbo

```bash
git push origin main || echo "⚠️ Push falhou ou branch não configurada"
```

4. Criar Backup (Local)
   // turbo

```bash
DATE=$(date +%Y-%m-%d)
# O diretório _docs/ engloba os sideprojects em _docs/projeto/sideprojects
zip -r "_bkps/zedicoes_sade_${DATE}.zip" _docs/ apps/ packages/ services/ scripts/ package.json .gitignore .firebaserc firebase.json -x "*/node_modules/*" "*/dist/*" "*/.git/*" "*/.DS_Store" || echo "⚠️ Backup falhou"
```

5. Deploy Backend (Cloud Run) — **OBRIGATÓRIO**
   // turbo

```bash
gcloud builds submit --config cloudbuild-editorial.yaml --project z-sade . && \
gcloud run deploy zed-editorial-service --image gcr.io/z-sade/zed-editorial-service --region southamerica-east1 --project z-sade --allow-unauthenticated
```

> [!CAUTION]
> **REGRA DE FAIL-FAST APLICÁVEL AQUI:** Se o Deploy do Backend falhar em qualquer etapa (timeout, auth, build error), **PARE imediatamente** e comunique o problema ao humano. **NÃO TENTE DEBBUGAR OU CORRIGIR SOZINHO (Sem Rabbit Holes).**

6. Deploy Frontend (Firebase) — **OBRIGATÓRIO**
   // turbo

```bash
./scripts/deploy-frontend.sh || echo "⚠️ Deploy frontend falhou (Verifique firebase auth)"
```

> [!CAUTION]
> **REGRA DE FAIL-FAST APLICÁVEL AQUI:** Se o Deploy do Frontend falhar, aplique a mesma restrição acima. Pare e comunique imediatamente.

7. **Atualizar Backlog de Tarefas** — **OBRIGATÓRIO**

> - Leia o checklist interno da sessão ou a listagem `task.md`.
> - Cruze as informações: pegue as tarefas concluídas (marcadas com `[x]`) e faça o espelhamento marcando-as como `✅ Concluído` no respectivo documento base `_docs/BACKLOG.md` ou semelhante no qual a feature foi concebida. Se a tarefa foi em um Sideproject (ex: SADEdemo), registre no backlog correto.

8. **Atualizar Documentação do Projeto** — **OBRIGATÓRIO**

> Atualizar os docs de acompanhamento com o trabalho do dia:

**CHANGELOG.md** — Adicionar entrada do dia:

```markdown
## DD/MMM/AAAA

### Adicionado

- ...

### Alterado

- ...

### Corrigido

- ...
```

**ESTADO_ATUAL.md (HANDOVER)** — **Atualização rigorosa e obrigatória.**
Este é o documento de handover para o próximo agente. Checklist:

- [ ] **🎯 Foco Atual** — Qual ferramenta/feature está sendo trabalhada?
- [ ] **📍 Onde Paramos** — Em que fase estamos (dev/teste/deploy)? Último step concluído?
- [ ] **▶️ Próximos Passos** — Lista numerada do que fazer AGORA (recalcular!)
- [ ] **⚠️ Cuidados** — Adicionar novas armadilhas descobertas hoje
- [ ] **📂 Arquivos-Chave** — Atualizar se houve mudança de foco
- [ ] **Data** — Atualizar timestamp

> ⚠️ **Regra:** As seções 1-3 devem caber em UMA TELA (~30 linhas).
> Um novo agente deve entender o contexto em 30 segundos.

> [!IMPORTANT]
> **REGRA DE CHATS APARTADOS:** A partir de agora, tarefas distintas (ex: PDV Eventos vs Shopify) **DEVEM** ser conduzidas em chats isolados pelo humano/agente. Cada chat tem a responsabilidade de documentar seu próprio progresso no `ESTADO_ATUAL.md` na sua rotina de EOD. Nunca misture contextos.

9. Registrar Ata da Sessão (OBRIGATÓRIO)

> Usar o skill `/register-session` para compilar a ata da sessão.
> Leia o SKILL.md em `.agent/skills/register-session/SKILL.md` e siga as instruções.
> A ata é adicionada à entrada do dia no diário (`_livro/DIARIO_DESENVOLVIMENTO.md`).

10. Preparar Tarefas do Próximo Ciclo

> **Ações:**
>
> - Revisar progresso do ciclo (qual dia estamos?)
> - Identificar próximas prioridades
> - Atualizar task.md artifact com tarefas planejadas para amanhã
> - Documentar bloqueadores conhecidos

11. Atualizar Diário de Desenvolvimento (Livro)

> Adicionar entrada do dia em `_livro/DIARIO_DESENVOLVIMENTO.md` seguindo o template:
>
> - **Contexto** do dia
> - **O que foi feito** (lista objetiva)
> - **Decisões importantes** (se houver)
> - **Problemas encontrados** (se houver)
> - **Reflexão** (pensamento livre sobre o processo, aprendizados)
> - **Ata da Sessão** (gerada pelo skill `/register-session` no step 9)
>
> ⚠️ Este registro alimenta o livro sobre Vibe Coding. Escrever com cuidado narrativo.

12. **Atualizar Prompt de Handover** — **OBRIGATÓRIO**

> Ao final do EOD, atualizar `_docs/PROMPT_HANDOVER.md` com:
> - Estado atual do sistema (branch, revisões, URLs em produção)
> - Pendências prioritárias para a próxima sessão (P1, P2, P3)
> - Cuidados e armadilhas descobertas na sessão
> - O prompt completo para o próximo agente (copiar e colar no início do novo chat)
