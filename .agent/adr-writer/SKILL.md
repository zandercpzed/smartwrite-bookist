---
name: ADR Writer
description: Guia para redigir Architecture Decision Records (ADRs) no projeto Bookist
---

# Skill: ADR Writer

## Quando Usar

Sempre que uma decisão de arquitetura for tomada ou rejeitada:
- Escolha de linguagem, framework ou biblioteca
- Definição de formato de entrada ou saída
- Adoção ou descarte de uma ferramenta externa
- Qualquer decisão que seja difícil ou cara de reverter

---

## Onde Salvar

```
_arquitetura/ADR-NNN_nome-curto-da-decisao.md
```

- `NNN` = número sequencial com 3 dígitos (ex: `001`, `002`)
- Nome em kebab-case, descritivo e curto
- Exemplos: `ADR-001_stack-tecnologica.md`, `ADR-002_idml-to-theme-strategy.md`

---

## Template

```markdown
# ADR-NNN: [Título da Decisão]

**Status:** [EM DISCUSSÃO | APROVADO | REJEITADO | SUBSTITUÍDO por ADR-NNN]
**Data:** AAAA-MM-DD
**Decisores:** [Zander / Agente]

---

## Contexto

[Por que esta decisão foi necessária? Qual problema estávamos resolvendo?
Seja específico sobre os requisitos que motivaram a discussão.]

## Alternativas Consideradas

| Opção | Prós | Contras |
|---|---|---|
| Opção A | ... | ... |
| Opção B | ... | ... |

## Decisão

[Qual opção foi escolhida e por quê? Seja direto.
Ex: "Adotamos Typst como engine de PDF porque..."]

## Consequências

**Positivas:**
- ...

**Negativas / Trade-offs:**
- ...

**Pendências abertas:**
- [ ] ...
```

---

## Regras

1. **Um ADR por decisão.** Não agrupe decisões distintas no mesmo arquivo.
2. **Status é obrigatório.** Um ADR sem status é um ADR inútil.
3. **Nunca delete um ADR** — apenas marque como `SUBSTITUÍDO por ADR-NNN`.
4. **Toda alternativa rejeitada deve estar documentada** — quem vier depois precisa entender por que X não foi escolhido.
5. **Atualize o HANDOVER** (`_docs/04_HANDOVER.md`) quando um ADR for aprovado.
6. **Registre no Diário** (`_docs/99_DIÁRIO.md`) a data e o número do ADR aprovado.
