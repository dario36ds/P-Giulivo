# Giulivo — Cucina e Buonumore (Vicopisano)

Sito + backend prenotazioni per il ristorante Giulivo, Località Luchetta 7,
56010 Vicopisano (PI).

```
giulivo/
├── frontend/          sito statico → deploy su Netlify
│   ├── index.html, menu.html, chi-siamo.html, galleria.html, prenotazioni.html
│   ├── css/style.css       sistema di design (palette, tipografia, componenti)
│   ├── js/main.js          header sticky, menu mobile, scroll reveal, cookie banner, orari live
│   ├── js/config.js        ⚠️ UNICO punto dove impostare l'URL del backend
│   ├── js/reservation.js   form di prenotazione → API
│   └── admin/              dashboard di gestione prenotazioni (login + tabella)
└── backend/           API → deploy su Render
    ├── server.js, routes/, middleware/, db/, utils/
    └── README.md       istruzioni dettagliate per Turso, Render, Resend, admin
```

## Prima del lancio — cose da sistemare

Tutto il sito è già funzionante e testato (frontend + backend collaudati
end-to-end), ma contiene **contenuti segnaposto** da sostituire con i dati
reali di Guido e Gabriele:

- **Foto**: tutte le caselle "FOTO — ..." in `chi-siamo.html`, `galleria.html`
  e nella home vanno sostituite con scatti veri (anche presi dal profilo
  Instagram @giulivo_ristorante).
- **Menù**: i piatti in `menu.html` sono di esempio — serve il menù vero con
  prezzi aggiornati.
- **Orari**: in `frontend/js/main.js` (oggetto `GIULIVO_HOURS`) ho ipotizzato
  cena 19:00–23:00/23:30, chiuso il lunedì. Da confermare con il locale.
- **Recensioni**: quelle in home sono riscritte in forma originale a partire
  dal senso di recensioni reali su Google — meglio sostituirle con citazioni
  autorizzate o nuove recensioni dirette.
- **P.IVA** nel footer.

## Deploy in 3 passi

1. **Backend su Render** — segui `backend/README.md` (Turso + variabili
   d'ambiente + creazione del primo admin).
2. **Frontend su Netlify** — trascina la cartella `frontend/` (o collega il
   repo, publish directory = `frontend`). Prima del deploy aggiorna
   `frontend/js/config.js` con l'URL del backend appena creato su Render.
3. **Dominio + DNS** quando deciso.

## Dashboard admin

Una volta in produzione: `https://tuodominio.it/admin/` → login con le
credenziali create via `npm run create-admin` sul backend. Da lì si vedono
tutte le prenotazioni, si confermano/rifiutano/completano o si eliminano,
con statistiche rapide (oggi, da confermare, prossimi 7 giorni, totale).
