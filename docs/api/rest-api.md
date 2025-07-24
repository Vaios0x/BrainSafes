# BrainSafes REST API

## Información General

- **Base URL**: `https://api.brainsafes.com/v1`
- **Formato**: JSON
- **Autenticación**: JWT Bearer Token

## Autenticación

### Obtener Token

```http
POST /auth/login
```

**Request Body**:
```json
{
    "email": "user@example.com",
    "password": "secure_password"
}
```

**Response**:
```json
{
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 3600
}
```

## Endpoints

### Usuarios

#### Registrar Usuario

```http
POST /users/register
```

**Request Body**:
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secure_password",
    "profile": {
        "bio": "Student of blockchain",
        "interests": ["AI", "Blockchain"]
    }
}
```

**Response**:
```json
{
    "user_id": "0x123...",
    "name": "John Doe",
    "email": "john@example.com",
    "profile_ipfs": "QmHash..."
}
```

#### Obtener Perfil

```http
GET /users/{address}
```

**Response**:
```json
{
    "address": "0x123...",
    "name": "John Doe",
    "reputation": 100,
    "certificates": [],
    "courses_enrolled": [],
    "achievements": []
}
```

### Cursos

#### Listar Cursos

```http
GET /courses
```

**Query Parameters**:
- `page`: Número de página (default: 1)
- `limit`: Resultados por página (default: 10)
- `category`: Filtrar por categoría
- `difficulty`: Nivel de dificultad (1-5)

**Response**:
```json
{
    "courses": [
        {
            "id": 1,
            "title": "Blockchain Basics",
            "instructor": "0x456...",
            "price": "1.0",
            "duration": "30 days",
            "students_enrolled": 150
        }
    ],
    "total": 100,
    "page": 1,
    "pages": 10
}
```

#### Detalles del Curso

```http
GET /courses/{id}
```

**Response**:
```json
{
    "id": 1,
    "title": "Blockchain Basics",
    "description": "Learn blockchain fundamentals",
    "instructor": {
        "address": "0x456...",
        "name": "Prof. Smith",
        "reputation": 95
    },
    "content": {
        "modules": [],
        "resources": [],
        "requirements": []
    },
    "metrics": {
        "rating": 4.5,
        "reviews": 50,
        "completion_rate": 85
    }
}
```

### Certificados

#### Verificar Certificado

```http
GET /certificates/verify/{id}
```

**Response**:
```json
{
    "id": "cert_123",
    "valid": true,
    "issuer": "0x789...",
    "recipient": "0x123...",
    "course": "Blockchain Basics",
    "issue_date": "2024-01-15T00:00:00Z",
    "blockchain_proof": {
        "tx_hash": "0xabc...",
        "block_number": 12345,
        "l1_confirmation": true
    }
}
```

### IA y Analytics

#### Predicción de Rendimiento

```http
GET /ai/predict/performance
```

**Query Parameters**:
- `student`: Dirección del estudiante
- `course_id`: ID del curso

**Response**:
```json
{
    "prediction": 85,
    "confidence": 0.92,
    "factors": {
        "past_performance": 0.8,
        "engagement": 0.9,
        "course_difficulty": 0.7
    },
    "recommendations": [
        "Complete prerequisite course",
        "Review module 2 materials"
    ]
}
```

### WebSocket API

#### Conexión

```javascript
const ws = new WebSocket('wss://api.brainsafes.com/ws');
```

#### Eventos

```javascript
// Suscribirse a actualizaciones de curso
ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'course_updates',
    course_id: 1
}));

// Recibir actualizaciones
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Nueva actualización:', data);
};
```

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Parámetros inválidos |
| 401 | Unauthorized - Token inválido o expirado |
| 403 | Forbidden - Sin permisos suficientes |
| 404 | Not Found - Recurso no encontrado |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error |

## Rate Limiting

- 100 requests/min para endpoints públicos
- 1000 requests/min para usuarios autenticados
- Límites personalizados para partners

## Webhooks

### Configuración

```http
POST /webhooks/configure
```

**Request Body**:
```json
{
    "url": "https://your-domain.com/webhook",
    "events": ["certificate_issued", "course_completed"],
    "secret": "your_webhook_secret"
}
```

### Formato de Eventos

```json
{
    "event": "certificate_issued",
    "timestamp": "2024-01-15T00:00:00Z",
    "data": {
        "certificate_id": "cert_123",
        "student": "0x123...",
        "course_id": 1
    },
    "signature": "abc123..."
}
```

## SDKs y Herramientas

### JavaScript/TypeScript

```typescript
import { BrainSafesAPI } from '@brainsafes/sdk';

const api = new BrainSafesAPI({
    apiKey: 'your_api_key',
    network: 'arbitrum_mainnet'
});

// Usar la API
const courses = await api.courses.list();
const certificate = await api.certificates.verify('cert_123');
```

### Python

```python
from brainsafes import BrainSafesAPI

api = BrainSafesAPI(
    api_key='your_api_key',
    network='arbitrum_mainnet'
)

# Usar la API
courses = api.courses.list()
certificate = api.certificates.verify('cert_123')
``` 