import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não encontrada. Certifique-se de que o banco está provisionado.");
}

export default defineConfig({
  out: "./migrations",              // pasta onde as migrations serão geradas
  schema: "./shared/schema.ts",     // caminho para o schema das tabelas
  dialect: "postgresql",            // banco PostgreSQL
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!, // Neon via variável de ambiente
    ssl: true, // necessário para Neon
  },
});
