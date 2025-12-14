import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_yDvGbR70iEsk@ep-late-forest-aczmiwpt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
});

try {
  // Ver estrutura atual
  const columns = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users'
  `);
  
  console.log('Colunas atuais:', columns.rows.map(r => r.column_name));
  
  // Adicionar colunas que faltam
  const alterations = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(10) DEFAULT 'user'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`
  ];
  
  for (const sql of alterations) {
    try {
      await pool.query(sql);
      console.log('✓ Coluna adicionada');
    } catch (e) {
      console.log('⚠ ', e.message);
    }
  }
  
  console.log('✅ Tabela users atualizada!');
  await pool.end();
} catch (err) {
  console.error('❌ Erro:', err.message);
  process.exit(1);
}
