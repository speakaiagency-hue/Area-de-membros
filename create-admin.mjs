import pg from 'pg';
import bcrypt from 'bcryptjs';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_yDvGbR70iEsk@ep-late-forest-aczmiwpt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
});

const email = 'speakai.agency@gmail.com';
const password = 'Diamante2019';
const hashedPassword = await bcrypt.hash(password, 10);

try {
  // Verificar se usuário existe
  const check = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
  
  if (check.rows.length > 0) {
    // Atualizar usuário existente
    await pool.query(`
      UPDATE users 
      SET password = $1, role = 'admin', name = 'Admin SpeakAI', username = 'admin'
      WHERE email = $2
    `, [hashedPassword, email]);
    console.log('✅ Usuário admin atualizado!');
  } else {
    // Criar novo usuário
    await pool.query(`
      INSERT INTO users (email, password, name, role, avatar, username)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [email, hashedPassword, 'Admin SpeakAI', 'admin', 'https://github.com/shadcn.png', 'admin']);
    console.log('✅ Usuário admin criado!');
  }
  
  console.log('\n📧 Email:', email);
  console.log('🔑 Senha:', password);
  console.log('👤 Role: admin');
  
  await pool.end();
} catch (err) {
  console.error('❌ Erro:', err.message);
  process.exit(1);
}
