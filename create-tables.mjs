import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_yDvGbR70iEsk@ep-late-forest-aczmiwpt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
});

const tables = [
  `CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    author TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  
  `CREATE TABLE IF NOT EXISTS modules (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  
  `CREATE TABLE IF NOT EXISTS lessons (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id VARCHAR NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    pdf_url TEXT,
    duration TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  
  `CREATE TABLE IF NOT EXISTS community_videos (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail TEXT,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  
  `CREATE TABLE IF NOT EXISTS enrollments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress INTEGER NOT NULL DEFAULT 0,
    completed_lessons TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`
];

try {
  for (const sql of tables) {
    await pool.query(sql);
    console.log('✓ Tabela criada');
  }
  console.log('✅ Todas as tabelas criadas com sucesso!');
  await pool.end();
} catch (err) {
  console.error('❌ Erro:', err.message);
  process.exit(1);
}
