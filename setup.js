#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up ChatGPT Clone...\n');

// Check if .env file exists and has OpenAI key
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('sk-your-openai-api-key-goes-here')) {
    console.log('⚠️  OpenAI API Key Setup Required');
    console.log('📖 Please follow these steps:');
    console.log('   1. Go to https://platform.openai.com/api-keys');
    console.log('   2. Create a new API key');
    console.log('   3. Replace "sk-your-openai-api-key-goes-here" in .env file');
    console.log('   4. Save the file and restart the server\n');
  }
}

// Install backend dependencies
console.log('📦 Installing backend dependencies...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Backend dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install backend dependencies');
  console.error(error.message);
  process.exit(1);
}

// Install frontend dependencies
console.log('📦 Installing frontend dependencies...');
const clientPath = path.join(__dirname, 'clientapp');
try {
  execSync('npm install', { stdio: 'inherit', cwd: clientPath });
  console.log('✅ Frontend dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install frontend dependencies');
  console.error(error.message);
  process.exit(1);
}

console.log('🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('   1. Set up your OpenAI API key in .env file (if not done)');
console.log('   2. Start the development server:');
console.log('      npm run dev');
console.log('\n🌐 The app will be available at:');
console.log('   Frontend: http://localhost:3000');
console.log('   Backend:  http://localhost:8080');
console.log('\n📖 For detailed instructions, see README.md');