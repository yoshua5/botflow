const { execSync } = require('child_process');

const envVars = {
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_test_Y2hlZXJmdWwtdGFoci02NS5jbGVyay5hY2NvdW50cy5kZXYk",
  "CLERK_SECRET_KEY": "sk_test_qtVgvxGbR9I4j4S2sVfKhPvik2ZQqSMSILRfcDsbQe",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL": "/sign-in",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL": "/sign-up",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL": "/dashboard",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL": "/dashboard"
};

for (const [key, value] of Object.entries(envVars)) {
  console.log(`Adding ${key}...`);
  try {
    // Remove first just in case
    execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' });
  } catch(e) {}
  
  try {
    // Add value
    // In windows, echo value | vercel env add doesn't work well due to newlines
    // We can use process.execSync directly with input
    execSync(`npx vercel env add ${key} production`, { input: value, stdio: ['pipe', 'inherit', 'inherit'] });
    console.log(`Successfully added ${key}`);
  } catch(e) {
    console.error(`Failed to add ${key}`);
  }
}

// Deploy to production
console.log('Triggering production deploy...');
try {
  execSync('npx vercel --prod --yes', { stdio: 'inherit' });
  console.log('Deployed successfully.');
} catch(e) {
  console.error('Deploy failed');
}
