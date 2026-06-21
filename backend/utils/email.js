const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

async function sendCustomerConfirmation(reservation) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY non impostata: salto invio email cliente.');
    return;
  }
  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'Giulivo <prenotazioni@giulivovicopisano.it>',
    to: reservation.email,
    subject: 'Giulivo — abbiamo ricevuto la tua richiesta',
    html: `
      <div style="font-family:Georgia,serif;color:#211D14;line-height:1.6;">
        <h2 style="color:#3D4A28;">Ciao ${reservation.name},</h2>
        <p>Abbiamo ricevuto la tua richiesta di prenotazione da <strong>Giulivo — Cucina e Buonumore</strong>:</p>
        <ul>
          <li><strong>Data:</strong> ${formatDate(reservation.reservation_date)}</li>
          <li><strong>Orario:</strong> ${reservation.reservation_time}</li>
          <li><strong>Persone:</strong> ${reservation.party_size}</li>
        </ul>
        <p>Ti scriviamo a breve per confermare il tavolo. Per qualsiasi necessità puoi rispondere a questa email o scriverci su WhatsApp al 388 856 6367.</p>
        <p style="margin-top:24px;">A presto,<br>Guido &amp; Gabriele — Giulivo</p>
      </div>
    `,
  });
}

async function sendRestaurantNotification(reservation) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY non impostata: salto invio email al ristorante.');
    return;
  }
  const notifyTo = process.env.RESTAURANT_NOTIFY_EMAIL;
  if (!notifyTo) {
    console.warn('[email] RESTAURANT_NOTIFY_EMAIL non impostata: salto notifica al ristorante.');
    return;
  }
  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'Giulivo <prenotazioni@giulivovicopisano.it>',
    to: notifyTo,
    subject: `Nuova richiesta di prenotazione — ${formatDate(reservation.reservation_date)} ${reservation.reservation_time}`,
    html: `
      <div style="font-family:sans-serif;color:#211D14;line-height:1.6;">
        <h3>Nuova prenotazione (in attesa di conferma)</h3>
        <ul>
          <li><strong>Nome:</strong> ${reservation.name}</li>
          <li><strong>Email:</strong> ${reservation.email}</li>
          <li><strong>Telefono:</strong> ${reservation.phone}</li>
          <li><strong>Data:</strong> ${formatDate(reservation.reservation_date)}</li>
          <li><strong>Orario:</strong> ${reservation.reservation_time}</li>
          <li><strong>Persone:</strong> ${reservation.party_size}</li>
          <li><strong>Note:</strong> ${reservation.notes || '—'}</li>
        </ul>
        <p>Gestisci la richiesta dalla dashboard admin.</p>
      </div>
    `,
  });
}

module.exports = { sendCustomerConfirmation, sendRestaurantNotification };
