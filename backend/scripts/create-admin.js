/**
 * Crea (o aggiorna la password di) un utente admin.
 * Uso:  npm run create-admin -- admin@giulivovicopisano.it "PasswordSicura123!" "Nome"
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { client, applySchema } = require('../db/client');

async function main() {
  const [, , email, password, name] = process.argv;

  if (!email || !password) {
    console.error('Uso: npm run create-admin -- <email> <password> [nome]');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('La password deve avere almeno 8 caratteri.');
    process.exit(1);
  }

  await applySchema();

  const hash = await bcrypt.hash(password, 12);
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await client.execute({
    sql: 'SELECT id FROM admins WHERE email = ?',
    args: [normalizedEmail],
  });

  if (existing.rows[0]) {
    await client.execute({
      sql: 'UPDATE admins SET password_hash = ?, name = ? WHERE email = ?',
      args: [hash, name || null, normalizedEmail],
    });
    console.log(`Password aggiornata per l'admin esistente: ${normalizedEmail}`);
  } else {
    await client.execute({
      sql: 'INSERT INTO admins (email, password_hash, name) VALUES (?, ?, ?)',
      args: [normalizedEmail, hash, name || null],
    });
    console.log(`Nuovo admin creato: ${normalizedEmail}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Errore creando l\'admin:', err);
  process.exit(1);
});
