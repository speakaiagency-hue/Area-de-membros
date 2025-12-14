import pg from 'pg';
import bcrypt from 'bcryptjs';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_yDvGbR70iEsk@ep-late-forest-aczmiwpt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
});

try {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', ['speakai.agency@gmail.com']);
  
  if (result.rows.length > 0) {
    const user = result.rows[0];
    console.log('✅ Usuário encontrado:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Password hash:', user.password?.substring(0, 20) + '...');
    
    // Testar senha
    const isValid = await bcrypt.compare('Diamante2019', user.password);
    console.log('\n🔑 Senha válida?', isValid ? '✅ SIM' : '❌ NÃO');
  } else {
    console.log('❌ Usuário não encontrado');
  }
  
  await pool.end();
} catch (err) {
  console.error('❌ Erro:', err.message);
  console.error(err.stack);
}
