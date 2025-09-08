#!/bin/bash

# Script de instalación para Analytics y Seguridad Avanzados
# BrainSafes - Blockchain Developer Senior

set -e

echo "🚀 Instalando Analytics y Seguridad Avanzados para BrainSafes"
echo "================================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "No se encontró package.json. Ejecuta este script desde el directorio raíz del proyecto."
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js no está instalado. Por favor instala Node.js 16+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    log_error "Node.js versión 16+ es requerida. Versión actual: $(node -v)"
    exit 1
fi

log_success "Node.js $(node -v) detectado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    log_error "npm no está instalado"
    exit 1
fi

log_success "npm $(npm -v) detectado"

# Crear directorios necesarios
log_info "Creando directorios necesarios..."
mkdir -p logs
mkdir -p fiat-payments-backend/logs
mkdir -p frontend/src/components/Dashboard

# Instalar dependencias del backend
log_info "Instalando dependencias del backend..."
cd fiat-payments-backend

# Verificar si package.json existe
if [ ! -f "package.json" ]; then
    log_error "No se encontró package.json en fiat-payments-backend/"
    exit 1
fi

# Instalar dependencias
npm install

# Verificar dependencias específicas
log_info "Verificando dependencias específicas..."
REQUIRED_DEPS=("geoip-lite" "ua-parser-js" "express-rate-limit" "helmet" "cors")

for dep in "${REQUIRED_DEPS[@]}"; do
    if npm list "$dep" > /dev/null 2>&1; then
        log_success "$dep instalado correctamente"
    else
        log_error "$dep no está instalado"
        exit 1
    fi
done

cd ..

# Instalar dependencias del frontend
log_info "Instalando dependencias del frontend..."
cd frontend

# Verificar si package.json existe
if [ ! -f "package.json" ]; then
    log_error "No se encontró package.json en frontend/"
    exit 1
fi

# Instalar dependencias
npm install

# Verificar dependencias específicas del frontend
log_info "Verificando dependencias del frontend..."
FRONTEND_DEPS=("react-chartjs-2" "chart.js" "framer-motion")

for dep in "${FRONTEND_DEPS[@]}"; do
    if npm list "$dep" > /dev/null 2>&1; then
        log_success "$dep instalado correctamente"
    else
        log_warning "$dep no está instalado - instalando..."
        npm install "$dep"
    fi
done

cd ..

# Crear archivo de configuración de ejemplo
log_info "Creando archivo de configuración de ejemplo..."
cat > .env.example << 'EOF'
# Configuración de seguridad
CORS_ORIGIN=http://localhost:3000,https://brainsafes.com
JWT_SECRET=your_jwt_secret_here
WEBHOOK_SECRET=your_webhook_secret_here

# Configuración de analytics
ANALYTICS_ENABLED=true
ML_MODELS_ENABLED=true
ANOMALY_DETECTION_ENABLED=true

# Configuración de alertas
SLACK_WEBHOOK_URL=your_slack_webhook_url
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Configuración de base de datos
MONGO_URI=mongodb://localhost:27017/brainsafes

# Configuración de IPFS
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
IPFS_PROTOCOL=https
IPFS_PROJECT_ID=your_project_id
IPFS_PROJECT_SECRET=your_project_secret

# Configuración de Arbitrum
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
ARBITRUM_CHAIN_ID=42161

# Configuración de email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@brainsafes.com

# Configuración de Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=noreply@brainsafes.com

# Configuración de SMS
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
EOF

# Verificar si .env existe
if [ ! -f ".env" ]; then
    log_warning "Archivo .env no encontrado. Copiando .env.example..."
    cp .env.example .env
    log_info "Por favor edita el archivo .env con tus configuraciones reales"
else
    log_success "Archivo .env encontrado"
fi

# Crear script de inicio
log_info "Creando script de inicio..."
cat > start-advanced-analytics.sh << 'EOF'
#!/bin/bash

# Script de inicio para Analytics y Seguridad Avanzados
# BrainSafes

set -e

echo "🚀 Iniciando Analytics y Seguridad Avanzados para BrainSafes"
echo "================================================================"

# Verificar archivo .env
if [ ! -f ".env" ]; then
    echo "❌ Archivo .env no encontrado. Por favor crea uno basado en .env.example"
    exit 1
fi

# Cargar variables de entorno
export $(cat .env | grep -v '^#' | xargs)

# Iniciar backend
echo "📡 Iniciando backend..."
cd fiat-payments-backend
npm start &
BACKEND_PID=$!

# Esperar un momento para que el backend se inicie
sleep 5

# Verificar si el backend está funcionando
if curl -s http://localhost:4000/health > /dev/null; then
    echo "✅ Backend iniciado correctamente en http://localhost:4000"
else
    echo "❌ Error iniciando backend"
    exit 1
fi

cd ..

# Iniciar frontend
echo "🌐 Iniciando frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!

# Esperar un momento para que el frontend se inicie
sleep 10

# Verificar si el frontend está funcionando
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend iniciado correctamente en http://localhost:3000"
else
    echo "❌ Error iniciando frontend"
    exit 1
fi

cd ..

echo ""
echo "🎉 ¡Sistema iniciado correctamente!"
echo ""
echo "📊 Dashboard Analytics: http://localhost:3000/dashboard/advanced"
echo "📚 Documentación API: http://localhost:4000/api/docs"
echo "🔒 Métricas de Seguridad: http://localhost:4000/api/advanced-analytics/security"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"

# Función para limpiar al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ Servicios detenidos"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Mantener el script ejecutándose
wait
EOF

chmod +x start-advanced-analytics.sh

# Crear script de tests
log_info "Creando script de tests..."
cat > test-advanced-analytics.sh << 'EOF'
#!/bin/bash

# Script de tests para Analytics y Seguridad Avanzados
# BrainSafes

set -e

echo "🧪 Ejecutando tests de Analytics y Seguridad Avanzados"
echo "======================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test del backend
log_info "Probando backend..."
cd fiat-payments-backend

# Test de health check
if curl -s http://localhost:4000/health | grep -q "ok"; then
    log_success "Health check OK"
else
    log_error "Health check falló"
    exit 1
fi

# Test de analytics
if curl -s http://localhost:4000/api/advanced-analytics/dashboard | grep -q "success"; then
    log_success "API de analytics OK"
else
    log_error "API de analytics falló"
    exit 1
fi

# Test de seguridad
if curl -s http://localhost:4000/api/advanced-analytics/security | grep -q "success"; then
    log_success "API de seguridad OK"
else
    log_error "API de seguridad falló"
    exit 1
fi

cd ..

# Test del frontend
log_info "Probando frontend..."
if curl -s http://localhost:3000 | grep -q "BrainSafes"; then
    log_success "Frontend OK"
else
    log_error "Frontend falló"
    exit 1
fi

echo ""
log_success "✅ Todos los tests pasaron correctamente!"
echo ""
echo "🎉 El sistema está funcionando correctamente"
echo ""
echo "📊 Dashboard: http://localhost:3000/dashboard/advanced"
echo "📚 API Docs: http://localhost:4000/api/docs"
echo "🔒 Security: http://localhost:4000/api/advanced-analytics/security"
EOF

chmod +x test-advanced-analytics.sh

# Crear script de monitoreo
log_info "Creando script de monitoreo..."
cat > monitor-advanced-analytics.sh << 'EOF'
#!/bin/bash

# Script de monitoreo para Analytics y Seguridad Avanzados
# BrainSafes

set -e

echo "📊 Monitoreando Analytics y Seguridad Avanzados"
echo "==============================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para obtener métricas
get_metrics() {
    local endpoint=$1
    local name=$2
    
    if response=$(curl -s "http://localhost:4000$endpoint" 2>/dev/null); then
        if echo "$response" | grep -q "success"; then
            log_success "$name: OK"
            return 0
        else
            log_error "$name: Falló"
            return 1
        fi
    else
        log_error "$name: No disponible"
        return 1
    fi
}

# Monitoreo continuo
while true; do
    echo ""
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Monitoreando servicios..."
    echo "=================================================="
    
    # Verificar backend
    get_metrics "/health" "Backend Health"
    
    # Verificar analytics
    get_metrics "/api/advanced-analytics/dashboard" "Analytics Dashboard"
    
    # Verificar seguridad
    get_metrics "/api/advanced-analytics/security" "Security Metrics"
    
    # Verificar frontend
    if curl -s http://localhost:3000 > /dev/null; then
        log_success "Frontend: OK"
    else
        log_error "Frontend: No disponible"
    fi
    
    # Verificar logs
    if [ -f "fiat-payments-backend/logs/advanced-analytics.log" ]; then
        log_success "Analytics Logs: OK"
    else
        log_warning "Analytics Logs: No encontrados"
    fi
    
    if [ -f "fiat-payments-backend/logs/advanced-security.log" ]; then
        log_success "Security Logs: OK"
    else
        log_warning "Security Logs: No encontrados"
    fi
    
    echo ""
    echo "Esperando 30 segundos para el próximo check..."
    sleep 30
done
EOF

chmod +x monitor-advanced-analytics.sh

# Crear README de instalación
log_info "Creando README de instalación..."
cat > INSTALL_ADVANCED_ANALYTICS.md << 'EOF'
# Instalación de Analytics y Seguridad Avanzados

## Requisitos Previos

- Node.js 16+ 
- npm
- Git

## Instalación Automática

1. Ejecuta el script de instalación:
```bash
chmod +x scripts/install-advanced-analytics.sh
./scripts/install-advanced-analytics.sh
```

2. Configura las variables de entorno:
```bash
cp .env.example .env
# Edita .env con tus configuraciones reales
```

3. Inicia el sistema:
```bash
./start-advanced-analytics.sh
```

## Instalación Manual

### Backend

1. Instalar dependencias:
```bash
cd fiat-payments-backend
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env
```

3. Iniciar servidor:
```bash
npm start
```

### Frontend

1. Instalar dependencias:
```bash
cd frontend
npm install
```

2. Iniciar desarrollo:
```bash
npm run dev
```

## Verificación

Ejecuta los tests:
```bash
./test-advanced-analytics.sh
```

## Monitoreo

Monitorear en tiempo real:
```bash
./monitor-advanced-analytics.sh
```

## URLs Importantes

- **Dashboard Analytics**: http://localhost:3000/dashboard/advanced
- **API Documentation**: http://localhost:4000/api/docs
- **Health Check**: http://localhost:4000/health
- **Security Metrics**: http://localhost:4000/api/advanced-analytics/security

## Estructura de Archivos

```
├── fiat-payments-backend/
│   ├── src/
│   │   ├── services/
│   │   │   └── advancedAnalyticsManager.js
│   │   ├── middleware/
│   │   │   └── advancedSecurity.js
│   │   └── routes/
│   │       └── advancedAnalytics.js
│   └── logs/
│       ├── advanced-analytics.log
│       └── advanced-security.log
├── frontend/
│   └── src/
│       └── components/
│           └── Dashboard/
│               └── AdvancedAnalyticsDashboard.jsx
└── docs/
    └── ADVANCED_ANALYTICS_AND_SECURITY.md
```

## Troubleshooting

### Problemas Comunes

1. **Puerto 4000 ocupado**:
   ```bash
   lsof -ti:4000 | xargs kill -9
   ```

2. **Puerto 3000 ocupado**:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

3. **Dependencias faltantes**:
   ```bash
   cd fiat-payments-backend && npm install
   cd ../frontend && npm install
   ```

4. **Logs de error**:
   ```bash
   tail -f fiat-payments-backend/logs/error.log
   ```

## Soporte

Para soporte técnico, consulta la documentación completa en:
`docs/ADVANCED_ANALYTICS_AND_SECURITY.md`
EOF

# Verificar instalación
log_info "Verificando instalación..."

# Verificar archivos creados
FILES_TO_CHECK=(
    "fiat-payments-backend/src/services/advancedAnalyticsManager.js"
    "fiat-payments-backend/src/middleware/advancedSecurity.js"
    "fiat-payments-backend/src/routes/advancedAnalytics.js"
    "frontend/src/components/Dashboard/AdvancedAnalyticsDashboard.jsx"
    "docs/ADVANCED_ANALYTICS_AND_SECURITY.md"
    ".env.example"
    "start-advanced-analytics.sh"
    "test-advanced-analytics.sh"
    "monitor-advanced-analytics.sh"
    "INSTALL_ADVANCED_ANALYTICS.md"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        log_success "$file creado correctamente"
    else
        log_error "$file no encontrado"
        exit 1
    fi
done

# Verificar dependencias instaladas
log_info "Verificando dependencias..."

cd fiat-payments-backend
if npm list geoip-lite > /dev/null 2>&1; then
    log_success "geoip-lite instalado"
else
    log_error "geoip-lite no instalado"
    exit 1
fi

if npm list ua-parser-js > /dev/null 2>&1; then
    log_success "ua-parser-js instalado"
else
    log_error "ua-parser-js no instalado"
    exit 1
fi

cd ../frontend
if npm list react-chartjs-2 > /dev/null 2>&1; then
    log_success "react-chartjs-2 instalado"
else
    log_error "react-chartjs-2 no instalado"
    exit 1
fi

if npm list framer-motion > /dev/null 2>&1; then
    log_success "framer-motion instalado"
else
    log_error "framer-motion no instalado"
    exit 1
fi

cd ..

echo ""
echo "🎉 ¡Instalación completada exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Edita el archivo .env con tus configuraciones reales"
echo "2. Ejecuta: ./start-advanced-analytics.sh"
echo "3. Verifica: ./test-advanced-analytics.sh"
echo "4. Monitorea: ./monitor-advanced-analytics.sh"
echo ""
echo "📚 Documentación:"
echo "- INSTALL_ADVANCED_ANALYTICS.md (este archivo)"
echo "- docs/ADVANCED_ANALYTICS_AND_SECURITY.md (documentación técnica)"
echo ""
echo "🌐 URLs importantes:"
echo "- Dashboard: http://localhost:3000/dashboard/advanced"
echo "- API Docs: http://localhost:4000/api/docs"
echo "- Health: http://localhost:4000/health"
echo ""
log_success "¡Analytics y Seguridad Avanzados listos para usar!"
