import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';


const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const docsDir = path.join(__dirname, '../../docs');

async function seed() {
  const fileNames = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md'));
  const documents = fileNames.map((fileName) => {
    const content = fs.readFileSync(path.join(docsDir, fileName), 'utf8');
    const title = fileName;
    return {
      title,
      content,
    };
  });
  // Process markdown documents to seed knowledge base and knowledge base chunks
  const { data, error } = await supabase.functions.invoke('process', {
    body: { documents },
  });

  if (error) {
    console.error('❌ Error invoking function:', error);
  } else {
    console.log('✅ Seeded documents:', data);
  }
}

seed();
