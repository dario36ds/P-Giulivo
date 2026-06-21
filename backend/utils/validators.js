const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\s]{6,18}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function todayISOInRome() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());
}

function validateReservationInput(body) {
  const errors = [];
  const { name, email, phone, reservationDate, reservationTime, partySize, notes } = body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Il nome deve avere almeno 2 caratteri.');
  }
  if (!email || !EMAIL_RE.test(email)) {
    errors.push('Email non valida.');
  }
  if (!phone || !PHONE_RE.test(phone)) {
    errors.push('Numero di telefono non valido.');
  }
  if (!reservationDate || !DATE_RE.test(reservationDate)) {
    errors.push('Data non valida (formato YYYY-MM-DD).');
  } else if (reservationDate < todayISOInRome()) {
    errors.push('La data non può essere nel passato.');
  }
  if (!reservationTime || !TIME_RE.test(reservationTime)) {
    errors.push('Orario non valido (formato HH:MM).');
  }
  const size = Number(partySize);
  if (!size || size < 1 || size > 20) {
    errors.push('Numero di persone non valido (1-20).');
  }
  if (notes && typeof notes === 'string' && notes.length > 500) {
    errors.push('Le note sono troppo lunghe (max 500 caratteri).');
  }

  return errors;
}

module.exports = { validateReservationInput, todayISOInRome };
