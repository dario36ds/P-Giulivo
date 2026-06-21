const express = require('express');
const rateLimit = require('express-rate-limit');
const { client } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { validateReservationInput } = require('../utils/validators');
const { sendCustomerConfirmation, sendRestaurantNotification } = require('../utils/email');

const router = express.Router();
const RESTAURANT_SLUG = 'giulivo';

// Limita gli abusi sul form pubblico: max 8 richieste ogni 15 minuti per IP.
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Troppe richieste. Riprova fra qualche minuto.' },
});

/**
 * POST /api/reservations  (pubblico)
 * Crea una nuova richiesta di prenotazione in stato "pending".
 */
router.post('/', bookingLimiter, async (req, res) => {
  try {
    const errors = validateReservationInput(req.body);
    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const { name, email, phone, reservationDate, reservationTime, partySize, notes } = req.body;

    const insert = await client.execute({
      sql: `INSERT INTO reservations
            (restaurant_slug, name, email, phone, party_size, reservation_date, reservation_time, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      args: [
        RESTAURANT_SLUG,
        name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        Number(partySize),
        reservationDate,
        reservationTime,
        (notes || '').trim(),
      ],
    });

    const reservation = {
      id: Number(insert.lastInsertRowid),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      party_size: Number(partySize),
      reservation_date: reservationDate,
      reservation_time: reservationTime,
      notes: (notes || '').trim(),
      status: 'pending',
    };

    // Le email non bloccano la risposta al cliente in caso di problemi col provider.
    Promise.all([
      sendCustomerConfirmation(reservation),
      sendRestaurantNotification(reservation),
    ]).catch(err => console.error('[reservations] invio email fallito:', err));

    res.status(201).json({ message: 'Prenotazione ricevuta.', reservation });
  } catch (err) {
    console.error('[reservations/create]', err);
    res.status(500).json({ message: 'Errore durante il salvataggio della prenotazione.' });
  }
});

/**
 * GET /api/reservations/availability?date=YYYY-MM-DD  (pubblico)
 * Riepilogo dei coperti già prenotati per fascia oraria, utile per mostrare
 * eventuale tutto-esaurito in futuro. Semplificato: nessun limite di capienza imposto qui.
 */
router.get('/availability', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Parametro "date" obbligatorio.' });

    const result = await client.execute({
      sql: `SELECT reservation_time, SUM(party_size) as booked
            FROM reservations
            WHERE restaurant_slug = ? AND reservation_date = ? AND status != 'declined'
            GROUP BY reservation_time`,
      args: [RESTAURANT_SLUG, date],
    });

    res.json({ date, slots: result.rows });
  } catch (err) {
    console.error('[reservations/availability]', err);
    res.status(500).json({ message: 'Errore nel recupero della disponibilità.' });
  }
});

/**
 * GET /api/reservations  (admin)
 * Filtri opzionali: status, from, to
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, from, to } = req.query;
    let sql = `SELECT * FROM reservations WHERE restaurant_slug = ?`;
    const args = [RESTAURANT_SLUG];

    if (status) { sql += ' AND status = ?'; args.push(status); }
    if (from) { sql += ' AND reservation_date >= ?'; args.push(from); }
    if (to) { sql += ' AND reservation_date <= ?'; args.push(to); }
    sql += ' ORDER BY reservation_date ASC, reservation_time ASC';

    const result = await client.execute({ sql, args });
    res.json({ reservations: result.rows });
  } catch (err) {
    console.error('[reservations/list]', err);
    res.status(500).json({ message: 'Errore nel recupero delle prenotazioni.' });
  }
});

/**
 * PATCH /api/reservations/:id  (admin)
 * Aggiorna lo stato (pending | confirmed | declined | completed) e/o le note.
 */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body || {};
    const allowed = ['pending', 'confirmed', 'declined', 'completed'];

    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: 'Stato non valido.' });
    }
    if (!status && notes === undefined) {
      return res.status(400).json({ message: 'Nessun campo da aggiornare.' });
    }

    const fields = [];
    const args = [];
    if (status) { fields.push('status = ?'); args.push(status); }
    if (notes !== undefined) { fields.push('notes = ?'); args.push(notes); }
    fields.push("updated_at = datetime('now')");
    args.push(id, RESTAURANT_SLUG);

    await client.execute({
      sql: `UPDATE reservations SET ${fields.join(', ')} WHERE id = ? AND restaurant_slug = ?`,
      args,
    });

    const result = await client.execute({
      sql: 'SELECT * FROM reservations WHERE id = ? AND restaurant_slug = ?',
      args: [id, RESTAURANT_SLUG],
    });

    if (!result.rows[0]) return res.status(404).json({ message: 'Prenotazione non trovata.' });
    res.json({ reservation: result.rows[0] });
  } catch (err) {
    console.error('[reservations/update]', err);
    res.status(500).json({ message: "Errore nell'aggiornamento della prenotazione." });
  }
});

/**
 * DELETE /api/reservations/:id  (admin)
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await client.execute({
      sql: 'DELETE FROM reservations WHERE id = ? AND restaurant_slug = ?',
      args: [id, RESTAURANT_SLUG],
    });
    res.json({ message: 'Prenotazione eliminata.' });
  } catch (err) {
    console.error('[reservations/delete]', err);
    res.status(500).json({ message: "Errore nell'eliminazione della prenotazione." });
  }
});

module.exports = router;
