import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_yDvGbR70iEsk@ep-late-forest-aczmiwpt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
});

try {
  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'session'
  `);
  
  if (result.rows.length > 0) {
    console.log('✅ Tabela session existe');
  } else {
    console.log('❌ Tabela session NÃO existe');
    console.log('Criando tabela...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
      WITH (OIDS=FALSE);
      
      ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);
    
    console.log('✅ Tabela session criada!');
  }
  
  await pool.end();
} catch (err) {
  console.error('❌ Erro:', err.message);
  process.exit(1);
}
