// Aplica um ou mais arquivos .sql de supabase/migrations/ contra o Postgres
// apontado por DATABASE_URL, em ordem, cada um dentro de uma transação
// própria (rollback automático se der erro no meio do arquivo).
//
// Uso:
//   DATABASE_URL=postgresql://... node scripts/run-migration.mjs supabase/migrations/0005_add_solicitacoes_table.sql [outro.sql ...]

import { readFileSync } from "fs";
import { Client } from "pg";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Uso: node scripts/run-migration.mjs <arquivo.sql> [<arquivo2.sql> ...]");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Defina DATABASE_URL no ambiente.");
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

for (const file of files) {
  const sql = readFileSync(file, "utf8");
  console.log(`\n=== aplicando ${file} ===`);
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("commit");
    console.log(`✓ ${file} aplicada com sucesso.`);
  } catch (err) {
    await client.query("rollback");
    console.error(`✗ erro em ${file}, rollback feito:`, err.message);
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log("\nTudo aplicado com sucesso.");
