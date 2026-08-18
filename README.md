# ALMOXA PRO

Gestão Inteligente para Obras — Desktop e Mobile são **duas interfaces do
mesmo sistema**: mesmo banco, mesmas APIs, mesmas regras, mesmos usuários,
mesmo estoque, mesmas solicitações, reservas, aprovações, fichas e
notificações.

## Árvore do projeto

```
/almoxa-pro
├── index.html              → PONTE: detecta o dispositivo e redireciona
├── README.md
│
├── /core
│   ├── config.js            → única fonte de configuração (URL da API, etc.)
│   ├── device-detector.js   → detecta mobile / tablet / desktop
│   ├── router.js            → lógica da ponte (chamada por /index.html)
│   ├── session.js           → sessão do colaborador identificado
│   └── permissions.js       → views/ações permitidas por papel
│
├── /mobile
│   ├── index.html            → entrada do app Mobile
│   ├── app.js                → orquestrador (navegação, topbar, tabbar)
│   ├── mobile.css            → identidade visual
│   ├── auth.js                → tela de identificação (orquestra os 4 métodos)
│   ├── biometric.js           → "Digital" (WebAuthn)
│   ├── facial.js               → "Reconhecimento facial" (câmera)
│   ├── qrcode.js                → "QR Code / Crachá" (jsQR)
│   ├── catalogo.js              → catálogo + filtro por perfil de EPI
│   ├── carrinho.js               → carrinho + confirmação de solicitação
│   ├── solicitacoes.js            → minhas solicitações + aprovações (Segurança)
│   ├── reservas.js                 → reservas
│   ├── notificacoes.js              → notificações por papel
│   ├── fichas.js                     → histórico de fichas de EPI
│   ├── pdf.js                         → geração de PDF da ficha (jsPDF)
│   ├── dashboards.js                   → Segurança / Almoxarife / Gestor
│   └── ui-kit.js                        → toast, bottom sheet, formatação
│
├── /desktop
│   └── index.html      → PLACEHOLDER — substituir pelo build real da Fase 1
│
├── /api
│   ├── api.js               → cliente HTTP único (timeout, erro, log)
│   ├── demo-data.js          → dataset de exemplo (MODO DEMONSTRAÇÃO)
│   ├── auth-api.js            → login, biometria, facial, QR Code
│   ├── usuarios-api.js         → colaboradores
│   ├── epi-api.js               → catálogo + regra de perfil/prazo
│   ├── estoque-api.js            → estoque (mesmo para Mobile e Desktop)
│   ├── solicitacao-api.js         → solicitações + aprovação/reprovação
│   ├── reserva-api.js              → reservas + vencimento automático
│   ├── inventario-api.js            → inventário/contagem
│   ├── notificacao-api.js            → notificações por papel
│   └── pdf-api.js                     → registro de fichas (histórico)
│
└── /assets
    ├── icons
    └── images
```

## O que já está pronto (funcional, mesmo sem backend)

- Ponte com detecção automática de dispositivo + modo de teste manual
  (Mobile / Tablet / Desktop).
- Fluxo completo do Colaborador: identificação → perfil → catálogo
  filtrado por perfil de EPI → carrinho → validação de retirada anterior
  → confirmação com método de identificação → número de solicitação →
  ficha de EPI com **PDF real** (jsPDF).
- Ambientes de Segurança (aprovações, estoque), Almoxarife (conferência
  código↔item, inventário) e Gestor (indicadores).
- Reservas com vencimento automático e liberação de estoque.
- Notificações por papel.
- Camada `/api` isolada: **toda** leitura/escrita passa por ela — nenhuma
  tela acessa dado diretamente.

## O que depende de configuração externa (não fingido como pronto)

| Item | Onde | Status |
|---|---|---|
| Backend real (REST ou Google Apps Script) | `core/config.js` → `API_BASE_URL` | **Pendente** — enquanto vazio, `api/api.js` retorna `PENDING_CONFIG` e as telas mostram "MODO DEMONSTRAÇÃO" |
| Servidor de credenciais WebAuthn | `core/config.js` → `WEBAUTHN_CHALLENGE_URL` | **Pendente** — `auth-api.js` só confirma suporte do dispositivo, não aprova identidade sozinho |
| Reconhecimento facial | `mobile/facial.js` | Câmera real ativada; validação do rosto depende do mecanismo do dispositivo/servidor |
| Build real do Desktop (Fase 1) | `/desktop` | Placeholder — cole aqui o código já existente |
| Tempo real Mobile↔Desktop | `api/notificacao-api.js` | Hoje por polling; trocar por WebSocket/SSE quando o backend existir |

## Como publicar no GitHub

1. **Criar o repositório**
   ```bash
   git init almoxa-pro
   cd almoxa-pro
   # copie todos os arquivos desta entrega para dentro da pasta
   git add .
   git commit -m "ALMOXA PRO — estrutura Mobile + ponte Desktop/Mobile"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/almoxa-pro.git
   git push -u origin main
   ```

2. **Ativar o GitHub Pages**
   - No repositório: `Settings` → `Pages` → `Source: Deploy from a branch`
   - Branch: `main`, pasta: `/ (root)`
   - Salvar. O link público ficará em
     `https://SEU-USUARIO.github.io/almoxa-pro/` — esse é o **link único**
     que a seção 3 do prompt pede (a ponte cuida do resto).

3. **Configurar o endpoint do backend**
   - Edite `core/config.js` → `API_BASE_URL` com a URL real (ex.: o
     `/exec` do Google Apps Script, ou a API própria do Desktop).
   - Se usar Google Apps Script, publique o script como **Web App**
     (`Deploy → New deployment → Web app`, acesso "Anyone"), e cole a URL
     gerada em `API_BASE_URL`.
   - Faça commit e push — o app volta a usar dados reais automaticamente
     e o "MODO DEMONSTRAÇÃO" desaparece das telas.

4. **Testar Mobile e Desktop**
   - Abra a URL do GitHub Pages no celular → deve cair direto no Mobile.
   - Abra no computador → deve cair direto no placeholder do Desktop
     (ou no Desktop real, assim que os arquivos forem colados em
     `/desktop`).
   - Use o link "Modo de teste" na tela da ponte para forçar qualquer
     ambiente a partir de qualquer dispositivo.

5. **Variáveis sensíveis**
   - Não commitar tokens/credenciais em `core/config.js` público. Se o
     backend exigir chave secreta, sirva-a via variável de ambiente do
     seu próprio backend (o Mobile nunca deve guardar segredo de servidor
     no cliente).
