# ⚡ rimuhunt

> **Investigação OSINT profunda de pegada digital de contas Google / Gmail em JavaScript nativo (Node.js ESM) com zero dependências externas e zero build step.**
> *Desenvolvido por Lucas (`rimublinda`).*

[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Module Type](https://img.shields.io/badge/ESM-Native-yellow.svg)](https://nodejs.org/api/esm.html)
[![Zero Build](https://img.shields.io/badge/Build%20Step-Zero%20(No%20TSC)-blue.svg)](#)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20(Pure%20Node.js)-success.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🎯 Visão Geral

O **rimuhunt** é o sucessor moderno e em JavaScript puro de ferramentas legadas de OSINT para ecossistemas Google (como o GHunt em Python). Desenvolvido para investigadores de segurança da informação, analistas de ameaças e auditorias de privacidade (self-OSINT), ele mapeia a presença pública de um endereço Google (`@gmail.com` ou Workspace) ou Gaia ID numérico em milissegundos, sem exigir Python, compiladores TypeScript (`tsc`), pip ou ferramentas de emulação de navegador.

### 🚀 Por que JavaScript Nativo (Node.js ESM)?

| Recurso | Ferramentas Legadas (Python/GHunt) | rimuhunt (Node.js ESM) |
| :--- | :--- | :--- |
| **Ambiente de Execução** | Python 3.10+, pip, venv, pacotes C | **Node.js 18+ nativo ("type": "module")** |
| **Tempo de Inicialização** | ~1.5s - 3.0s | **< 25ms** (instantâneo) |
| **Build Step** | Requer compilação ou pip install | **Zero Build Step** (`npx rimuhunt`) |
| **Dependências Externas** | 15+ bibliotecas externas | **0 dependências** (Usa `fetch`, `crypto`, `parseArgs` nativos) |
| **Tipagem e Autocomplete** | Parcial via TypeHints | **100% tipado com JSDoc** para VS Code e IDEs |
| **Portabilidade** | Apenas CLI terminal | **CLI + Lib NPM + Servidor Micro-API com SSE** |

---

## 🔍 O que a ferramenta extrai

1. **Identificação & Gaia ID**:
   - Resolução ou validação do **Gaia ID** (identificador numérico interno de 64 bits do Google).
   - Nome real de exibição associado à conta pública.
   - Detecção de serviços Google vinculados (Gmail, Calendar, Maps, YouTube).
2. **Avatar HD Original (=s0)**:
   - Extração do link da foto original de perfil em alta definição sem recorte (`=s0`), contornando miniaturas comprimidas (`=s96-c`).
   - Diferenciação precisa entre avatar padrão do Google (inicial/silhueta) e fotografia personalizada.
3. **Google Maps & Histórico Geográfico**:
   - Perfil de contribuidor público (`/maps/contrib/{gaiaId}`).
   - Nível do programa **Local Guides** e contagem total de avaliações, fotos e notas.
   - Detecção de coordenadas geográficas (latitude e longitude) de locais avaliados.
   - **Exportação nativa em GeoJSON (RFC 7946)** pronta para plotagem em QGIS, Leaflet, Keplr.gl ou Google Earth.
4. **Google Calendar**:
   - Teste de visibilidade da agenda principal (Pública vs Privada).
   - Fuso horário configurado na conta.
   - Eventos públicos futuros e link do feed iCal (`.ics`).
5. **YouTube**:
   - Presença de canal público, identificador `@handle` e contagem de playlists abertas.

---

## 📦 Formas de Uso

### 1. Linha de Comando (CLI)

Execução instantânea sem instalar nada:

```bash
# Investigar por endereço de e-mail
npx rimuhunt alvo@gmail.com

# Investigar diretamente por Gaia ID numérico
npx rimuhunt 104857602938475610293

# Exportar histórico de locais diretamente para arquivo GeoJSON
npx rimuhunt alvo@gmail.com --geojson -o mapa_alvo.geojson

# Exportar resultado completo em JSON estruturado
npx rimuhunt alvo@gmail.com --json > resultado.json

# Modo aprofundado com cookies de sessão do Google
npx rimuhunt alvo@gmail.com --cookies "SID=...; HSID=...; SAPISID=..."
```

#### Opções da CLI:

```text
OPÇÕES:
  --geojson                  Gera saída em formato GeoJSON (RFC 7946) com os pontos do Maps
  --json                     Exibe os dados brutos consolidados em formato JSON
  -o, --output <arquivo>     Salva o resultado ou GeoJSON diretamente no arquivo especificado
  --cookies <string>         Cookies de sessão do Google ("SID=...; HSID=...") para dados aprofundados
  --timeout <ms>             Tempo limite por requisição em milissegundos (padrão: 10000)
  --server [porta]           Inicia a micro-API REST com streaming SSE (padrão: porta 3000)
  -h, --help                 Exibe ajuda interativa
  -v, --version              Exibe a versão atual do rimuhunt
```

---

### 2. Como Biblioteca NPM

Importe diretamente em suas aplicações Node.js:

```javascript
import { investigateGoogle } from 'rimuhunt';

const result = await investigateGoogle('alvo@gmail.com', {
  timeoutMs: 8000,
  onProgress: ({ module, status }) => {
    console.log(`[+] Módulo ${module} finalizado com status: ${status}`);
  }
});

console.log('Gaia ID:', result.gaia.gaiaId);
console.log('Avatar HD:', result.avatar.originalHdUrl);
console.log('Locais no Maps:', result.maps.reviews.length);
console.log('Agenda Pública:', result.calendar.isPublic);
```

#### Módulos individuais disponíveis para importação:

```javascript
import {
  resolveGaia,
  getAvatar,
  getMapsProfile,
  checkCalendar,
  checkYouTube,
  buildGeoJSON,
  saveGeoJSON
} from 'rimuhunt';
```

---

### 3. Servidor Micro-API com Streaming SSE

Inicie o servidor HTTP embutido com streaming em tempo real:

```bash
npx rimuhunt --server 3000
```

- **Interface Web**: Abra `http://localhost:3000` no navegador para consultar alvos interativamente.
- **Streaming SSE**: `GET /investigate?target=alvo@gmail.com` emite eventos em tempo real (`progress`, `done`, `error`).
- **GeoJSON Endpoint**: `GET /geojson?target=alvo@gmail.com` retorna o mapa em formato GeoJSON direto para GIS ou front-end.
- **Health Check**: `GET /health`

---

## 🛡️ Guia de Hardening & Privacidade (Defesa do Titular)

O `rimuhunt` pode e deve ser utilizado para **auditoria da sua própria conta**. Caso você identifique informações expostas, siga os passos abaixo para restringir sua pegada digital:

1. **Ocultar Avaliações no Google Maps**:
   - Abra o aplicativo do **Google Maps** no smartphone.
   - Toque na sua foto de perfil > **Configurações** > **Conteúdo pessoal**.
   - Ative a opção **"Restringir perfil"** para que apenas pessoas aprovadas vejam suas avaliações e fotos.
2. **Proteger o Google Calendar**:
   - Acesse [Google Agenda](https://calendar.google.com/) no desktop.
   - Vá em **Configurações da agenda** da sua agenda principal.
   - Na seção **"Autorizações de acesso a eventos"**, desmarque a opção **"Disponibilizar ao público"**.
3. **Restringir Foto de Perfil**:
   - Acesse [Minha Conta Google](https://myaccount.google.com/).
   - Vá em **Informações pessoais** > **Foto de perfil** e defina a visibilidade como **"Apenas seus contatos"**.
4. **Privatizar Playlists do YouTube**:
   - Acesse [YouTube Studio](https://studio.youtube.com/) > **Conteúdo** > **Playlists**.
   - Defina suas listas de reprodução como **"Privadas"** ou **"Não listadas"**.

---

## 🧪 Testes Automatizados

O projeto inclui suíte de testes com o test runner nativo do Node.js:

```bash
npm test
```

Executa todos os testes unitários e de integração em menos de 1 segundo sem qualquer dependência externa.

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para mais informações.
