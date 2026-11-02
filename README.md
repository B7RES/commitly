# Payments — Personal Tracker

Applicazione personale per gestire e monitorare abbonamenti, utenze, finanziamenti, assicurazioni e altri impegni economici ricorrenti.

L'obiettivo è avere una panoramica chiara delle proprie scadenze, dei pagamenti effettuati e degli importi previsti, attraverso un'interfaccia minimale e intuitiva.

## Stack tecnologico

- **React** + TypeScript
- **Vite** per sviluppo e build
- **Dexie.js** + IndexedDB per la persistenza locale
- **React Router** per la navigazione
- **SCSS** per il sistema di stili e il design responsive
- **PWA** per installazione e funzionamento offline

## Funzionalità

- **Dashboard** — riepilogo degli impegni economici e delle prossime scadenze.
- **Impegni** — gestione di abbonamenti, utenze, finanziamenti, assicurazioni e pagamenti ricorrenti.
- **Dettaglio impegno** — consultazione delle informazioni, delle condizioni economiche e dello storico.
- **Calendario** — visualizzazione delle scadenze su base mensile.
- **Cronologia** — consultazione dei pagamenti registrati, con ricerca e filtri.
- **Registrazione pagamenti** — possibilità di registrare le occorrenze pagate o saltate.
- **Backup e ripristino** — esportazione e importazione dei dati tramite file JSON, con validazione e conferma prima del ripristino.
- **Impostazioni** — gestione dei dati e delle operazioni di backup.

## Architettura e dati

L'applicazione utilizza un'architettura local-first: i dati vengono salvati nel database IndexedDB del browser attraverso Dexie.js.

Il modello dati si basa su tre entità principali:

- `Commitment` — informazioni principali di ogni impegno economico.
- `CommitmentTerm` — condizioni economiche e periodi di validità.
- `PaymentHistory` — storico delle occorrenze e dei pagamenti.

Gli importi monetari vengono gestiti in centesimi interi per evitare imprecisioni nei calcoli.

Non è previsto un backend applicativo: i dati rimangono sul dispositivo e nel browser utilizzato.

## Struttura del progetto

```text
src/
├── components/       # Componenti UI riutilizzabili
├── pages/            # Pagine dell'applicazione
├── services/         # Servizi e logica di dominio
├── hooks/            # Custom React hooks
├── lib/              # Utility e funzioni condivise
├── types/            # Modelli e tipi TypeScript
├── styles/           # Architettura SCSS
├── App.tsx           # Configurazione principale dell'app
└── main.tsx          # Bootstrap React
```

## Sviluppo

Requisiti: Node.js e npm.

Installazione delle dipendenze:

```bash
npm install
```

Avvio in modalità sviluppo:

```bash
npm run dev
```

Build di produzione:

```bash
npm run build
```

Anteprima della build:

```bash
npm run preview
```

## Privacy e backup

I dati vengono conservati localmente nel browser tramite IndexedDB. L'applicazione non richiede account né un server applicativo.

IndexedDB non offre cifratura automatica: è quindi importante proteggere il dispositivo e conservare i backup JSON in un luogo sicuro.

Ogni browser e dispositivo mantiene il proprio database. Per trasferire i dati è possibile utilizzare le funzionalità di esportazione e ripristino.