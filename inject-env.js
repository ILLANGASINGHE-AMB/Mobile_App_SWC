const fs = require('fs');

const defaultUrl = 'https://mzxpdirmsegsgkrunerk.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eHBkaXJtc2Vnc2drcnVuZXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0ODIyMDYsImV4cCI6MjA5OTA1ODIwNn0.8qwcNal0BrNaLd7FBg-Om_ZMLbPi_VA_dxFnha-Ma4E';

const url = process.env.SUPABASE_URL || defaultUrl;
const key = process.env.SUPABASE_ANON_KEY || defaultKey;

const content = `// Auto-generated configuration file
window.SUPABASE_URL = "${url}";
window.SUPABASE_ANON_KEY = "${key}";
`;

fs.writeFileSync('config.js', content);
console.log('Successfully generated config.js with SUPABASE_URL and SUPABASE_ANON_KEY');
