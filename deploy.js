#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args[0] || 'dev';

// Configuration
const CONFIG = {
  dev: {
    project: 'alcor-membership-firebase-dev',
    buildMode: 'development',
    functionsUrl: 'https://authcore-z7mzqusq7q-uc.a.run.app'
  },
  prod: {
    project: 'alcor-membership-firebase',  // Update with your prod project ID
    buildMode: 'production',
    functionsUrl: 'https://authcore-production-url.a.run.app' // Update with prod URL
  }
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description, cwd = process.cwd()) {
  log(`\n→ ${description}`, 'cyan');
  log(`  COMMAND: ${command}`, 'magenta');
  log(`  DIRECTORY: ${cwd}`, 'magenta');
  
  try {
    const output = execSync(command, { 
      cwd,
      stdio: 'inherit',
      encoding: 'utf8'
    });
    log(`✓ ${description} completed`, 'green');
    return output;
  } catch (error) {
    log(`✗ ${description} failed`, 'red');
    throw error;
  }
}

function deploy(env) {
  const config = CONFIG[env];
  
  if (!config) {
    log(`Invalid environment: ${env}. Use 'dev' or 'prod'`, 'red');
    process.exit(1);
  }

  log(`\n${'='.repeat(50)}`, 'yellow');
  log(`DEPLOYING TO ${env.toUpperCase()}`, 'yellow');
  log(`${'='.repeat(50)}\n`, 'yellow');
  
  log(`Configuration:`, 'blue');
  log(`  • Project ID: ${config.project}`, 'blue');
  log(`  • Build Mode: ${config.buildMode}`, 'blue');
  log(`  • Functions URL: ${config.functionsUrl}`, 'blue');
  log(`  • Current Directory: ${process.cwd()}`, 'blue');

  try {
    // 1. Switch Firebase project
    log(`\n[STEP 1/4] SWITCHING FIREBASE PROJECT`, 'yellow');
    log(`${'─'.repeat(40)}`, 'yellow');
    runCommand(
      `firebase use ${config.project}`,
      `Switching to Firebase project: ${config.project}`
    );

    // Verify the switch
    log(`\n  Verifying project switch...`, 'cyan');
    const currentProject = execSync('firebase use', { encoding: 'utf8' }).trim();
    log(`  ✓ Currently active project: ${currentProject}`, 'green');

    // 2. Build the frontend
    log(`\n[STEP 2/4] BUILDING FRONTEND`, 'yellow');
    log(`${'─'.repeat(40)}`, 'yellow');
    runCommand(
      `npm run build -- --mode ${config.buildMode}`,
      `Building frontend in ${config.buildMode} mode`
    );

    // 3. Deploy hosting
    log(`\n[STEP 3/4] DEPLOYING TO FIREBASE HOSTING`, 'yellow');
    log(`${'─'.repeat(40)}`, 'yellow');
    runCommand(
      `firebase deploy --only hosting --project ${config.project}`,
      `Deploying hosting to ${config.project}`
    );

    // 4. Optional: Deploy functions
    log(`\n[STEP 4/4] FUNCTIONS DEPLOYMENT`, 'yellow');
    log(`${'─'.repeat(40)}`, 'yellow');
    log(`  ⚠ Functions deployment skipped (uncomment in script if needed)`, 'cyan');
    // Uncomment these lines to deploy functions:
    // runCommand(
    //   `firebase deploy --only functions --project ${config.project}`,
    //   `Deploying functions to ${config.project}`,
    //   path.join(process.cwd(), 'functions')
    // );

    // Success!
    log(`\n${'='.repeat(50)}`, 'green');
    log(`✅ DEPLOYMENT COMPLETE!`, 'green');
    log(`${'='.repeat(50)}\n`, 'green');
    
    log(`Summary:`, 'blue');
    log(`  • Environment: ${env.toUpperCase()}`, 'blue');
    log(`  • Firebase Project: ${config.project}`, 'blue');
    log(`  • Build Mode: ${config.buildMode}`, 'blue');
    
    if (env === 'dev') {
      log(`  • Live URL: https://alcor-membership-firebase-dev.web.app`, 'cyan');
    } else {
      log(`  • Live URL: https://alcor-membership-firebase.web.app`, 'cyan');
    }
    
    log(`\n  Check deployment at: https://console.firebase.google.com/project/${config.project}/hosting`, 'cyan');

  } catch (error) {
    log(`\n${'='.repeat(50)}`, 'red');
    log(`❌ DEPLOYMENT FAILED`, 'red');
    log(`${'='.repeat(50)}\n`, 'red');
    log(`Error details:`, 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Show usage if no environment specified
if (!environment || !['dev', 'prod'].includes(environment)) {
  log('\n📋 USAGE INSTRUCTIONS', 'yellow');
  log('─'.repeat(30), 'yellow');
  log('\nCommand: npm run deploy [environment]\n', 'cyan');
  log('Examples:', 'blue');
  log('  npm run deploy dev    # Deploy to development', 'cyan');
  log('  npm run deploy prod   # Deploy to production', 'cyan');
  log('\nOr use shortcuts:', 'blue');
  log('  npm run deploy:dev    # Deploy to development', 'cyan');
  log('  npm run deploy:prod   # Deploy to production', 'cyan');
  process.exit(1);
}

// Confirm production deployment
if (environment === 'prod') {
  log('\n⚠️  PRODUCTION DEPLOYMENT WARNING', 'yellow');
  log('─'.repeat(35), 'yellow');
  log('You are about to deploy to PRODUCTION!', 'yellow');
  log('Press Ctrl+C to cancel, or wait 5 seconds to continue...', 'yellow');
  execSync('sleep 5');
}

// Run deployment
deploy(environment);