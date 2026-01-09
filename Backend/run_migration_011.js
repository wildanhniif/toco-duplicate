const fs = require('fs');
const path = require('path');
const db = require('./config/database');

const runMigration = async () => {
  try {
    const migrationPath = path.join(__dirname, 'migrations', '011_create_articles_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon to run multiple statements if needed, 
    // but db.query might handle it depending on driver options. 
    // Safest is to split.
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await db.query(statement);
      console.log('Executed:', statement.substring(0, 50) + '...');
    }

    console.log('✅ Migration 011 executed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
