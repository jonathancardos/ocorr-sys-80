import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.resolve(__dirname, 'src/types/supabase.ts');
const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!supabaseAccessToken) {
  console.error('SUPABASE_ACCESS_TOKEN is not defined in the environment variables. Please add it to your .env file.');
  process.exit(1);
}

try {
  console.log('Generating Supabase types...');
  execSync(`supabase gen types typescript --schema public > ${outputPath}`, { stdio: 'inherit', env: { ...process.env, SUPABASE_ACCESS_TOKEN: supabaseAccessToken } });
  console.log(`Supabase types generated successfully at ${outputPath}`);
} catch (error) {
  console.error('Error generating Supabase types:', error);
  process.exit(1);
}
