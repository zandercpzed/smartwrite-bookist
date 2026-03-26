---
name: Keyword Extractor
description: Conceito e protocolo para extração de keywords e construção do banco de dados semântico da coleção
---

# Skill: Keyword Extractor

> [!NOTE]
> **Status: Conceitual — não implementar ainda.**
> Esta skill documenta a ideia para não perdê-la de vista. A execução está no backlog de médio prazo (`CONCEPT-001` no roadmap).

---

## O Conceito

Ao processar os arquivos `.md` da coleção, o Bookist pode extrair entidades, termos temáticos e referências cruzadas, construindo um **índice semântico** da coleção "Clássicos do Futuro".

```
[_ texto/*.md]
      ↓
[Extrator NLP]
      ↓
[keywords.json / SQLite]
      ↓
[Índice por: obra | autor | tema | personagem | referência cruzada]
```

---

## Casos de Uso Futuros

1. **Índice remissivo automático** no final do livro (PDF/EPUB)
2. **Busca semântica** entre volumes da coleção
3. **Mapa de referências cruzadas**: "Este tema também aparece no vol. 3 e vol. 7"
4. **Metadados enriquecidos** para distribuidoras (palavras-chave no EPUB)

---

## Tecnologias a Avaliar (quando o momento chegar)

| Opção | Stack | Observação |
|---|---|---|
| `compromise` | Node.js | NLP leve, sem dependência pesada, bom para EN/PT |
| `spaCy` (pt_core_news) | Python | Mais robusto para PT-BR, mas exige Python no ambiente |
| `RAKE-NLTK` | Python | Extração de keyphrases simples e rápida |
| `Jieba` | Python/Node | Específico para CJK (Chinês) |

---

## Estrutura de Dados Proposta

```json
{
  "volume": "01. Liezi - HISTÓRIA DE YAN SHI",
  "secao": "secao-01_contexto-historico-literario.md",
  "keywords": ["automação", "androide", "Liezi", "China antiga"],
  "entidades": {
    "pessoas": ["Yan Shi", "Rei Mu"],
    "lugares": ["China"],
    "obras": ["Liezi (obra)"]
  },
  "referencias_cruzadas": []
}
```

---

## Quando Implementar

Após a **Fase 3 do Roadmap** (EPUB Validator & Single Source of Truth) estar concluída e estável. Não antes.
