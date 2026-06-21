const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');

if (!process.env.TURSO_DATABASE_URL) {
  console.warn('[db] TURSO_DATABASE_URL non impostata — controlla il file .env');
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db', // fallback locale per sviluppo
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function applySchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  // Turso/libSQL non supporta sempre script multi-statement in una sola execute,
  // quindi spezziamo per ';' tenendo solo le istruzioni non vuote.
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await client.execute(statement);
  }
}

module.exports = { client, applySchema };
