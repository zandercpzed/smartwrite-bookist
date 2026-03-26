---
name: PDF Preflight
description: Checklist de validação de PDF print-ready para o pipeline Bookist
---

# Skill: PDF Preflight

## Quando Usar

Após cada geração de PDF pelo pipeline — antes de considerar o output válido.
É o equivalente digital do "preflight" que a gráfica faria ao receber o arquivo.

---

## Checklist de Conformidade (Print-Ready)

### Dimensões e Margens
- [ ] Tamanho de página: **14 × 21 cm** (140mm × 210mm)
- [ ] Sangria (bleed): **3mm** em todos os lados → página total: 146mm × 216mm
- [ ] Margens internas espelhadas (recto/verso): margem interna maior que a externa para encadernação
- [ ] Marcas de corte (crop marks) presentes

### Cores
- [ ] Modo de cor: **CMYK** (não RGB)
- [ ] Preto puro para texto: `C:0 M:0 Y:0 K:100` (não rich black)
- [ ] Imagens convertidas para CMYK com perfil ICC adequado

### Fontes
- [ ] Todas as fontes **embutidas** (embedded) no PDF
- [ ] Nenhuma fonte substituída (sem "Courier de substituição")
- [ ] Caracteres CJK (Pinyin, Hanzi) renderizados com glifos corretos

### Texto e Tipografia
- [ ] Notas de rodapé no **rodapé da página** (não endnotes)
- [ ] Entrelinha e margens visualmente consistentes com o template IDML
- [ ] Nenhum overflow de texto (caixa transbordando)

### Integridade do Arquivo
- [ ] PDF não corrompido (abre sem erros)
- [ ] Tamanho de arquivo dentro do esperado (alerta se > 50MB para texto simples)

---

## Ferramentas de Verificação

```bash
# Verificar propriedades básicas do PDF (requer poppler-utils)
pdfinfo output.pdf

# Extrair metadados e verificar modo de cor (requer ghostscript)
gs -dBATCH -dNOPAUSE -sDEVICE=inkcov -sOutputFile=/dev/null output.pdf

# Verificar fontes embutidas
pdffonts output.pdf
```

---

## Critério de Aprovação

| Severidade | Exemplos | Ação |
|---|---|---|
| 🔴 **Bloqueador** | RGB em vez de CMYK, fontes não embutidas, tamanho errado | Não entrega. Corrigir e regenerar. |
| 🟡 **Aviso** | Tamanho de arquivo alto, fonte sem glifo CJK (fallback usado) | Reportar ao Zander antes de prosseguir |
| 🟢 **OK** | Tudo conforme | Aprovado para entrega |
