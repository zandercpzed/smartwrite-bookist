---
name: Session Register
description: Registra a ata da sessão de trabalho no 99_DIÁRIO.md do Bookist
---

# Skill: Session Register

## Quando Usar

Obrigatório no `/eod`, step 1 — antes do commit Git.
Também pode ser chamado durante a sessão para registrar uma decisão importante no momento em que ela ocorre.

---

## O que Registrar

Uma entrada de sessão deve responder:

1. **Quando?** — Data e horário aproximado
2. **Quem?** — Participantes (Zander + Agente, ou só um deles)
3. **O que foi discutido?** — Tópicos da sessão, em linguagem natural
4. **Que decisões foram tomadas?** — Liste apenas as decisões, não o debate
5. **O que ficou pendente?** — Próximos passos imediatos

---

## Formato da Entrada

Adicione ao final de `_docs/99_DIÁRIO.md`:

```markdown
## AAAA-MM-DD — [Título curto descritivo da sessão]

**Participantes:** Zander + Agente

[Parágrafo narrativo descrevendo o contexto e o que foi feito. 
Escreva como um humano escreveria num diário de bordo — não como uma lista de commits.]

**Decisões tomadas:**
- [Decisão 1]
- [Decisão 2]

**Pendências imediatas:**
- [Próximo passo 1]
- [Próximo passo 2]

---
```

---

## Regras

1. **Tom humano, não técnico.** O Diário é memória narrativa — não um changelog.
2. **Seja seletivo.** Registre decisões e descobertas relevantes, não cada arquivo editado.
3. **Nunca sobrescreva entradas anteriores.** Sempre adicione ao final.
4. **Se a sessão não teve decisões relevantes**, registre brevemente assim mesmo — até "sessão de refinamentos de documentação" é válido.
