# 🚀 Deployment Guide - FatecTeams Backend

Este guia detalha como fazer deployment do backend FatecTeams na AWS EC2 com migrations automáticas.

## 📋 Pré-requisitos

### AWS Resources
- **EC2 Instance** (t3.small ou superior recomendado)
- **RDS PostgreSQL** (t3.micro para teste, t3.small+ para produção)
- **S3 Bucket** para armazenamento de arquivos
- **Security Groups** configurados adequadamente
- **Elastic IP** (recomendado para IP fixo)

### Software na EC2
- Node.js 18+ 
- npm ou yarn
- PM2 (gerenciamento de processos)
- Nginx (proxy reverso)
- PostgreSQL client (para migrations manuais)

## 🏗️ Configuração da Infraestrutura

### 1. EC2 Instance Setup

```bash
# Conectar na instância EC2
ssh -i "your-key.pem" ec2-user@your-ec2-ip

# Atualizar sistema
sudo yum update -y

# Instalar Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar PostgreSQL client
sudo yum install -y postgresql

# Instalar Nginx
sudo yum install -y nginx
```

### 2. RDS PostgreSQL Setup

```sql
-- Conectar no RDS e criar banco
CREATE DATABASE FatecTeams;
CREATE USER fatecteams WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE FatecTeams TO fatecteams;
```

### 3. Security Groups

**EC2 Security Group:**
- Port 22 (SSH) - Seu IP
- Port 80 (HTTP) - 0.0.0.0/0
- Port 443 (HTTPS) - 0.0.0.0/0
- Port 3000 (API) - 0.0.0.0/0 (temporário, depois via Nginx)

**RDS Security Group:**
- Port 5432 - Security Group da EC2

## 📦 Deployment Automático

### 1. Clone e Configuração

```bash
# Na EC2, clone o repositório
git clone https://github.com/your-user/FatecTeams.git
cd FatecTeams/FatecTeamsBackEnd

# Copiar configuração de produção
cp .env.production .env

# Editar configurações
nano .env
```

### 2. Configurar .env para Produção

```bash
# Configurações críticas para produção
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# RDS Database
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=FatecTeams
DB_USER=fatecteams
DB_PASSWORD=your-secure-password

# JWT (gere novas chaves!)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# S3
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name

# Migrations automáticas
AUTO_MIGRATE=true
```

### 3. Script de Deploy Automático

```bash
# Tornar script executável
chmod +x deploy.sh

# Executar deployment
./deploy.sh
```

O script automaticamente:
- ✅ Instala dependências
- ✅ Faz build da aplicação
- ✅ Verifica e aplica migrations
- ✅ Configura PM2
- ✅ Testa saúde da aplicação

## 🔧 Sistema de Migrations

### Automático (Recomendado para Produção)

As migrations são executadas automaticamente quando:
1. `AUTO_MIGRATE=true` no .env
2. Aplicação inicia com `npm start`
3. System detecta migrations pendentes

### Manual (Backup/Debug)

```bash
# Verificar migrations pendentes
npm run migration:check

# Aplicar migrations manualmente
npm run migration:run

# Aplicar migration específica (se necessário)
ts-node src/migrations/migration-runner.ts
```

### Estrutura das Migrations

```
migrations/
├── 001_criar_estrutura_inicial.sql
├── 002_adicionar_tabelas_faltantes.sql
├── 003_fix_grupos_columns.sql
└── 004_fix_database_issues.sql
```

Cada migration é:
- ✅ Executada em transação (rollback automático se falhar)
- ✅ Registrada na tabela `migrations` 
- ✅ Verificada por checksum (detecta alterações)
- ✅ Executada em ordem sequencial

## 🌐 Configuração do Nginx

### Arquivo: `/etc/nginx/sites-available/fatecteams`

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Logging
    access_log /var/log/nginx/fatecteams-access.log;
    error_log /var/log/nginx/fatecteams-error.log;

    # Main API
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health checks (sem cache)
    location /api/health {
        proxy_pass http://127.0.0.1:3000/api/health;
        proxy_cache off;
        proxy_set_header Host $host;
    }

    # Static files (se houver)
    location /static/ {
        alias /var/www/fatecteams/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Ativar configuração:

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/fatecteams /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔒 SSL/HTTPS com Let's Encrypt

```bash
# Instalar Certbot
sudo yum install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Configurar renovação automática
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoramento

### Health Checks

```bash
# Basic health check
curl http://your-domain.com/api/health

# Detailed health check
curl http://your-domain.com/api/health/detailed
```

### PM2 Monitoring

```bash
# Status de todas aplicações
pm2 status

# Logs em tempo real
pm2 logs fatecteams-api

# Monitoramento detalhado
pm2 monit

# Restart aplicação
pm2 restart fatecteams-api

# Reload sem downtime
pm2 reload fatecteams-api
```

### Logs da Aplicação

```bash
# Logs via PM2
pm2 logs fatecteams-api --lines 100

# Logs do Nginx
sudo tail -f /var/log/nginx/fatecteams-access.log
sudo tail -f /var/log/nginx/fatecteams-error.log

# Logs do sistema
journalctl -u nginx -f
```

## 🔄 CI/CD Pipeline (GitHub Actions)

### `.github/workflows/deploy.yml`

```yaml
name: Deploy to EC2

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to EC2
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ec2-user
        key: ${{ secrets.EC2_PRIVATE_KEY }}
        script: |
          cd /home/ec2-user/FatecTeams/FatecTeamsBackEnd
          git pull origin main
          ./deploy.sh
```

## 🗄️ Backup Automático

### Script de Backup

```bash
#!/bin/bash
# /home/ec2-user/backup-db.sh

DB_HOST=$DB_HOST
DB_NAME=$DB_NAME
DB_USER=$DB_USER
PGPASSWORD=$DB_PASSWORD

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="fatecteams_backup_${DATE}.sql"

# Fazer backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > "/tmp/${BACKUP_NAME}"

# Upload para S3
aws s3 cp "/tmp/${BACKUP_NAME}" "s3://your-backup-bucket/database/"

# Limpar arquivo local
rm "/tmp/${BACKUP_NAME}"

echo "Backup concluído: ${BACKUP_NAME}"
```

### Cron para Backup Automático

```bash
# Editar crontab
crontab -e

# Backup diário às 2:00 AM
0 2 * * * /home/ec2-user/backup-db.sh
```

## 🚨 Troubleshooting

### Problemas Comuns

**1. Migrations Falhando:**
```bash
# Verificar logs
pm2 logs fatecteams-api

# Testar conexão com banco
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT version();"

# Aplicar migrations manualmente
npm run migration:run
```

**2. Aplicação não Responde:**
```bash
# Verificar se está rodando
pm2 status

# Restart forçado
pm2 delete fatecteams-api
pm2 start dist/server.js --name "fatecteams-api"

# Verificar portas
netstat -tulpn | grep 3000
```

**3. Nginx 502 Bad Gateway:**
```bash
# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Testar API diretamente
curl http://localhost:3000/api/health

# Verificar configuração do Nginx
sudo nginx -t
```

### Comandos Úteis

```bash
# Verificar recursos do sistema
free -h
df -h
top

# Verificar conectividade de rede
ping google.com
nslookup your-rds-endpoint.amazonaws.com

# Verificar processos Node.js
ps aux | grep node

# Limpar cache do npm
npm cache clean --force
```

## 📈 Otimizações de Produção

### 1. Configurações de Sistema

```bash
# Aumentar limites de arquivo
echo '* soft nofile 65535' | sudo tee -a /etc/security/limits.conf
echo '* hard nofile 65535' | sudo tee -a /etc/security/limits.conf

# Otimizar kernel para rede
echo 'net.core.somaxconn = 65535' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 2. PM2 Cluster Mode

```bash
# Usar todos os cores da CPU
pm2 start dist/server.js --name "fatecteams-api" -i max
```

### 3. Redis para Cache (Opcional)

```bash
# Se usando ElastiCache Redis
REDIS_HOST=your-redis-endpoint.cache.amazonaws.com
REDIS_PORT=6379
```

---

## 🎯 Checklist de Deployment

- [ ] EC2 instance configurada e atualizada
- [ ] RDS PostgreSQL criado e acessível
- [ ] S3 bucket configurado com IAM roles
- [ ] Security Groups configurados
- [ ] .env configurado para produção
- [ ] JWT secrets gerados (únicos)
- [ ] SSL/HTTPS configurado
- [ ] Nginx configurado e ativo  
- [ ] PM2 configurado para auto-restart
- [ ] Health checks funcionando
- [ ] Backup automático configurado
- [ ] Monitoring/alertas configurados
- [ ] DNS apontando para Elastic IP

**Pronto! Sua aplicação está em produção com migrations automáticas! 🚀**
