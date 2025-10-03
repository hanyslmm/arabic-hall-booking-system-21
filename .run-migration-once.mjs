#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://vylizytdabmyxhuljzhe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bGl6eXRkYWJteXhodWxqemhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NjcwMCwiZXhwIjoyMDcxMzYyNzAwfQ.a8_0qYlbKn7mGwRi723ZIQsDafAXTRahKu45FzcMu_g';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrationSQL = fs.readFileSync(
  path.join(__dirname, 'supabase/migrations/20251003_create_settlement_change_requests.sql'),
  'utf-8'
);

console.log('🔧 Running migration: settlement_change_requests table...\n');

// Split SQL into individual statements and execute
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

let success = true;
for (const statement of statements) {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' }).catch(async () => {
      // Fallback: use REST API directly for DDL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql: statement + ';' })
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      return { error: null };
    });
    
    if (error) {
      console.error('❌ Statement failed:', statement.substring(0, 80) + '...');
      console.error('   Error:', error.message);
      success = false;
      break;
    }
  } catch (err) {
    console.log('⚠️  RPC not available; trying direct query execution...');
    // Direct query approach for DDL
    try {
      const { error: directError } = await supabase.from('_test').select('*').limit(1).catch(() => ({ error: null }));
      // If we reach here, we need to use the Postgres connection
      console.log('📋 Please run this SQL manually in Supabase Dashboard:');
      console.log('\n' + migrationSQL + '\n');
      success = false;
      break;
    } catch (e) {
      console.error('❌ Direct execution failed:', e.message);
      success = false;
      break;
    }
  }
}

if (success) {
  console.log('✅ Migration completed successfully!');
  console.log('🔄 Refresh your browser to use the new edit/delete request features.\n');
} else {
  console.log('\n📋 Run the SQL manually at:');
  console.log('   https://app.supabase.com/project/vylizytdabmyxhuljzhe/sql/new\n');
}

process.exit(success ? 0 : 1);

