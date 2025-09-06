#!/bin/bash

# ===========================================
# SCRIPT DE DEPLOYMENT PARA AWS EC2
# ===========================================

set -e  # Parar script em caso de erro

echo "🚀 Iniciando deployment do FatecTeams Backend..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ===========================================
# CONFIGURAÇÕES INICIAIS
# ===========================================

print_step "Verificando Node.js e npm..."
if ! command -v node &> /dev/null; then
    print_error "Node.js não está instalado!"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm não está instalado!"
    exit 1
fi

print_success "Node.js $(node --version) e npm $(npm --version) encontrados"

# ===========================================
# VARIÁVEIS DE AMBIENTE
# ===========================================

# Verificar se arquivo .env existe
if [ ! -f ".env" ]; then
    print_error "Arquivo .env não encontrado!"
    print_warning "Crie o arquivo .env baseado no .env.example"
    exit 1
fi

# Carregar variáveis do .env
export $(grep -v '^#' .env | xargs)

print_success "Variáveis de ambiente carregadas"

# ===========================================
# INSTALAÇÃO DE DEPENDÊNCIAS
# ===========================================

print_step "Instalando dependências de produção..."
npm ci --only=production
print_success "Dependências instaladas"

# ===========================================
# BUILD DA APLICAÇÃO
# ===========================================

print_step "Fazendo build da aplicação TypeScript..."
npm run build
print_success "Build concluído"

# ===========================================
# MIGRATIONS DE BANCO DE DADOS
# ===========================================

print_step "Verificando migrations pendentes..."

# Verificar se há migrations pendentes
PENDING_MIGRATIONS=$(npm run migration:check --silent || true)

if [ ! -z "$PENDING_MIGRATIONS" ]; then
    print_warning "Migrations pendentes encontradas:"
    echo "$PENDING_MIGRATIONS"
    
    read -p "Deseja aplicar as migrations agora? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "Aplicando migrations..."
        npm run migration:run
        print_success "Migrations aplicadas com sucesso"
    else
        print_warning "Migrations não foram aplicadas. A aplicação pode não funcionar corretamente."
    fi
else
    print_success "Nenhuma migration pendente"
fi

# ===========================================
# CONFIGURAÇÃO DO PM2 (Opcional)
# ===========================================

if command -v pm2 &> /dev/null; then
    print_step "Configurando PM2 para produção..."
    
    # Parar processos existentes (se houver)
    pm2 delete fatecteams-api || true
    
    # Iniciar aplicação com PM2
    pm2 start dist/server.js --name "fatecteams-api" --env production
    pm2 save
    
    print_success "Aplicação iniciada com PM2"
    
    # Mostrar status
    pm2 status
    
else
    print_warning "PM2 não encontrado. Considerando instalação para gerenciamento em produção:"
    print_warning "npm install -g pm2"
fi

# ===========================================
# CONFIGURAÇÃO DO NGINX (Informativo)
# ===========================================

print_step "Verificando configuração do Nginx..."

NGINX_CONFIG="/etc/nginx/sites-available/fatecteams"

if [ ! -f "$NGINX_CONFIG" ]; then
    print_warning "Configuração do Nginx não encontrada em $NGINX_CONFIG"
    print_warning "Exemplo de configuração:"
    
    cat << EOF

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

EOF
else
    print_success "Configuração do Nginx encontrada"
fi

# ===========================================
# VERIFICAÇÃO DE SAÚDE
# ===========================================

print_step "Verificando se a aplicação está funcionando..."

# Aguardar alguns segundos para a aplicação inicializar
sleep 5

# Verificar se a aplicação responde
if curl -f -s "http://localhost:${PORT:-3000}/api/health" > /dev/null; then
    print_success "✅ Aplicação está funcionando corretamente!"
    print_success "🌐 API disponível em: http://localhost:${PORT:-3000}/api"
else
    print_error "❌ Aplicação não está respondendo"
    print_warning "Verifique os logs com: pm2 logs fatecteams-api"
    exit 1
fi

# ===========================================
# CONFIGURAÇÃO DE FIREWALL (Informativo)
# ===========================================

print_step "Verificando configuração do firewall..."

if command -v ufw &> /dev/null; then
    print_warning "Certifique-se de que as portas necessárias estão abertas:"
    print_warning "sudo ufw allow 22    # SSH"
    print_warning "sudo ufw allow 80    # HTTP"
    print_warning "sudo ufw allow 443   # HTTPS"
    print_warning "sudo ufw enable"
else
    print_warning "UFW não encontrado. Configure o firewall manualmente."
fi

# ===========================================
# CONCLUSÃO
# ===========================================

echo
echo "=========================================="
print_success "🎉 DEPLOYMENT CONCLUÍDO COM SUCESSO!"
echo "=========================================="
print_success "API: http://localhost:${PORT:-3000}/api"
print_success "Documentação: http://localhost:${PORT:-3000}/api"
print_success "Ambiente: ${NODE_ENV:-production}"
print_success "Banco: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo "=========================================="
print_warning "📝 PRÓXIMOS PASSOS:"
print_warning "1. Configure SSL/HTTPS com Let's Encrypt"
print_warning "2. Configure backup automático do banco"
print_warning "3. Configure monitoramento com PM2 Plus"
print_warning "4. Configure logs centralizados"
echo "=========================================="
