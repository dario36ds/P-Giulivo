const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { client } = require('../db/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e password sono obbligatorie.' });
    }

    const result = await client.execute({
      sql: 'SELECT id, email, password_hash, name FROM admins WHERE email = ? LIMIT 1',
      args: [email.toLowerCase().trim()],
    });

    const admin = result.rows[0];
    if (!admin) {
      return res.status(401).json({ message: 'Credenziali non valide.' });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Credenziali non valide.' });
    }

    const token = jwt.sign(
      { sub: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ message: 'Errore durante il login.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ admin: req.admin });
});

module.exports = router;
