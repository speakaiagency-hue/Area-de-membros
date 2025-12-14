import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_yDvGbR70iEsk@ep-late-forest-aczmiwpt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
});

try {
  // Atualizar usuário admin
  await pool.query(`
    UPDATE users 
    SET username = 'admin', email = 'speakai.agency@gmail.com'
    WHERE email = 'speakai.agency@gmail.com'
  `);
  
  console.log('✅ Usuário admin atualizado com username!');
  
  // Verificar
  const result = await pool.query(`
    SELECT id, username, email, name, role 
    FROM users 
    WHERE email = 'speakai.agency@gmail.com'
  `);
  
  console.log('');
  console.log('👤 Usuário admin:');
  console.log(result.rows[0]);
  
  await pool.end();
} catch (err) {
  console.error('❌ Erro:', err.message);
  process.exit(1);
}
