# Deployment Process
## Project Management System

---

## 🚀 **Deployment Overview**

### **Deployment Strategy**
This document outlines the complete deployment process for the Project Management System, covering development, staging, and production environments.

### **Environment Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │     Staging     │    │   Production    │
│                 │    │                 │    │                 │
│ - Local Setup   │    │ - Test Server   │    │ - Live Server   │
│ - Hot Reload    │    │ - CI/CD Pipeline│    │ - Load Balancer │
│ - Debug Mode    │    │ - Auto Deploy   │    │ - Auto Scaling  │
│ - Mock Data     │    │ - Test Data     │    │ - Real Data     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🛠️ **Development Environment Setup**

### **Prerequisites**
- Node.js 18+ installed
- PostgreSQL 13+ installed
- Git installed
- npm or yarn package manager

### **Local Development Setup**

#### **Step 1: Clone Repository**
```bash
git clone https://github.com/your-org/project-management-system.git
cd project-management-system
```

#### **Step 2: Backend Setup**
```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
# Edit .env file with your local settings
```

#### **Step 3: Database Setup**
```bash
# Create database
createdb project_management_dev

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed:all
```

#### **Step 4: Frontend Setup**
```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
# Edit .env file with your local settings
```

#### **Step 5: Start Development Servers**
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### **Environment Configuration**

#### **Backend Environment Variables**
```bash
# .env file
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/project_management_dev
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

#### **Frontend Environment Variables**
```bash
# .env file
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Project Management System
VITE_APP_VERSION=1.0.0
```

---

## 🔄 **Staging Environment Deployment**

### **Staging Server Setup**

#### **Server Requirements**
- Ubuntu 20.04+ or CentOS 8+
- Node.js 18+
- PostgreSQL 13+
- Nginx
- PM2 (Process Manager)
- SSL Certificate

#### **Step 1: Server Preparation**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Nginx
sudo apt install nginx

# Install PM2
sudo npm install -g pm2
```

#### **Step 2: Database Setup**
```bash
# Create database user
sudo -u postgres createuser --interactive project_mgmt

# Create database
sudo -u postgres createdb project_management_staging

# Set up database access
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE project_management_staging TO project_mgmt;
\q
```

#### **Step 3: Application Deployment**
```bash
# Clone repository
git clone https://github.com/your-org/project-management-system.git
cd project-management-system

# Backend deployment
cd backend
npm install --production
npm run db:migrate
npm run db:seed:all

# Frontend build
cd ../frontend
npm install
npm run build
```

#### **Step 4: PM2 Configuration**
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'project-management-api',
    script: 'src/app.js',
    instances: 2,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'staging',
      PORT: 3000
    }
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### **Step 5: Nginx Configuration**
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/project-management

# Configuration content
server {
    listen 80;
    server_name staging.projectmanagement.com;

    # Frontend
    location / {
        root /var/www/project-management/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/project-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### **CI/CD Pipeline Setup**

#### **GitHub Actions Workflow**
```yaml
# .github/workflows/staging-deploy.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        npm ci
        cd frontend && npm ci
        
    - name: Run tests
      run: |
        npm test
        cd frontend && npm test
        
    - name: Build frontend
      run: cd frontend && npm run build
        
    - name: Deploy to staging
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.STAGING_HOST }}
        username: ${{ secrets.STAGING_USER }}
        key: ${{ secrets.STAGING_SSH_KEY }}
        script: |
          cd /var/www/project-management
          git pull origin develop
          cd backend && npm install --production
          npm run db:migrate
          cd ../frontend && npm install
          npm run build
          pm2 restart all
```

---

## 🌐 **Production Environment Deployment**

### **Production Server Setup**

#### **Server Infrastructure**
- **Load Balancer**: AWS ALB or Nginx
- **Application Servers**: Multiple EC2 instances
- **Database**: RDS PostgreSQL
- **Cache**: Redis ElastiCache
- **Storage**: S3 for file uploads
- **CDN**: CloudFront for static assets

#### **Step 1: Infrastructure Setup**

##### **AWS Infrastructure (Terraform)**
```hcl
# main.tf
provider "aws" {
  region = "us-east-1"
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  
  tags = {
    Name = "project-management-vpc"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "project-management-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier        = "project-management-db"
  engine            = "postgres"
  engine_version    = "13.7"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  
  db_name  = "project_management_prod"
  username = "dbadmin"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "main" {
  cluster_id           = "project-management-cache"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis6.x"
  port                 = 6379
}
```

#### **Step 2: Application Deployment**

##### **Docker Configuration**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

##### **Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=project_management_prod
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

#### **Step 3: Kubernetes Deployment**

##### **Kubernetes Manifests**
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: project-management
```

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: project-management
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: project-management/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: project-management
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: project-management/frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

### **Production CI/CD Pipeline**

#### **GitHub Actions Production Deployment**
```yaml
# .github/workflows/production-deploy.yml
name: Deploy to Production

on:
  push:
    tags: [v*]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
        
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
      
    - name: Build and push backend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: project-management-backend
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        
    - name: Build and push frontend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: project-management-frontend
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./frontend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        
    - name: Update Kubernetes deployment
      run: |
        kubectl set image deployment/backend backend=$ECR_REGISTRY/project-management-backend:$IMAGE_TAG -n project-management
        kubectl set image deployment/frontend frontend=$ECR_REGISTRY/project-management-frontend:$IMAGE_TAG -n project-management
```

---

## 🔒 **Security Configuration**

### **SSL/TLS Setup**

#### **Let's Encrypt SSL**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d projectmanagement.com -d www.projectmanagement.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### **Security Headers**
```nginx
# nginx.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### **Environment Security**

#### **Secrets Management**
```bash
# Kubernetes secrets
kubectl create secret generic db-secret \
  --from-literal=url=postgresql://user:pass@host:5432/db \
  --namespace project-management

kubectl create secret generic jwt-secret \
  --from-literal=secret=your-jwt-secret \
  --namespace project-management
```

#### **Network Security**
```bash
# Security groups (AWS)
aws ec2 create-security-group \
  --group-name project-management-sg \
  --description "Security group for project management system"

# Allow HTTP/HTTPS
aws ec2 authorize-security-group-ingress \
  --group-name project-management-sg \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name project-management-sg \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

---

## 📊 **Monitoring & Logging**

### **Application Monitoring**

#### **PM2 Monitoring**
```bash
# PM2 monitoring setup
pm2 install pm2-server-monit
pm2 install pm2-logrotate

# Configure monitoring
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

#### **Application Logging**
```javascript
// backend/src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'project-management-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### **Infrastructure Monitoring**

#### **AWS CloudWatch**
```yaml
# cloudwatch-config.yml
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "/aws/ec2/project-management/nginx-access",
            "log_stream_name": "{instance_id}"
          },
          {
            "file_path": "/var/log/nginx/error.log",
            "log_group_name": "/aws/ec2/project-management/nginx-error",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
```

---

## 🔄 **Backup & Recovery**

### **Database Backup**

#### **Automated Backups**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="project_management_prod"

# Create backup
pg_dump $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://project-management-backups/

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

#### **Backup Schedule**
```bash
# Crontab entry
0 2 * * * /path/to/backup.sh
```

### **Application Backup**

#### **File System Backup**
```bash
# Backup application files
tar -czf /backups/app_$(date +%Y%m%d).tar.gz /var/www/project-management/

# Upload to S3
aws s3 cp /backups/app_$(date +%Y%m%d).tar.gz s3://project-management-backups/
```

---

## 🚨 **Disaster Recovery**

### **Recovery Procedures**

#### **Database Recovery**
```bash
# Restore from backup
psql project_management_prod < backup_20240115_020000.sql

# Point-in-time recovery
pg_restore --clean --if-exists --no-owner --no-privileges backup_file.sql
```

#### **Application Recovery**
```bash
# Redeploy application
cd /var/www/project-management
git pull origin main
npm install --production
pm2 restart all

# Verify deployment
curl -f http://localhost:3000/health
```

### **Failover Procedures**

#### **Load Balancer Failover**
```bash
# Update DNS records
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890 \
  --change-batch file://failover.json
```

---

## 📋 **Deployment Checklist**

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Code review completed
- [ ] Security scan passed
- [ ] Performance testing completed
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Backup procedures tested

### **Deployment**
- [ ] Database backup created
- [ ] Application deployed
- [ ] Database migrations run
- [ ] Health checks passing
- [ ] SSL certificates renewed
- [ ] Monitoring alerts configured
- [ ] Performance metrics normal

### **Post-Deployment**
- [ ] User acceptance testing
- [ ] Performance monitoring
- [ ] Error rate monitoring
- [ ] User feedback collection
- [ ] Documentation updated
- [ ] Team notification sent

---

## 🎯 **Rollback Procedures**

### **Quick Rollback**
```bash
# Kubernetes rollback
kubectl rollout undo deployment/backend -n project-management
kubectl rollout undo deployment/frontend -n project-management

# PM2 rollback
pm2 restart ecosystem.config.js --env production
```

### **Database Rollback**
```bash
# Restore previous database state
pg_restore --clean --if-exists backup_file.sql
```

---

This deployment process ensures reliable, secure, and scalable deployment of the Project Management System across all environments. 