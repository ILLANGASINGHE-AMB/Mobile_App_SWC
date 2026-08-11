const fs = require('fs');

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';

const content = `// Auto-generated configuration file
window.SUPABASE_URL = "${url}";
window.SUPABASE_ANON_KEY = "${key}";
`;

fs.writeFileSync('config.js', content);
console.log('Successfully generated config.js');
