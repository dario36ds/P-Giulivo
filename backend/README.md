# Giulivo — Backend prenotazioni

Express + JWT + Turso (libSQL) + Resend. Gestisce le richieste di
prenotazione dal sito pubblico e l'amministrazione da dashboard.

## 1. Setup locale

```bash
npm install
cp .env.example .env   # poi compila i valori
npm run dev             # richiede nodemon (incluso nelle devDependencies)
```

Senza una Turso vera, puoi sviluppare in locale lasciando
`TURSO_DATABASE_URL=file:local.db` — userà un file SQLite locale.

## 2. Database — Turso

```bash
turso db create giulivo-db
turso db show giulivo-db --url           # → TURSO_DATABASE_URL
turso db tokens create giulivo-db        # → TURSO_AUTH_TOKEN
```

Lo schema (`db/schema.sql`) viene applicato automaticamente a ogni avvio
del server (`CREATE TABLE IF NOT EXISTS…`, quindi è sicuro farlo ripartire).

## 3. Creare il primo utente admin

```bash
npm run create-admin -- admin@giulivovicopisano.it "PasswordSicura123!" "Dario"
```

Rilancia lo stesso comando con una nuova password per aggiornarla in futuro.

## 4. Email — Resend

Crea un account su resend.com, verifica il dominio (o usa il dominio di
test in sviluppo) e genera una API key. Compila `RESEND_API_KEY`,
`FROM_EMAIL` e `RESTAURANT_NOTIFY_EMAIL` nel `.env`. Se `RESEND_API_KEY`
manca, il server funziona comunque: salta solo l'invio email (utile in
sviluppo).

## 5. Deploy su Render

1. Crea un nuovo **Web Service** puntando a questo repo/cartella.
2. Build command: `npm install`
3. Start command: `npm start`
4. Aggiungi tutte le variabili di `.env.example` nelle Environment
   Variables di Render (incluso `CORS_ORIGIN` con il dominio Netlify del
   frontend, es. `https://giulivovicopisano.it`).
5. Dopo il primo deploy, lancia `npm run create-admin -- ...` dalla shell
   di Render (o in locale puntando alle stesse variabili Turso).

## 6. Collegare il frontend

Nel frontend, apri `frontend/js/config.js` e imposta `API_BASE_URL` con
l'URL pubblico di Render seguito da `/api`, es.:

```js
const API_BASE_URL = 'https://giulivo-backend.onrender.com/api';
```

## Endpoint principali

| Metodo | Percorso                       | Auth   | Descrizione                          |
|--------|---------------------------------|--------|---------------------------------------|
| GET    | `/api/health`                   | —      | Healthcheck                           |
| POST   | `/api/auth/login`               | —      | Login admin → JWT                     |
| GET    | `/api/auth/me`                  | admin  | Verifica token                        |
| POST   | `/api/reservations`             | —      | Crea richiesta di prenotazione        |
| GET    | `/api/reservations/availability`| —      | Coperti già prenotati per data        |
| GET    | `/api/reservations`             | admin  | Lista (filtri: status, from, to)      |
| PATCH  | `/api/reservations/:id`         | admin  | Aggiorna stato/note                   |
| DELETE | `/api/reservations/:id`         | admin  | Elimina                               |

## Nota multi-ristorante

Ogni prenotazione ha un campo `restaurant_slug` (fissato a `'giulivo'` in
questa istanza). Se in futuro vuoi unire questo backend a quello condiviso
con gli altri locali, la tabella `reservations` è già pronta per
ospitare più ristoranti nello stesso database.
