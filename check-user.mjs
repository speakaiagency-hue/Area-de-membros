import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_yDvGbR70iEsk@ep-late-forest-aczmiwpt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
});

try {
  const result = await pool.query(`
    SELECT id, email, name, role, created_at 
    FROM users 
    WHERE email = 'speakai.agency@gmail.com'
  `);
  
  if (result.rows.length > 0) {
    console.log('✅ Usuário encontrado:');
    console.log(result.rows[0]);
  } else {
    console.log('❌ Usuário não encontrado no banco');
  }
  
  await pool.end();
} catch (err) {
  console.error('❌ Erro:', err.message);
  process.exit(1);
}
