# 🚀 CI/CD Setup - Deploy Automático com Vercel

Este guia explica como configurar o deploy automático do site usando GitHub Actions e Vercel.

---

## 📋 Pré-requisitos

- Conta no GitHub
- Conta no Vercel (gratuita)
- Repositório: `MarceloClaro/skin-cancer-classifier`

---

## 🔧 Configuração do Vercel

### 1. Criar Conta no Vercel

1. Acesse: https://vercel.com/signup
2. Faça login com sua conta do **GitHub**
3. Autorize o Vercel a acessar seus repositórios

### 2. Importar Projeto

1. No Dashboard do Vercel, clique em **"Add New..."** → **"Project"**
2. Selecione o repositório: `MarceloClaro/skin-cancer-classifier`
3. Clique em **"Import"**

### 3. Configurar Build Settings

**Framework Preset:** `Vite`

**Build Command:**
```bash
pnpm install && pnpm build
```

**Output Directory:**
```
dist
```

**Install Command:**
```bash
pnpm install
```

**Node Version:** `22.x`

### 4. Configurar Environment Variables

Adicione as seguintes variáveis de ambiente no Vercel:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Ambiente de produção |
| `VITE_APP_TITLE` | `Classificador de Câncer de Pele K230` | Título do app |
| `GEMINI_API_KEY` | `AIzaSyA_LuWtvZeJUm-PstXayEXCwKOPCRw9yMY` | API Key do Gemini |
| `GROQ_API_KEY` | `your_groq_api_key_here` | API Key do Groq |

⚠️ **IMPORTANTE:** Nunca commite API keys no código! Use apenas variáveis de ambiente.

### 5. Deploy Inicial

1. Clique em **"Deploy"**
2. Aguarde o build completar (~3-5 minutos)
3. Copie a URL gerada (ex: `https://skin-cancer-classifier.vercel.app`)

---

## 🔐 Configurar Secrets no GitHub

### 1. Obter Tokens do Vercel

1. Acesse: https://vercel.com/account/tokens
2. Clique em **"Create Token"**
3. Nome: `GitHub Actions`
4. Scope: `Full Account`
5. Copie o token gerado

### 2. Obter Project ID e Org ID

Execute no terminal do projeto:

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Linkar projeto
vercel link

# Ver configuração
cat .vercel/project.json
```

Você verá algo como:
```json
{
  "projectId": "prj_xxxxxxxxxxxxx",
  "orgId": "team_xxxxxxxxxxxxx"
}
```

### 3. Adicionar Secrets no GitHub

1. Acesse: https://github.com/MarceloClaro/skin-cancer-classifier/settings/secrets/actions
2. Clique em **"New repository secret"**
3. Adicione os seguintes secrets:

| Name | Value | Description |
|------|-------|-------------|
| `VERCEL_TOKEN` | Token gerado no passo 1 | Token de autenticação |
| `VERCEL_ORG_ID` | `team_xxxxxxxxxxxxx` | ID da organização |
| `VERCEL_PROJECT_ID` | `prj_xxxxxxxxxxxxx` | ID do projeto |

---

## 🎯 Como Funciona

### Workflow Automático

O arquivo `.github/workflows/deploy.yml` define 3 jobs:

#### 1. **Lint & Type Check**
- Executa `tsc --noEmit` (verificação de tipos)
- Executa `eslint` (linting)
- Continua mesmo com erros (não bloqueia deploy)

#### 2. **Build**
- Instala dependências com `pnpm`
- Executa `pnpm build`
- Faz upload dos artifacts para uso posterior

#### 3. **Deploy**
- **Production:** Deploy automático quando há push na branch `main`
- **Preview:** Deploy de preview para Pull Requests

### Triggers

**Push para `main`:**
```
Commit → GitHub Actions → Build → Deploy Production → Vercel
```

**Pull Request:**
```
PR → GitHub Actions → Build → Deploy Preview → Vercel
```

---

## 📊 Monitoramento

### Ver Logs do Workflow

1. Acesse: https://github.com/MarceloClaro/skin-cancer-classifier/actions
2. Clique no workflow mais recente
3. Veja os logs de cada job

### Ver Deployments no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto
3. Veja histórico de deployments

---

## 🐛 Troubleshooting

### Build Falhou

**Erro:** `pnpm: command not found`
- **Solução:** Adicione step de setup do pnpm no workflow

**Erro:** `Module not found`
- **Solução:** Verifique se todas as dependências estão no `package.json`

**Erro:** `Type errors`
- **Solução:** Execute `pnpm exec tsc --noEmit` localmente e corrija os erros

### Deploy Falhou

**Erro:** `VERCEL_TOKEN is not set`
- **Solução:** Adicione o secret `VERCEL_TOKEN` no GitHub

**Erro:** `Project not found`
- **Solução:** Verifique se `VERCEL_PROJECT_ID` está correto

**Erro:** `Unauthorized`
- **Solução:** Regenere o token do Vercel e atualize o secret

---

## 🔄 Rollback

Se um deploy quebrar a produção:

### Via Vercel Dashboard

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto
3. Clique em **"Deployments"**
4. Encontre o último deployment funcional
5. Clique em **"..."** → **"Promote to Production"**

### Via CLI

```bash
vercel rollback
```

---

## 📈 Melhorias Futuras

- [ ] Adicionar testes automatizados (Vitest)
- [ ] Configurar Lighthouse CI para métricas de performance
- [ ] Adicionar notificações no Slack/Discord
- [ ] Configurar cache de dependências
- [ ] Adicionar análise de bundle size
- [ ] Configurar Dependabot para atualizações automáticas

---

## 📚 Recursos

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Documentation](https://vitejs.dev/)
- [pnpm Documentation](https://pnpm.io/)

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs no GitHub Actions
2. Verifique os logs no Vercel Dashboard
3. Consulte a documentação acima
4. Abra uma issue no repositório
