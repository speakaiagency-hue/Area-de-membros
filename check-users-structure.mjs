import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_yDvGbR70iEsk@ep-late-forest-aczmiwpt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
});

try {
  // Ver estrutura da tabela users
  const columns = await pool.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `);
  
  console.log('📋 Estrutura da tabela users:');
  console.log('');
  columns.rows.forEach(col => {
    console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(obrigatório)' : '(opcional)'}`);
  });
  
  // Verificar se tem constraint de unique no email
  const constraints = await pool.query(`
    SELECT constraint_name, constraint_type
    FROM information_schema.table_constraints
    WHERE table_name = 'users'
  `);
  
  console.log('');
  console.log('🔒 Constraints:');
  constraints.rows.forEach(c => {
    console.log(`  ${c.constraint_name}: ${c.constraint_type}`);
  });
  
  await pool.end();
} catch (err) {
  console.error('❌ Erro:', err.message);
  process.exit(1);
}
