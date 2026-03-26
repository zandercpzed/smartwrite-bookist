---
name: Code Standard
description: Padrão obrigatório de redação de código no projeto Smartwrite Bookist
---

# Skill: Code Standard

## Regra Fundamental

**Todo arquivo de código criado no Bookist DEVE obrigatoriamente iniciar com o cabeçalho SADE.**  
Sem exceção. Sem "depois eu coloco". Se não tem cabeçalho, não está pronto.

---

## Padrão de Cabeçalho SADE

### JavaScript / TypeScript / MJS

```js
// SCRIPT: nome-do-arquivo.js
// DESCRIÇÃO: O que este script faz, em uma ou duas frases claras.
// CHAMADO POR: Quem invoca este arquivo (ex: CLI, orquestrador, outro script)
// CONTRATO:
//   INPUT:  O que recebe (argumentos, parâmetros, stdin)
//   OUTPUT: O que retorna ou gera (arquivo, stdout, objeto)
```

### Shell Script (Bash / Zsh)

```bash
#!/bin/zsh
# SCRIPT: nome-do-script.sh
# DESCRIÇÃO: O que este script faz, em uma ou duas frases claras.
# CHAMADO POR: Quem invoca este arquivo (ex: /eod, Makefile, usuário)
# CONTRATO:
#   INPUT:  Argumentos esperados ($1, $2, etc.)
#   OUTPUT: O que gera (arquivo, código de saída, stdout)
```

### Python

```python
# SCRIPT: nome_do_script.py
# DESCRIÇÃO: O que este script faz, em uma ou duas frases claras.
# CHAMADO POR: Quem invoca este arquivo
# CONTRATO:
#   INPUT:  Argumentos/parâmetros esperados
#   OUTPUT: O que retorna ou gera
```

---

## Demais Convenções

### Nomes de arquivos e variáveis
- Arquivos: `kebab-case` (ex: `idml-parser.js`, `render-volume.sh`)
- Variáveis e funções: `camelCase` em JS/TS, `snake_case` em Python e Shell
- Constantes: `UPPER_SNAKE_CASE`
- Classes: `PascalCase`

### Idioma do código
- **Código, variáveis, funções, comentários inline:** Inglês (EN-US)
- **Strings visíveis ao usuário final (logs, mensagens CLI):** Português (PT-BR)
- **Documentação em `_docs/` e `_arquitetura/`:** Português (PT-BR)

### Comentários Inline (Regra de Documentação Profunda)

**Todo símbolo de código relevante deve ser comentado.** Isso inclui:
- **Funções:** o que faz, de onde é chamada, o que recebe, o que retorna
- **Variáveis de escopo relevante:** de onde vem o valor, qual o formato esperado
- **Chamadas externas:** qual serviço/módulo está sendo chamado e o que se espera receber
- **Acessos a arquivos, APIs ou banco:** caminho esperado, formato de resposta, o que fazer se falhar

> Objetivo: qualquer pessoa (ou agente) deve entender o fluxo **lendo só os comentários**, sem executar o código.

```js
// ── Etapa 2: Traduzir estilos IDML para CSS ──────────────────────────────

/**
 * parseIDML
 * Chamado por: robo-render.js → orchestrate()
 * Recebe: idmlPath (string) — caminho absoluto para o arquivo .idml
 * Retorna: Promise<StyleMap> — objeto com os estilos extraídos
 * Em caso de falha: lança Error com mensagem prefixada '❌ idml-parser:'
 */
async function parseIDML(idmlPath) {
  // Abre o ZIP do IDML e localiza Resources/Styles.xml
  // Não lemos Spreads nem Stories — apenas a tipografia
  const zip = await openZip(idmlPath) // → ZipFile
  const stylesXml = await zip.read('Resources/Styles.xml') // → string XML
  ...
}
```

- Seções lógicas de um script devem ter separador visual:

```js
// ── Etapa 2: Traduzir estilos IDML para CSS ──────────────────────────────
```

### Erros e Logs
- Logs de sucesso: `✅ [nome do step]: descrição`
- Logs de aviso: `⚠️ [nome do step]: descrição`
- Logs de erro: `❌ [nome do step]: descrição`
- Nunca use `console.log` genérico em produção — use prefixo de contexto.

---

### Reaproveitamento de Código (DRY)

**Antes de criar qualquer função, módulo ou utilitário, verifique se já existe algo equivalente no projeto.**

Ordem de busca obrigatória:
1. Verificar `src/utils/` (ou equivalente) no próprio repositório
2. Verificar outros módulos do mesmo pipeline
3. Verificar dependências já instaladas
4. Só então criar algo novo

> Se criar uma função genérica nova, ela **deve** ir para `src/utils/` — nunca inline num script específico.

---

### Componentização (Design para Reuso)

**Tudo que for desenvolvido deve ser projetado como se fosse ser usado por outro sistema.**

Regras:
- **Sem acoplamento implícito:** nenhuma função deve depender de variáveis globais ou do contexto de um único script.
- **Entradas e saídas explícitas:** toda função recebe parâmetros e retorna valores — nunca lê o ambiente diretamente sem documentar.
- **Agnóstico de caminho:** caminhos de arquivo são sempre passados como parâmetro, nunca hardcoded.
- **Exportável:** todo módulo deve exportar suas funções (`module.exports` / `export`) mesmo que hoje só seja usado internamente.
- **Sem side-effects silenciosos:** se uma função grava um arquivo ou faz uma chamada de rede, isso deve estar documentado no cabeçalho.

```js
// ✅ CORRETO — componentizado, reutilizável
export async function extractStyles(idmlPath, outputDir) { ... }

// ❌ ERRADO — acoplado, não reutilizável
async function run() {
  const path = './templates/template miolo.idml' // hardcoded
  ...
}
```

---

## Exemplo Completo

```js
// SCRIPT: idml-parser.js
// DESCRIÇÃO: Extrai hierarquia tipográfica de um arquivo .idml e gera um StyleMap
// CHAMADO POR: robo-render.js → orchestrate()
// CONTRATO:
//   INPUT:  idmlPath (string) — caminho absoluto para o .idml
//           outputDir (string) — onde gravar o theme.css gerado
//   OUTPUT: Promise<StyleMap> — { paragraph: [...], character: [...], page: {...} }
//           Grava theme.css em outputDir
//   THROWS: Error('❌ idml-parser: <motivo>') se o arquivo não existir ou for inválido

import { openZip } from '../utils/zip-reader.js' // utilitário reutilizável
import { xmlToStyleMap } from '../utils/style-mapper.js' // reutilizável

/**
 * parseIDML
 * Chamado por: orchestrate() em robo-render.js
 * Recebe: idmlPath — caminho absoluto do .idml
 *         outputDir — diretório de saída para o theme.css
 * Retorna: Promise<StyleMap>
 * Falha: lança Error com prefixo '❌ idml-parser:' para ser capturado pelo orquestrador
 */
export async function parseIDML(idmlPath, outputDir) {
  // Abre o ZIP do .idml — usa utilitário compartilhado de src/utils
  const zip = await openZip(idmlPath) // → ZipFile | throws se path inválido

  // Lê apenas Resources/Styles.xml — Spreads e Stories não são necessários
  const stylesXml = await zip.read('Resources/Styles.xml') // → string XML

  // Converte o XML em StyleMap normalizado (units em pt)
  const styleMap = xmlToStyleMap(stylesXml) // → StyleMap

  return styleMap
}
```
