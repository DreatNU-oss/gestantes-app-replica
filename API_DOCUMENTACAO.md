# API REST - App Gestantes (Mais Mulher)

**Versão:** 1.0.0  
**Base URL:** `https://seu-dominio.com/api/gestante`  
**Autor:** Manus AI  
**Data:** 15/12/2025

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Endpoints](#endpoints)
4. [Modelos de Dados](#modelos-de-dados)
5. [Códigos de Erro](#códigos-de-erro)
6. [Exemplos de Integração](#exemplos-de-integração)
7. [Conformidade LGPD](#conformidade-lgpd)

---

## Visão Geral

Esta API REST foi desenvolvida para permitir que gestantes acessem seus dados de acompanhamento pré-natal de forma segura através de um aplicativo móvel nativo (Android/iOS). A API implementa autenticação por código de verificação enviado por email, garantindo que apenas a gestante tenha acesso aos seus próprios dados.

### Características Principais

| Característica | Descrição |
|----------------|-----------|
| **Autenticação** | Código de 6 dígitos enviado por email (válido por 15 minutos) |
| **Sessão** | Token JWT com validade de 30 dias |
| **Formato** | JSON |
| **Segurança** | HTTPS obrigatório, isolamento de dados por gestante |
| **LGPD** | Logs de acesso para auditoria |

---

## Autenticação

A autenticação é feita em duas etapas:

1. **Solicitar código**: A gestante informa seu email cadastrado e recebe um código de 6 dígitos
2. **Validar código**: Com o código, a gestante obtém um token JWT para acessar a API

### Headers Obrigatórios

Para endpoints protegidos, inclua o header:

```
Authorization: Bearer {token}
```

---

## Endpoints

### Autenticação

#### POST /auth/solicitar-codigo

Solicita o envio de um código de acesso para o email da gestante.

**Request Body:**
```json
{
  "contato": "email@exemplo.com",
  "tipo": "email"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| contato | string | Sim | Email ou telefone cadastrado |
| tipo | string | Não | Tipo de envio: "email" (padrão), "sms", "whatsapp" |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Código enviado para seu email",
  "gestanteNome": "Maria"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Gestante não encontrada com este contato"
}
```

---

#### POST /auth/validar

Valida o código recebido e retorna o token de acesso.

**Request Body:**
```json
{
  "contato": "email@exemplo.com",
  "codigo": "123456",
  "dispositivo": "iPhone 15 Pro - iOS 17.2"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| contato | string | Sim | Email ou telefone usado na solicitação |
| codigo | string | Sim | Código de 6 dígitos recebido |
| dispositivo | string | Não | Identificação do dispositivo para logs |

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "gestante": {
    "id": 1,
    "nome": "Maria Silva",
    "email": "maria@exemplo.com"
  },
  "expiraEm": "2026-01-14T12:00:00.000Z"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Código inválido ou expirado"
}
```

---

#### POST /auth/logout

Encerra a sessão atual.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

### Dados da Gestante

#### GET /me

Retorna os dados pessoais e obstétricos da gestante logada.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "nome": "Maria Silva Santos",
  "dataNascimento": "1990-05-15",
  "telefone": "11999998888",
  "email": "maria@exemplo.com",
  "dum": "2024-06-01",
  "dataUltrassom": "2024-07-15",
  "igUltrassomSemanas": 8,
  "igUltrassomDias": 3,
  "tipoPartoDesejado": "normal",
  "gesta": 2,
  "para": 1,
  "cesareas": 0,
  "abortos": 0,
  "altura": 165,
  "pesoInicial": 62000,
  "calculado": {
    "igDUM": {
      "semanas": 28,
      "dias": 4,
      "totalDias": 200
    },
    "igUS": {
      "semanas": 28,
      "dias": 2,
      "totalDias": 198
    },
    "dppDUM": "2025-03-08",
    "dppUS": "2025-03-06"
  }
}
```

---

#### GET /marcos

Retorna os marcos importantes da gestação com datas calculadas.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "dpp": "2025-03-06",
  "marcos": [
    {
      "nome": "Concepção",
      "data": "2024-06-13",
      "semana": 0,
      "descricao": "Data estimada da concepção"
    },
    {
      "nome": "Morfológico 1º Trimestre",
      "dataInicio": "2024-08-22",
      "dataFim": "2024-09-12",
      "semana": "11-14",
      "descricao": "Ultrassom morfológico do primeiro trimestre"
    },
    {
      "nome": "13 Semanas",
      "data": "2024-09-05",
      "semana": 13,
      "descricao": "Fim do primeiro trimestre"
    },
    {
      "nome": "Morfológico 2º Trimestre",
      "dataInicio": "2024-10-24",
      "dataFim": "2024-11-21",
      "semana": "20-24",
      "descricao": "Ultrassom morfológico do segundo trimestre"
    },
    {
      "nome": "Vacina dTpa",
      "data": "2024-12-12",
      "semana": 27,
      "descricao": "Vacina contra difteria, tétano e coqueluche"
    },
    {
      "nome": "Vacina Bronquiolite",
      "dataInicio": "2025-01-09",
      "dataFim": "2025-02-06",
      "semana": "32-36",
      "descricao": "Vacina contra bronquiolite (VSR)"
    },
    {
      "nome": "Termo Precoce",
      "data": "2025-02-13",
      "semana": 37,
      "descricao": "Início do termo precoce"
    },
    {
      "nome": "Termo Completo",
      "data": "2025-02-27",
      "semana": 39,
      "descricao": "Início do termo completo"
    },
    {
      "nome": "DPP (40 semanas)",
      "data": "2025-03-06",
      "semana": 40,
      "descricao": "Data Provável do Parto"
    }
  ]
}
```

---

#### GET /consultas

Retorna o histórico de consultas pré-natais.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "consultas": [
    {
      "id": 15,
      "gestanteId": 1,
      "dataConsulta": "2024-12-10",
      "igSemanas": 27,
      "igDias": 2,
      "peso": 68500,
      "pressaoSistolica": 110,
      "pressaoDiastolica": 70,
      "alturaUterina": 27,
      "bcf": 142,
      "movimentosFetais": "presentes",
      "edema": "ausente",
      "queixas": null,
      "condutas": "Manter acompanhamento",
      "proximaConsulta": "2024-12-24",
      "createdAt": "2024-12-10T14:30:00.000Z"
    }
  ]
}
```

---

#### GET /exames

Retorna os exames laboratoriais agrupados por tipo.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "exames": [
    {
      "nome": "Hemoglobina",
      "resultados": [
        {
          "data": "2024-07-20",
          "resultado": "12.5 g/dL",
          "igSemanas": 8,
          "igDias": 5
        },
        {
          "data": "2024-11-15",
          "resultado": "11.8 g/dL",
          "igSemanas": 24,
          "igDias": 2
        }
      ]
    },
    {
      "nome": "Glicemia de Jejum",
      "resultados": [
        {
          "data": "2024-07-20",
          "resultado": "85 mg/dL",
          "igSemanas": 8,
          "igDias": 5
        }
      ]
    }
  ]
}
```

---

#### GET /ultrassons

Retorna o histórico de ultrassons realizados.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "ultrassons": [
    {
      "id": 3,
      "gestanteId": 1,
      "tipoExame": "Morfológico 2º Trimestre",
      "dataExame": "2024-11-10",
      "igSemanas": 22,
      "igDias": 4,
      "resultado": "Exame dentro da normalidade. Biometria compatível com IG.",
      "observacoes": "Sexo: feminino",
      "arquivoUrl": "https://storage.example.com/ultrassons/us_22sem.pdf"
    }
  ]
}
```

---

#### GET /peso

Retorna dados para construção da curva de ganho de peso.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "pesoInicial": 62000,
  "altura": 165,
  "imcPreGestacional": 22.77,
  "categoriaIMC": "Peso Adequado",
  "dadosPeso": [
    {
      "data": "2024-07-20",
      "peso": 62500,
      "igSemanas": 8.71
    },
    {
      "data": "2024-09-15",
      "peso": 64000,
      "igSemanas": 16.86
    },
    {
      "data": "2024-11-10",
      "peso": 66500,
      "igSemanas": 24.86
    },
    {
      "data": "2024-12-10",
      "peso": 68500,
      "igSemanas": 28.29
    }
  ],
  "ganhoIdeal": {
    "ganhoTotalMin": 11.5,
    "ganhoTotalMax": 16,
    "curva": [
      { "semana": 0, "pesoMin": 62000, "pesoMax": 62000, "pesoIdeal": 62000 },
      { "semana": 13, "pesoMin": 63437, "pesoMax": 64000, "pesoIdeal": 63718 },
      { "semana": 20, "pesoMin": 65875, "pesoMax": 68000, "pesoIdeal": 66937 },
      { "semana": 28, "pesoMin": 68750, "pesoMax": 72500, "pesoIdeal": 70625 },
      { "semana": 40, "pesoMin": 73500, "pesoMax": 78000, "pesoIdeal": 75750 }
    ]
  }
}
```

---

## Modelos de Dados

### Gestante

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | number | ID único da gestante |
| nome | string | Nome completo |
| dataNascimento | string | Data de nascimento (YYYY-MM-DD) |
| telefone | string | Telefone com DDD |
| email | string | Email |
| dum | string | Data da última menstruação (YYYY-MM-DD) |
| dataUltrassom | string | Data do ultrassom de datação (YYYY-MM-DD) |
| igUltrassomSemanas | number | IG no ultrassom (semanas) |
| igUltrassomDias | number | IG no ultrassom (dias) |
| tipoPartoDesejado | string | "cesariana", "normal" ou "a_definir" |
| gesta | number | Número de gestações |
| para | number | Número de partos |
| cesareas | number | Número de cesáreas |
| abortos | number | Número de abortos |
| altura | number | Altura em centímetros |
| pesoInicial | number | Peso pré-gestacional em gramas |

### Consulta Pré-Natal

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | number | ID da consulta |
| dataConsulta | string | Data da consulta (YYYY-MM-DD) |
| igSemanas | number | Idade gestacional (semanas) |
| igDias | number | Idade gestacional (dias) |
| peso | number | Peso em gramas |
| pressaoSistolica | number | PA sistólica (mmHg) |
| pressaoDiastolica | number | PA diastólica (mmHg) |
| alturaUterina | number | Altura uterina (cm) |
| bcf | number | Batimentos cardíacos fetais (bpm) |
| movimentosFetais | string | "presentes", "ausentes" ou "diminuídos" |
| edema | string | "ausente", "leve", "moderado" ou "grave" |
| queixas | string | Queixas relatadas |
| condutas | string | Condutas médicas |
| proximaConsulta | string | Data da próxima consulta |

---

## Códigos de Erro

| Código HTTP | Erro | Descrição |
|-------------|------|-----------|
| 400 | Bad Request | Parâmetros inválidos ou ausentes |
| 401 | Unauthorized | Token não fornecido ou inválido |
| 403 | Forbidden | Acesso negado ao recurso |
| 404 | Not Found | Recurso não encontrado |
| 500 | Internal Server Error | Erro interno do servidor |

### Formato de Erro

```json
{
  "error": "Descrição do erro"
}
```

---

## Exemplos de Integração

### React Native (Axios)

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://seu-dominio.com/api/gestante',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('gestante_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Solicitar código
export const solicitarCodigo = async (email) => {
  const response = await api.post('/auth/solicitar-codigo', {
    contato: email,
    tipo: 'email',
  });
  return response.data;
};

// Validar código e fazer login
export const login = async (email, codigo) => {
  const response = await api.post('/auth/validar', {
    contato: email,
    codigo,
    dispositivo: `${Platform.OS} - ${Platform.Version}`,
  });
  
  if (response.data.success) {
    await AsyncStorage.setItem('gestante_token', response.data.token);
  }
  
  return response.data;
};

// Buscar dados da gestante
export const getGestante = async () => {
  const response = await api.get('/me');
  return response.data;
};

// Buscar marcos
export const getMarcos = async () => {
  const response = await api.get('/marcos');
  return response.data;
};

// Buscar consultas
export const getConsultas = async () => {
  const response = await api.get('/consultas');
  return response.data;
};

// Buscar dados de peso
export const getDadosPeso = async () => {
  const response = await api.get('/peso');
  return response.data;
};
```

### Flutter (Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class GestanteApi {
  static const String baseUrl = 'https://seu-dominio.com/api/gestante';
  
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('gestante_token');
  }
  
  static Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
  
  static Future<Map<String, dynamic>> solicitarCodigo(String email) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/solicitar-codigo'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'contato': email,
        'tipo': 'email',
      }),
    );
    return jsonDecode(response.body);
  }
  
  static Future<Map<String, dynamic>> login(String email, String codigo) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/validar'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'contato': email,
        'codigo': codigo,
      }),
    );
    
    final data = jsonDecode(response.body);
    
    if (data['success'] == true) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('gestante_token', data['token']);
    }
    
    return data;
  }
  
  static Future<Map<String, dynamic>> getGestante() async {
    final response = await http.get(
      Uri.parse('$baseUrl/me'),
      headers: await _getHeaders(),
    );
    return jsonDecode(response.body);
  }
  
  static Future<Map<String, dynamic>> getMarcos() async {
    final response = await http.get(
      Uri.parse('$baseUrl/marcos'),
      headers: await _getHeaders(),
    );
    return jsonDecode(response.body);
  }
  
  static Future<Map<String, dynamic>> getDadosPeso() async {
    final response = await http.get(
      Uri.parse('$baseUrl/peso'),
      headers: await _getHeaders(),
    );
    return jsonDecode(response.body);
  }
}
```

---

## Conformidade LGPD

Esta API foi desenvolvida em conformidade com a Lei Geral de Proteção de Dados (LGPD):

### Medidas Implementadas

| Medida | Descrição |
|--------|-----------|
| **Isolamento de dados** | Cada gestante só acessa seus próprios dados através do token JWT |
| **Autenticação segura** | Código de verificação com validade limitada (15 minutos) |
| **Logs de acesso** | Todas as requisições são registradas para auditoria |
| **Dados mínimos** | API retorna apenas dados necessários, sem informações sensíveis desnecessárias |
| **Sessões rastreáveis** | Cada sessão é registrada com dispositivo e IP para controle |

### Dados Armazenados nos Logs

- ID da gestante
- ID da sessão
- Ação realizada
- Recurso acessado
- IP de origem
- User-Agent do dispositivo
- Data/hora do acesso

### Recomendações para o App

1. **Não armazenar dados sensíveis** localmente sem criptografia
2. **Implementar timeout de sessão** no app (sugestão: 30 minutos de inatividade)
3. **Solicitar permissão** antes de acessar recursos do dispositivo
4. **Oferecer opção de logout** visível e acessível
5. **Exibir política de privacidade** no primeiro acesso

---

## Suporte

Para dúvidas sobre a integração ou problemas técnicos, entre em contato com a equipe de desenvolvimento.

---

*Documentação gerada em 15/12/2025*
