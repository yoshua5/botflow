#!/usr/bin/env node

/**
 * Verifica que todas las variables de entorno están configuradas
 * Uso: node scripts/verify-env.js
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, text) {
  console.log(`${COLORS[color]}${text}${COLORS.reset}`);
}

function checkEnv() {
  log('blue', '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('cyan', '🔍 Verificando configuración de Botflow');
  log('blue', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const envPath = path.join(__dirname, '../.env.local');
  const envExamplePath = path.join(__dirname, '../.env.local.example');

  // Verificar archivo .env.local
  if (!fs.existsSync(envPath)) {
    log('yellow', '⚠️  .env.local no existe');
    log('cyan', '   Creando desde .env.local.example...\n');

    if (fs.existsSync(envExamplePath)) {
      const content = fs.readFileSync(envExamplePath, 'utf-8');
      fs.writeFileSync(envPath, content);
      log('green', '   ✅ .env.local creado\n');
    } else {
      log('red', '   ❌ .env.local.example tampoco existe\n');
      return false;
    }
  }

  // Leer variables
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');

  const requiredVars = {
    // Clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'Clerk Public Key',
    CLERK_SECRET_KEY: 'Clerk Secret Key',

    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: 'Supabase URL',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase Anon Key',
    SUPABASE_SERVICE_ROLE_KEY: 'Supabase Service Role Key',

    // Claude API
    ANTHROPIC_API_KEY: 'Anthropic API Key',

    // Facebook/WhatsApp
    FACEBOOK_APP_ID: 'Facebook App ID',
    FACEBOOK_APP_SECRET: 'Facebook App Secret',

    // Base URL
    NEXT_PUBLIC_BASE_URL: 'Application Base URL',
  };

  const env = {};
  lines.forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (value && !value.includes('your_') && !value.includes('example')) {
        env[key.trim()] = true;
      }
    }
  });

  log('blue', '📋 Variables Requeridas:\n');

  let allConfigured = true;
  Object.entries(requiredVars).forEach(([key, label]) => {
    if (env[key]) {
      log('green', `   ✅ ${label.padEnd(35)} [${key}]`);
    } else {
      log('red', `   ❌ ${label.padEnd(35)} [${key}]`);
      allConfigured = false;
    }
  });

  log('blue', '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (allConfigured) {
    log('green', '✨ ¡Todas las variables están configuradas correctamente!\n');
    return true;
  } else {
    log('yellow', '⚠️  Faltan variables de configuración\n');
    log('cyan', 'Pasos para configurar:\n');
    log('cyan', '1. Abre .env.local');
    log('cyan', '2. Reemplaza los valores "your_..." con tus valores reales');
    log('cyan', '3. Para Facebook/WhatsApp, sigue: SETUP_FACEBOOK_WHATSAPP.md\n');
    return false;
  }
}

// Ejecutar verificación
const success = checkEnv();
process.exit(success ? 0 : 1);
