---
name: Debug Pipeline
description: Protocolo para diagnosticar e reportar falhas no pipeline de renderização do Bookist
---

# Skill: Debug Pipeline

## Quando Usar

Quando qualquer step do pipeline falhar:
- Extração do IDML
- Compilação do Markdown
- Renderização do PDF
- Geração do EPUB

---

## Regra Fundamental (Fail-Fast)

> Se falhou **uma vez**: Para. Analisa. Reporta. Aguarda.  
> Se falhou **duas vezes pelo mesmo motivo**: Para imediatamente. Não tente força bruta.

Nunca tente corrigir silenciosamente. O Zander precisa saber o que quebrou.

---

## Protocolo de Diagnóstico

### 1. Capturar o log completo

```bash
# Redirecionar stderr e stdout para arquivo
node robo-render.js --vol "01" > logs/run.log 2>&1
# ou
typst compile livro.typ > logs/run.log 2>&1
```

### 2. Identificar a categoria do erro

| Categoria | Sintomas Típicos | Onde Investigar |
|---|---|---|
| **Fonte não encontrada** | `font not found`, `missing glyph` | Fontes instaladas no sistema? Fallback configurado? |
| **CJK / Encoding** | Caracteres `?` ou `□` no output | UTF-8 no arquivo `.md`? Fonte com glifos CJK? |
| **Memória / Timeout** | Processo morto sem mensagem clara | Arquivo muito grande? Imagens sem resolução otimizada? |
| **IDML malformado** | `XML parse error`, `unexpected tag` | Abrir o IDML no InDesign e re-exportar |
| **Markdown inválido** | Seção faltando, frontmatter quebrado | Verificar sintaxe com `markdownlint` |
| **Caminho de arquivo** | `file not found`, `ENOENT` | Verificar nomes com espaços/acentos nos paths |

### 3. Reportar ao Zander

Use este formato no report:

```
❌ FALHA no step: [nome do step]
Comando executado: [comando exato]
Erro: [trecho relevante do log — máx. 10 linhas]
Diagnóstico: [sua hipótese sobre a causa]
Opções de correção:
  A) [opção A]
  B) [opção B]
Aguardando decisão.
```

---

## O que NUNCA fazer

- ❌ Tentar resolver silenciosamente sem avisar
- ❌ Fazer mais de 2 tentativas com a mesma abordagem
- ❌ Modificar o arquivo `.md` ou o `.idml` sem autorização
- ❌ Ignorar warnings sobre encoding ou fontes não encontradas
