/* ==========================================================================
   GIULIVO — form di prenotazione
   ========================================================================== */

/* API_BASE_URL è definita in js/config.js (caricato prima di questo file). */

function todayISO() {
  const { day, hhmm } = (function () {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' });
    return { day: fmt.format(new Date()), hhmm: '' };
  })();
  return day; // formato YYYY-MM-DD
}

function setFieldError(field, message) {
  field.classList.toggle('has-error', Boolean(message));
  const err = field.querySelector('.field-error');
  if (err) err.textContent = message || '';
}

function validateReservation(data) {
  const errors = {};
  if (!data.firstName || data.firstName.trim().length < 2) errors.firstName = 'Inserisci il nome.';
  if (!data.lastName || data.lastName.trim().length < 2) errors.lastName = 'Inserisci il cognome.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Email non valida.';
  if (!/^[0-9+\s]{6,18}$/.test(data.phone)) errors.phone = 'Numero di telefono non valido.';
  if (!data.date) errors.date = 'Scegli una data.';
  else if (data.date < todayISO()) errors.date = 'La data non può essere nel passato.';
  if (!data.time) errors.time = 'Scegli un orario.';
  const people = Number(data.people);
  if (!people || people < 1 || people > 20) errors.people = 'Indica il numero di persone (1-20).';
  return errors;
}

function initReservationForm() {
  const form = document.querySelector('#reservation-form');
  if (!form) return;

  const dateInput = form.querySelector('#res-date');
  if (dateInput) dateInput.min = todayISO();

  const statusBox = form.querySelector('.form-status');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusBox.className = 'form-status';
    statusBox.textContent = '';

    const data = {
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      date: form.date.value,
      time: form.time.value,
      people: form.people.value,
      notes: form.notes.value.trim(),
    };

    const errors = validateReservation(data);
    ['firstName', 'lastName', 'email', 'phone', 'date', 'time', 'people'].forEach(key => {
      const field = form.querySelector(`[data-field="${key}"]`);
      if (field) setFieldError(field, errors[key]);
    });
    if (Object.keys(errors).length) {
      statusBox.classList.add('is-error');
      statusBox.textContent = 'Controlla i campi evidenziati e riprova.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Invio in corso…';

    try {
      const res = await fetch(`${API_BASE_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
          phone: data.phone,
          reservationDate: data.date,
          reservationTime: data.time,
          partySize: Number(data.people),
          notes: data.notes,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Richiesta non riuscita.');
      }

      statusBox.classList.add('is-success');
      statusBox.textContent = 'Richiesta inviata! Ti scriviamo a breve per confermare il tavolo.';
      form.reset();
      if (dateInput) dateInput.min = todayISO();
    } catch (err) {
      statusBox.classList.add('is-error');
      statusBox.textContent = 'Non siamo riusciti a inviare la richiesta. Riprova oppure scrivici su WhatsApp.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Richiedi il tavolo';
    }
  });
}

document.addEventListener('DOMContentLoaded', initReservationForm);
