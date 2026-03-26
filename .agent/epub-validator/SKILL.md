---
name: EPUB Validator
description: Guia de validação de EPUB3 gerado pelo pipeline Bookist
---

# Skill: EPUB Validator

## Quando Usar

Após cada geração de EPUB pelo pipeline — antes de considerar o output válido.

---

## Ferramenta Principal: epubcheck

```bash
# Instalar (requer Java)
# Download: https://github.com/w3c/epubcheck/releases

# Validar um EPUB
java -jar epubcheck.jar output/livro.epub
```

> Se `epubcheck` não estiver instalado, use o validador online: https://www.epubcheck.org

---

## Interpretar os Resultados

| Tipo | Significado | Ação |
|---|---|---|
| `ERROR` | Violação da spec EPUB3 — distribuidoras rejeitarão | 🔴 Bloqueador — corrigir antes de avançar |
| `WARNING` | Recomendação não seguida | 🟡 Reportar ao Zander |
| `INFO` | Informativo | 🟢 Ignorar |

---

## Checklist Manual (além do epubcheck)

### Estrutura Obrigatória
- [ ] `mimetype` como primeiro arquivo, não comprimido
- [ ] `META-INF/container.xml` presente
- [ ] `nav.xhtml` (sumário) presente e com âncoras funcionais
- [ ] Todos os arquivos referenciados no `content.opf` existem fisicamente

### Conteúdo
- [ ] Todos os capítulos/seções presentes na ordem correta
- [ ] Notas de rodapé vinculadas corretamente (link bidirecional: texto ↔ nota)
- [ ] Imagens com atributo `alt` (acessibilidade)
- [ ] Metadados completos no `content.opf`: título, autor, ISBN, idioma, data

### Legibilidade
- [ ] Abre sem erro nos leitores: **Apple Books**, **Calibre**
- [ ] Fonte e tamanho legíveis em e-ink (teste visual)
- [ ] Caracteres CJK renderizados corretamente

---

## Metadados Mínimos Obrigatórios no `content.opf`

```xml
<dc:title>[Título]</dc:title>
<dc:creator>[Autor]</dc:creator>
<dc:language>pt-BR</dc:language>
<dc:identifier id="uid">isbn:[ISBN]</dc:identifier>
<dc:date>[AAAA-MM-DD]</dc:date>
<meta property="dcterms:modified">[AAAA-MM-DDTHH:MM:SSZ]</meta>
```

---

## Critério de Aprovação

- **Zero ERRORs** no epubcheck = aprovado para entrega
- WARNINGs devem ser reportados mas não bloqueiam (a critério do Zander)
