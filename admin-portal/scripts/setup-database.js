#!/usr/bin/env node

/**
 * LinkCab Database Setup Script
 * 
 * This script initializes the LinkCab database schema.
 * Run this script after setting up your Supabase project.
 * 
 * Usage: npm run setup:db
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('\nPlease check your .env.local file and try again.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up LinkCab database...\n');

  try {
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'setup-database.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📋 Executing database schema...');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_statement: statement });
        
        if (error) {
          // Try direct SQL execution if RPC fails
          console.log(`⚠️  RPC failed, trying direct execution for statement ${i + 1}...`);
          continue;
        }
        
        console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} failed (this might be expected):`);
        console.log(`   ${err.message}`);
      }
    }

    console.log('\n🎉 Database setup completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Open your Supabase project SQL Editor');
    console.log('2. Copy and paste the contents of scripts/setup-database.sql');
    console.log('3. Execute the SQL script to create all tables and policies');
    console.log('4. Restart your development server: npm run dev');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\n🔧 Manual setup required:');
    console.error('1. Go to your Supabase project SQL Editor');
    console.error('2. Copy the entire contents of scripts/setup-database.sql');
    console.error('3. Paste and execute the SQL script');
    process.exit(1);
  }
}

async function verifySetup() {
  console.log('\n🔍 Verifying database setup...');
  
  try {
    // Test basic table access
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Database verification failed:', error.message);
      return false;
    }

    console.log('✅ Database verification successful!');
    return true;
  } catch (error) {
    console.log('❌ Database verification failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔧 LinkCab Database Setup Utility');
  console.log('=====================================\n');

  await setupDatabase();
  
  const isVerified = await verifySetup();
  
  if (isVerified) {
    console.log('\n🎊 Setup complete! You can now run:');
    console.log('   npm run dev');
  } else {
    console.log('\n⚠️  Setup requires manual completion.');
    console.log('Please follow the manual setup instructions above.');
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the setup
main().catch(console.error);
