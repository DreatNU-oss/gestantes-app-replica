# API do App Mobile — Gestantesapp

**Versão:** 1.0  
**Base URL:** `https://gestantesapp.com/api/trpc`  
**Protocolo:** tRPC sobre HTTP (JSON)  
**Autenticação:** Token de sessão da gestante (obtido via fluxo de login)

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Como Fazer Requisições tRPC](#2-como-fazer-requisições-trpc)
3. [Fluxo de Autenticação](#3-fluxo-de-autenticação)
   - 3.1 [gestante.solicitarCodigo](#31-gestantesolicitarcodigo)
   - 3.2 [gestante.validarCodigo](#32-gestantevalidarcodigo)
   - 3.3 [gestante.logout](#33-gestantelogout)
4. [Dados da Gestante](#4-dados-da-gestante)
   - 4.1 [gestante.me](#41-gestanteme)
   - 4.2 [gestante.marcos](#42-gestantemarcos)
   - 4.3 [gestante.consultas](#43-gestanteconsultas)
   - 4.4 [gestante.exames](#44-gestanteexames)
   - 4.5 [gestante.ultrassons](#45-gestanteultrassons)
   - 4.6 [gestante.peso](#46-gestantepeso)
5. [Upload de Exames](#5-upload-de-exames)
   - 5.1 [gestante.uploadExame](#51-gestanteuploadexame) ⭐
6. [PDF do Cartão de Pré-Natal](#6-pdf-do-cartão-de-pré-natal)
   - 6.1 [gestante.gerarPdfCartao](#61-gestantegerarpdfcartao)
7. [Tratamento de Erros](#7-tratamento-de-erros)
8. [Exemplos de Código](#8-exemplos-de-código)
9. [Considerações de Implementação](#9-considerações-de-implementação)

---

## 1. Visão Geral

Todas as rotas do app mobile fazem parte do namespace `gestante` e são **rotas públicas** — não exigem sessão de médico/admin. A autenticação é feita exclusivamente por um **token de sessão da gestante**, obtido após o login com código de verificação por e-mail.

O token tem validade de **30 dias** a partir da emissão. O app deve armazená-lo localmente (ex.: `AsyncStorage` no React Native) e incluí-lo em todas as requisições subsequentes.

---

## 2. Como Fazer Requisições tRPC

O tRPC usa HTTP padrão. Existem dois tipos de operação:

| Tipo tRPC | Método HTTP | Uso |
|---|---|---|
| `query` | `GET` | Leitura de dados |
| `mutation` | `POST` | Escrita, upload, ações |

### Query (GET)

```
GET /api/trpc/{rota}?input={JSON_ENCODED}
```

O parâmetro `input` deve ser um objeto JSON codificado em URL com a chave `json`:

```
GET /api/trpc/gestante.me?input=%7B%22json%22%3A%7B%22token%22%3A%22SEU_TOKEN%22%7D%7D
```

### Mutation (POST)

```
POST /api/trpc/{rota}
Content-Type: application/json

{"json": { ...campos }}
```

### Resposta padrão de sucesso

```json
{
  "result": {
    "data": {
      "json": { ...dados_retornados }
    }
  }
}
```

### Resposta padrão de erro

```json
{
  "error": {
    "json": {
      "message": "Descrição do erro",
      "code": -32600,
      "data": {
        "code": "BAD_REQUEST",
        "httpStatus": 400
      }
    }
  }
}
```

---

## 3. Fluxo de Autenticação

O login do app usa verificação em dois passos: primeiro solicita um código de 6 dígitos enviado por e-mail, depois valida esse código e recebe o token de sessão.

```
App                          Servidor
 |                               |
 |-- solicitarCodigo(email) ---> |  Envia e-mail com código de 6 dígitos
 |                               |  (válido por 15 minutos)
 |<-- { success: true } ------  |
 |                               |
 |-- validarCodigo(email, cod) ->|  Valida código, cria sessão
 |                               |
 |<-- { token, gestante } -----  |  Token válido por 30 dias
 |                               |
 |  [usa token em todas as       |
 |   requisições seguintes]      |
```

---

### 3.1 `gestante.solicitarCodigo`

Solicita o envio de um código de verificação de 6 dígitos para o e-mail da gestante.

**Tipo:** `mutation` (POST)  
**Autenticação:** Não requerida

#### Corpo da requisição

```json
{
  "json": {
    "contato": "paciente@email.com",
    "tipo": "email"
  }
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `contato` | `string` (e-mail válido) | **Sim** | E-mail cadastrado da gestante |
| `tipo` | `"email"` | Não | Tipo de envio. Atualmente apenas `"email"` é suportado. Padrão: `"email"` |

#### Resposta de sucesso

```json
{
  "result": {
    "data": {
      "json": {
        "success": true,
        "message": "Código enviado para seu email",
        "gestanteNome": "Maria"
      }
    }
  }
}
```

#### Resposta quando e-mail não encontrado

```json
{
  "result": {
    "data": {
      "json": {
        "success": false,
        "error": "Gestante não encontrada com este contato"
      }
    }
  }
}
```

> **Nota:** O código expira em **15 minutos**. Se o usuário não receber o e-mail, pode solicitar um novo código chamando esta rota novamente.

---

### 3.2 `gestante.validarCodigo`

Valida o código de verificação e cria uma sessão autenticada.

**Tipo:** `mutation` (POST)  
**Autenticação:** Não requerida

#### Corpo da requisição

```json
{
  "json": {
    "contato": "paciente@email.com",
    "codigo": "123456",
    "dispositivo": "iPhone 15 Pro"
  }
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `contato` | `string` (e-mail válido) | **Sim** | E-mail da gestante |
| `codigo` | `string` (exatamente 6 caracteres) | **Sim** | Código recebido por e-mail |
| `dispositivo` | `string` | Não | Identificador do dispositivo (para logs de acesso) |

#### Resposta de sucesso

```json
{
  "result": {
    "data": {
      "json": {
        "success": true,
        "token": "a1b2c3d4e5f6...",
        "gestante": {
          "id": 42,
          "nome": "Maria da Silva",
          "email": "paciente@email.com"
        },
        "expiraEm": "2026-04-21T15:00:00.000Z"
      }
    }
  }
}
```

| Campo retornado | Tipo | Descrição |
|---|---|---|
| `token` | `string` | Token de sessão — **armazenar localmente** |
| `gestante.id` | `number` | ID interno da gestante |
| `gestante.nome` | `string` | Nome completo |
| `gestante.email` | `string` | E-mail |
| `expiraEm` | `string` (ISO 8601) | Data/hora de expiração do token |

#### Resposta de erro (código inválido ou expirado)

```json
{
  "result": {
    "data": {
      "json": {
        "success": false,
        "error": "Código inválido ou expirado"
      }
    }
  }
}
```

> **Conta de teste (Apple App Store Review):**  
> E-mail: `dreatnu@yahoo.com` | Código fixo: `123456`  
> Esta conta ignora o fluxo de e-mail e sempre aceita o código `123456`.

---

### 3.3 `gestante.logout`

Invalida o token de sessão atual.

**Tipo:** `mutation` (POST)  
**Autenticação:** Token da gestante

#### Corpo da requisição

```json
{
  "json": {
    "token": "SEU_TOKEN"
  }
}
```

#### Resposta

```json
{
  "result": {
    "data": {
      "json": { "success": true }
    }
  }
}
```

---

## 4. Dados da Gestante

Todas as rotas desta seção são `query` (GET) e exigem o token de sessão.

---

### 4.1 `gestante.me`

Retorna os dados cadastrais da gestante autenticada, incluindo cálculos de idade gestacional e DPP.

**Tipo:** `query` (GET)

#### Parâmetros

```json
{ "json": { "token": "SEU_TOKEN" } }
```

#### Resposta

```json
{
  "id": "42",
  "nome": "Maria da Silva",
  "email": "paciente@email.com",
  "telefone": "35991375232",
  "dataNascimento": "1995-03-15",
  "dum": "2025-07-01",
  "dataUltrassom": "2025-09-10",
  "igUltrassomSemanas": 10,
  "igUltrassomDias": 3,
  "altura": 165,
  "pesoInicial": 62.5,
  "tipoPartoDesejado": "cesariana",
  "gesta": 2,
  "para": 1,
  "cesareas": 1,
  "abortos": 0,
  "calculado": {
    "igDUM": { "semanas": 37, "dias": 4, "totalDias": 263 },
    "igUS":  { "semanas": 37, "dias": 5, "totalDias": 264 },
    "dppDUM": "2026-04-07",
    "dppUS":  "2026-04-06"
  }
}
```

> **Nota:** O campo `id` é retornado como `string` para compatibilidade com JSON. Converter para `number` se necessário.

---

### 4.2 `gestante.marcos`

Retorna os marcos gestacionais calculados (vacinas, exames, consultas recomendadas).

**Tipo:** `query` (GET)

#### Resposta resumida

```json
{
  "dpp": "2026-04-06",
  "marcos": [
    {
      "semana": 11,
      "titulo": "Ultrassom Morfológico 1º Trimestre",
      "descricao": "...",
      "dataInicio": "2025-09-22",
      "dataFim": "2025-10-06"
    }
  ]
}
```

---

### 4.3 `gestante.consultas`

Retorna o histórico de consultas pré-natais.

**Tipo:** `query` (GET)

#### Resposta resumida

```json
{
  "consultas": [
    {
      "id": 1,
      "dataConsulta": "2025-08-15",
      "peso": 63.2,
      "pressaoSistolica": 110,
      "pressaoDiastolica": 70,
      "alturaUterina": 28.5,
      "igSemanas": 28,
      "igDias": 3
    }
  ]
}
```

> **Nota:** `alturaUterina` é retornado em **centímetros** (cm).

---

### 4.4 `gestante.exames`

Retorna os resultados de exames laboratoriais agrupados por nome do exame.

**Tipo:** `query` (GET)

#### Resposta resumida

```json
{
  "exames": [
    {
      "nome": "Hemoglobina",
      "resultados": [
        { "data": "2025-08-01", "resultado": "12.5 g/dL", "trimestre": 2 }
      ]
    }
  ]
}
```

---

### 4.5 `gestante.ultrassons`

Retorna os laudos de ultrassom registrados.

**Tipo:** `query` (GET)

#### Resposta resumida

```json
{
  "ultrassons": [
    {
      "id": 1,
      "tipoUltrassom": "morfologico_1_trimestre",
      "dataExame": "2025-09-22",
      "igSemanas": 12,
      "igDias": 1,
      "dppCalculado": "2026-04-06"
    }
  ]
}
```

---

### 4.6 `gestante.peso`

Retorna os dados de evolução de peso com curva de ganho ideal.

**Tipo:** `query` (GET)

#### Resposta resumida

```json
{
  "pesoInicial": 62.5,
  "altura": 165,
  "imcPreGestacional": 22.96,
  "categoriaIMC": "Eutrófica",
  "dadosPeso": [
    { "data": "2025-08-15", "peso": 63.2, "igSemanas": 6.2 }
  ],
  "ganhoIdeal": {
    "ganhoTotalMin": 11.5,
    "ganhoTotalMax": 16.0,
    "curva": [
      { "semana": 13, "min": 0.5, "max": 2.0 }
    ]
  }
}
```

---

## 5. Upload de Exames

---

### 5.1 `gestante.uploadExame`

Envia um arquivo de exame (laboratorial ou ultrassom) para revisão pelo médico. O arquivo é armazenado no S3 e interpretado automaticamente por IA em segundo plano. O médico recebe uma notificação por WhatsApp imediatamente após o recebimento.

**Tipo:** `mutation` (POST)  
**Autenticação:** Token da gestante  
**Limite de arquivo:** **16 MB** (após decodificação Base64)

> ⚠️ **Atenção sobre o limite:** O Base64 aumenta o tamanho do arquivo em aproximadamente 33%. Um arquivo de 12 MB em disco resulta em ~16 MB de string Base64. **Recomenda-se limitar o arquivo original a 11 MB** no app para garantir margem segura.

#### Endpoint

```
POST https://gestantesapp.com/api/trpc/gestante.uploadExame
Content-Type: application/json
```

#### Corpo da requisição

```json
{
  "json": {
    "token": "SEU_TOKEN",
    "nomeArquivo": "hemograma_completo.pdf",
    "tipoArquivo": "application/pdf",
    "fileBase64": "JVBERi0xLjQK...",
    "tipoExame": "laboratorial",
    "trimestre": 2,
    "dataColeta": "2026-03-20",
    "observacoes": "Exame do segundo trimestre"
  }
}
```

#### Parâmetros detalhados

| Campo | Tipo | Obrigatório | Valores aceitos | Descrição |
|---|---|---|---|---|
| `token` | `string` | **Sim** | — | Token de sessão da gestante |
| `nomeArquivo` | `string` | **Sim** | — | Nome original do arquivo, com extensão (ex: `exame.pdf`) |
| `tipoArquivo` | `string` | **Sim** | `application/pdf`, `image/jpeg`, `image/png` | MIME type do arquivo |
| `fileBase64` | `string` | **Sim** | — | Conteúdo do arquivo codificado em Base64 puro (sem prefixo `data:...;base64,`) |
| `tipoExame` | `string` (enum) | **Sim** | `"laboratorial"`, `"ultrassom"` | Categoria do exame para roteamento da IA |
| `trimestre` | `number` | Não | `1`, `2`, `3` | Trimestre da gestação. Se omitido, a IA tentará detectar automaticamente |
| `dataColeta` | `string` | Não | `YYYY-MM-DD` | Data em que o exame foi coletado/realizado |
| `observacoes` | `string` | Não | — | Observações livres da gestante |

#### Resposta de sucesso (HTTP 200)

```json
{
  "result": {
    "data": {
      "json": {
        "success": true,
        "id": 87,
        "s3Url": "https://storage.manus.space/exames/42/1711123456789-abc123.pdf",
        "status": "pendente_revisao",
        "mensagem": "Exame enviado com sucesso. Aguardando revisão do médico."
      }
    }
  }
}
```

| Campo retornado | Tipo | Descrição |
|---|---|---|
| `success` | `boolean` | Sempre `true` em caso de sucesso |
| `id` | `number` | ID do registro criado no banco de dados |
| `s3Url` | `string` | URL pública do arquivo armazenado no S3 |
| `status` | `"pendente_revisao"` | Status inicial — aguardando revisão do médico |
| `mensagem` | `string` | Mensagem de confirmação legível |

#### Ciclo de vida do exame após o upload

```
Upload recebido
      │
      ▼
status: pendente_revisao
      │
      ├─── IA interpreta em background (assíncrono, não bloqueia resposta)
      │         • laboratorial → extrai resultados, valores de referência
      │         • ultrassom    → extrai biometria, DPP, IG calculada
      │
      ├─── WhatsApp enviado ao(s) médico(s) da clínica (fire-and-forget)
      │         • Notifica todos os usuários admin e obstetra da clínica
      │
      └─── Médico revisa na página "Exames Pendentes" do sistema
                │
                ├── Confirma → status: confirmado
                └── Rejeita  → status: rejeitado
```

#### Erros possíveis

| Código tRPC | HTTP | Mensagem | Causa |
|---|---|---|---|
| `BAD_REQUEST` | 400 | `"Arquivo excede o limite de 16MB"` | `fileBase64` decodificado supera 16 MB |
| `UNAUTHORIZED` | 401 | `"Token inválido ou expirado"` | Token ausente, inválido ou expirado |
| `INTERNAL_SERVER_ERROR` | 500 | `"Erro ao fazer upload do exame"` | Falha no S3 ou banco de dados |

---

#### Exemplo completo em Swift (iOS)

```swift
func uploadExame(token: String, fileURL: URL, tipoExame: String) async throws {
    let fileData = try Data(contentsOf: fileURL)
    
    // Verificar tamanho antes de enviar (limite: ~11 MB para segurança)
    guard fileData.count <= 11 * 1024 * 1024 else {
        throw UploadError.fileTooLarge
    }
    
    let base64 = fileData.base64EncodedString()
    let mimeType = fileURL.pathExtension.lowercased() == "pdf" 
        ? "application/pdf" : "image/jpeg"
    
    let body: [String: Any] = [
        "json": [
            "token": token,
            "nomeArquivo": fileURL.lastPathComponent,
            "tipoArquivo": mimeType,
            "fileBase64": base64,
            "tipoExame": tipoExame,  // "laboratorial" ou "ultrassom"
            "dataColeta": ISO8601DateFormatter().string(from: Date())
                .prefix(10)  // "YYYY-MM-DD"
        ]
    ]
    
    var request = URLRequest(url: URL(string: 
        "https://gestantesapp.com/api/trpc/gestante.uploadExame")!)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try JSONSerialization.data(withJSONObject: body)
    
    let (data, response) = try await URLSession.shared.data(for: request)
    // Processar resposta...
}
```

#### Exemplo completo em Kotlin (Android)

```kotlin
suspend fun uploadExame(
    token: String,
    fileBytes: ByteArray,
    fileName: String,
    mimeType: String,
    tipoExame: String
): UploadResult {
    // Verificar tamanho antes de enviar
    require(fileBytes.size <= 11 * 1024 * 1024) { "Arquivo muito grande (máx. 11 MB)" }
    
    val base64 = Base64.encodeToString(fileBytes, Base64.NO_WRAP)
    
    val json = JSONObject().apply {
        put("json", JSONObject().apply {
            put("token", token)
            put("nomeArquivo", fileName)
            put("tipoArquivo", mimeType)
            put("fileBase64", base64)
            put("tipoExame", tipoExame)  // "laboratorial" ou "ultrassom"
        })
    }
    
    val client = OkHttpClient()
    val request = Request.Builder()
        .url("https://gestantesapp.com/api/trpc/gestante.uploadExame")
        .post(json.toString().toRequestBody("application/json".toMediaType()))
        .build()
    
    val response = client.newCall(request).execute()
    // Processar resposta...
}
```

#### Exemplo em React Native (JavaScript/TypeScript)

```typescript
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

async function uploadExame(token: string, tipoExame: 'laboratorial' | 'ultrassom') {
  // 1. Selecionar arquivo
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/jpeg', 'image/png'],
  });
  if (result.canceled) return;

  const file = result.assets[0];

  // 2. Verificar tamanho (máx. 11 MB)
  if (file.size && file.size > 11 * 1024 * 1024) {
    alert('Arquivo muito grande. O limite é 11 MB.');
    return;
  }

  // 3. Converter para Base64
  const base64 = await FileSystem.readAsStringAsync(file.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 4. Enviar para a API
  const response = await fetch(
    'https://gestantesapp.com/api/trpc/gestante.uploadExame',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: {
          token,
          nomeArquivo: file.name,
          tipoArquivo: file.mimeType ?? 'application/pdf',
          fileBase64: base64,
          tipoExame,
          dataColeta: new Date().toISOString().slice(0, 10), // "YYYY-MM-DD"
        },
      }),
    }
  );

  const data = await response.json();
  const payload = data?.result?.data?.json;

  if (payload?.success) {
    alert(`Exame enviado! ID: ${payload.id}\nStatus: ${payload.status}`);
  } else {
    alert(`Erro: ${data?.error?.json?.message ?? 'Erro desconhecido'}`);
  }
}
```

---

## 6. PDF do Cartão de Pré-Natal

---

### 6.1 `gestante.gerarPdfCartao`

Gera o PDF do Cartão de Pré-Natal da gestante e retorna a URL do arquivo no S3.

**Tipo:** `mutation` (POST)  
**Autenticação:** Token da gestante

#### Corpo da requisição

```json
{
  "json": { "token": "SEU_TOKEN" }
}
```

#### Resposta

```json
{
  "result": {
    "data": {
      "json": {
        "pdfUrl": "https://storage.manus.space/cartoes-prenatal/42/cartao-prenatal-maria-da-silva-1711123456789.pdf",
        "filename": "cartao-prenatal-maria-da-silva.pdf"
      }
    }
  }
}
```

---

## 7. Tratamento de Erros

### Códigos de erro tRPC

| Código tRPC | HTTP | Situação típica |
|---|---|---|
| `UNAUTHORIZED` | 401 | Token ausente, inválido ou expirado |
| `BAD_REQUEST` | 400 | Parâmetros inválidos ou arquivo muito grande |
| `NOT_FOUND` | 404 | Gestante não encontrada |
| `INTERNAL_SERVER_ERROR` | 500 | Erro no servidor (S3, banco de dados, IA) |

### Estrutura do erro

```json
{
  "error": {
    "json": {
      "message": "Token inválido ou expirado",
      "code": -32600,
      "data": {
        "code": "UNAUTHORIZED",
        "httpStatus": 401,
        "path": "gestante.uploadExame"
      }
    }
  }
}
```

### Recomendações de tratamento no app

O app deve verificar a presença de `result.data.json` para sucesso e `error.json` para falha. Em caso de `UNAUTHORIZED`, redirecionar para a tela de login. Para `INTERNAL_SERVER_ERROR`, exibir mensagem de erro amigável e permitir nova tentativa.

---

## 8. Exemplos de Código

### Função genérica de requisição tRPC (React Native / TypeScript)

```typescript
const BASE_URL = 'https://gestantesapp.com/api/trpc';

async function trpcQuery<T>(route: string, token: string): Promise<T> {
  const input = encodeURIComponent(JSON.stringify({ json: { token } }));
  const res = await fetch(`${BASE_URL}/${route}?input=${input}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.json.message);
  return data.result.data.json as T;
}

async function trpcMutation<I, T>(route: string, input: I): Promise<T> {
  const res = await fetch(`${BASE_URL}/${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ json: input }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.json.message);
  return data.result.data.json as T;
}

// Uso:
const gestante = await trpcQuery('gestante.me', meuToken);
const marcos = await trpcQuery('gestante.marcos', meuToken);
```

---

## 9. Considerações de Implementação

### Armazenamento do token

O token deve ser armazenado de forma segura no dispositivo. Em React Native, recomenda-se `expo-secure-store` ou `react-native-keychain` em vez de `AsyncStorage` simples, pois o token concede acesso a dados sensíveis de saúde.

### Renovação do token

O token expira em 30 dias. O app deve detectar erros `UNAUTHORIZED` e redirecionar para o fluxo de login. Não há rota de renovação automática — o usuário precisa fazer login novamente.

### Upload de arquivos grandes

Para arquivos próximos ao limite de 11 MB, considere:
- Comprimir imagens antes do upload (qualidade 80–85% é suficiente para laudos)
- Exibir barra de progresso durante a codificação Base64 (operação síncrona que pode travar a UI)
- Executar a codificação em uma thread separada (`InteractionManager.runAfterInteractions` no React Native)

### Interpretação por IA (assíncrona)

A interpretação por IA ocorre **após** a resposta da rota `uploadExame`. O app não precisa aguardar nem fazer polling. O médico verá os resultados da IA na interface de revisão do sistema web quando disponíveis.

### Notificação ao médico

Imediatamente após o upload, o sistema envia automaticamente uma mensagem WhatsApp para todos os médicos (admin e obstetras) da clínica da gestante. O app não precisa fazer nenhuma ação adicional para isso.

### Formatos de arquivo recomendados

| Tipo de exame | Formato preferido | Motivo |
|---|---|---|
| Exame laboratorial | `application/pdf` | Melhor extração de texto pela IA |
| Ultrassom (laudo) | `application/pdf` | Melhor extração de texto pela IA |
| Ultrassom (imagem) | `image/jpeg` | Aceitável quando só há foto do laudo |
| Foto de resultado | `image/png` | Aceitável, porém PDF é preferível |

---

*Documentação gerada em 22/03/2026 — gestantesapp.com v1.0*
