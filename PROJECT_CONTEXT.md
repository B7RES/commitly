# PROJECT HANDOFF — PAYMENTS
## Personal Finance & Recurring Payments Tracker

Agisci come Senior Full-Stack Developer, Software Architect e UI/UX Designer. Il tuo compito è continuare lo sviluppo di questo progetto, trasformandolo in una web application moderna, modulare, affidabile e facilmente estendibile.

Non considerare questo progetto un semplice esercizio o una piccola applicazione temporanea. L'obiettivo è costruire un prodotto personale che crescerà progressivamente con nuove funzionalità.

Prima di modificare qualsiasi file, analizza attentamente il repository esistente, la sua struttura, le dipendenze, il database, i componenti e le funzionalità già implementate. Non riscrivere indiscriminatamente il progetto e non eliminare funzionalità esistenti senza una motivazione.

---

# 1. COS'È PAYMENTS

Payments è una web application personale per gestire e monitorare tutte le proprie uscite ricorrenti e gli impegni finanziari.

L'applicazione nasce dall'esigenza di avere un unico posto in cui visualizzare:

- Abbonamenti mensili e annuali.
- Servizi ricorrenti.
- Finanziamenti e prestiti.
- Acquisti a rate.
- Assicurazioni.
- Pagamenti periodici.
- Scadenze future.
- Rate già pagate e ancora da pagare.
- Importi residui da saldare.

L'obiettivo è sapere sempre:

- Quanto spendo ogni mese per gli impegni ricorrenti.
- Quali pagamenti arriveranno nei prossimi giorni.
- Quali rate devo ancora pagare.
- Quanto debito residuo ho.
- Quando terminerà un finanziamento.
- Quali abbonamenti e servizi sto pagando.
- Come cambierà la mia situazione economica nei mesi successivi.

## Filosofia del prodotto

Payments NON deve diventare inizialmente un'applicazione per registrare ogni singola spesa quotidiana.

Non è un clone di Wallet, Money Manager o un'app di contabilità completa.

Il focus principale è la gestione degli impegni finanziari ricorrenti e programmati.

La priorità è avere un'app semplice, veloce, chiara e precisa.

---

# 2. OBIETTIVI PRINCIPALI

Il progetto deve rispettare questi principi:

1. Local-first: i dati devono rimanere sul dispositivo dell'utente.
2. Privacy: nessun dato finanziario deve essere inviato a server esterni.
3. Offline-first: l'app deve poter funzionare senza connessione dopo l'installazione iniziale.
4. Modularità: ogni funzionalità deve essere organizzata in moduli indipendenti.
5. Scalabilità: aggiungere nuove funzionalità non deve richiedere di riscrivere l'applicazione.
6. Responsive: esperienza ottimale sia su desktop sia su smartphone.
7. Semplicità: interfaccia pulita, senza elementi visivi superflui.
8. Manutenibilità: codice leggibile, tipizzato e organizzato.

L'applicazione deve essere sviluppata pensando a un utilizzo continuativo nel tempo.

---

# 3. TECNOLOGIE

Utilizza preferibilmente lo stack già presente nel repository. Non cambiare tecnologia senza una motivazione concreta.

Stack di riferimento:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide React
- Dexie.js
- IndexedDB
- React Router, se necessario per una navigazione più strutturata.
- vite-plugin-pwa per il supporto PWA.
- date-fns per la gestione delle date, se non è già presente un'alternativa valida.

## Ruolo delle tecnologie

### React + TypeScript
Interfaccia a componenti, con tipizzazione rigorosa e componenti riutilizzabili.

### Vite
Build e sviluppo locale.

### Tailwind CSS
Gestione degli stili e del design system.

### shadcn/ui
Componenti UI accessibili e personalizzabili.

Non voglio un'interfaccia costruita interamente con componenti custom quando esiste già un componente shadcn/ui adatto.

### Dexie.js + IndexedDB
Database locale nel browser.

Tutti i dati finanziari devono essere salvati localmente.

Non utilizzare:
- Firebase.
- Supabase.
- Backend esterni.
- Database cloud.
- API finanziarie esterne.
- Servizi di analytics.
- Tracking di terze parti.

Non introdurre dipendenze esterne non necessarie.

---

# 4. ARCHITETTURA DEL PROGETTO

Il progetto deve avere una struttura modulare.

Evita assolutamente di inserire tutta la logica applicativa dentro App.tsx.

App.tsx deve limitarsi principalmente a comporre l'applicazione, gestire il layout generale e la navigazione.

Struttura indicativa desiderata:

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MobileNavigation.tsx
│   │
│   ├── shared/
│   │   ├── PageHeader.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── MoneyDisplay.tsx
│   │   └── ...
│   │
│   └── ui/
│       └── ...
│
├── features/
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   │
│   ├── payments/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── calendar/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   │
│   ├── installments/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   │
│   └── settings/
│       ├── components/
│       └── pages/
│
├── db/
│   ├── database.ts
│   ├── schema.ts
│   └── migrations.ts
│
├── hooks/
├── lib/
├── types/
├── constants/
├── styles/
└── main.tsx
```

Questa è una struttura di riferimento, non un obbligo di creare cartelle vuote.

Organizza il codice secondo le funzionalità effettivamente presenti.

## Regole architetturali

- Separare UI, logica di business e accesso ai dati.
- Evitare duplicazioni.
- Evitare componenti eccessivamente grandi.
- Evitare logica di calcolo direttamente nei componenti JSX.
- Utilizzare custom hooks quando opportuno.
- Centralizzare le operazioni sul database.
- Utilizzare TypeScript in maniera rigorosa.
- Evitare `any`.
- Utilizzare componenti condivisi quando hanno una reale utilità.
- Mantenere nomi coerenti e descrittivi.
- Non creare astrazioni inutilmente complesse.

---

# 5. DESIGN SYSTEM E UI/UX

Questa parte è molto importante.

Voglio un design estremamente minimal, moderno e pulito, ispirato all'estetica di shadcn/ui.

## Palette

La palette deve essere principalmente bianca, nera e grigia.

Light mode:
- Background: bianco o grigio molto chiaro.
- Card: bianco.
- Testo principale: quasi nero.
- Testo secondario: grigio.
- Border: grigio chiaro.
- Hover: grigio molto leggero.
- Primary: nero.
- Primary foreground: bianco.

Dark mode potrà essere aggiunta successivamente.

NON utilizzare:
- Sfondi verdi.
- Gradienti colorati.
- Ombre molto evidenti.
- Colori saturi come elementi decorativi.
- Card con colori differenti senza una reale necessità.
- Effetti glassmorphism.
- Animazioni eccessive.

I colori devono avere una funzione semantica.

Per esempio:
- Rosso: pagamento scaduto.
- Grigio: pagamento completato.
- Nero: azione principale.
- Altri colori solo quando realmente necessari.

## Aspetto generale

Voglio:
- Layout pulito.
- Spaziature coerenti.
- Border sottili.
- Radius moderati.
- Tipografia leggibile.
- Icone Lucide.
- Tabelle ordinate.
- Card semplici.
- Dialog e drawer per le operazioni.
- Transizioni discrete.

L'interfaccia deve sembrare un prodotto SaaS moderno, non una dashboard generica generata automaticamente.

Come riferimento estetico:
- shadcn/ui
- Linear
- Vercel
- Stripe Dashboard

Non copiare necessariamente questi prodotti, ma utilizzane la pulizia visiva come riferimento.

## Responsive

Desktop:
- Sidebar laterale.
- Contenuto principale con larghezza adeguata.
- Tabelle e dashboard ben organizzate.

Mobile:
- Navigazione ottimizzata.
- Sidebar sostituita da navigazione mobile.
- Tabelle adattate in card o layout compatti.
- Pulsanti facilmente utilizzabili con il pollice.
- Calendario leggibile anche su schermi piccoli.

---

# 6. FUNZIONALITÀ PRINCIPALI

## 6.1 Dashboard

La dashboard deve essere il punto di ingresso.

Deve fornire una panoramica immediata della situazione finanziaria.

Informazioni da visualizzare:

- Totale pagamenti previsti nel mese.
- Totale abbonamenti ricorrenti.
- Totale rate mensili.
- Debito residuo complessivo, quando disponibile.
- Prossime scadenze.
- Pagamenti già effettuati.
- Pagamenti scaduti.
- Pagamenti in arrivo.

Possibili sezioni:

1. Riepilogo mensile.
2. Prossime scadenze.
3. Abbonamenti attivi.
4. Finanziamenti in corso.
5. Attività recenti.

Non mostrare numeri inventati o calcoli basati su informazioni incomplete.

---

## 6.2 Gestione pagamenti

Deve essere possibile creare, modificare, visualizzare e archiviare un pagamento.

Campi indicativi:

```typescript
interface Payment {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  category: PaymentCategory;
  frequency: PaymentFrequency;
  startDate: string;
  nextPaymentDate: string;
  endDate?: string;
  status: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

Categorie iniziali:
- Subscription
- Financing
- Insurance
- Utilities
- Other

Frequenze:
- Weekly
- Monthly
- Every two months
- Quarterly
- Every six months
- Yearly
- One-time

Stati:
- Active
- Paused
- Completed
- Archived

I campi devono essere adattati alla tipologia di pagamento.

Ad esempio, un abbonamento Netflix non ha necessariamente una data di fine, mentre un finanziamento ha una durata definita.

---

## 6.3 Finanziamenti e rate

I finanziamenti devono avere informazioni specifiche.

Esempio:

```typescript
interface InstallmentPlan {
  id: string;
  paymentId: string;
  totalInstallments?: number;
  paidInstallments: number;
  installmentAmount: number;
  originalAmount?: number;
  remainingAmount?: number;
  startDate?: string;
  estimatedEndDate?: string;
}
```

Funzionalità desiderate:

- Numero totale di rate.
- Rate già pagate.
- Rate rimanenti.
- Importo della singola rata.
- Importo iniziale.
- Debito residuo.
- Data prevista di conclusione.
- Cronologia dei pagamenti.

Attenzione: il debito residuo non deve essere calcolato automaticamente se mancano informazioni sufficienti.

Prevedere la possibilità di inserire manualmente il residuo.

---

## 6.4 Cronologia pagamenti

Ogni pagamento deve poter avere uno storico.

```typescript
interface PaymentHistory {
  id: string;
  paymentId: string;
  date: string;
  amount: number;
  notes?: string;
  status: "paid" | "skipped";
}
```

Deve essere possibile:

- Segnare una rata come pagata.
- Visualizzare i pagamenti precedenti.
- Consultare le date.
- Correggere un pagamento registrato erroneamente.
- Visualizzare lo storico di uno specifico abbonamento o finanziamento.

Non modificare retroattivamente le informazioni senza mantenere la coerenza dello storico.

---

# 7. CALENDARIO

Il calendario è una funzionalità fondamentale.

Deve avere una pagina dedicata accessibile dalla navigazione principale.

## Vista mensile

- Visualizzare tutti i giorni del mese.
- Evidenziare il giorno corrente.
- Mostrare indicatori discreti sui giorni con scadenze.
- Distinguere pagamenti previsti, completati e scaduti.
- Permettere la navigazione tra mesi.
- Permettere di selezionare un giorno.

## Giorno selezionato

Quando l'utente seleziona una data, mostrare:

- Lista dei pagamenti previsti.
- Nome del pagamento.
- Importo.
- Categoria.
- Stato.
- Totale previsto per quella giornata.

## Riepilogo mensile

Mostrare:
- Totale previsto nel mese.
- Numero di scadenze.
- Pagamenti già effettuati.
- Pagamenti ancora da effettuare.

## Regola architetturale importante

Il calendario NON deve avere un database separato di eventi duplicati.

Le date devono essere generate a partire dai pagamenti e dalle relative regole di ricorrenza.

Il calendario deve utilizzare un servizio dedicato per generare le occorrenze.

Esempio concettuale:

```typescript
generatePaymentOccurrences(
  payments,
  startDate,
  endDate
)
```

Questo servizio deve gestire correttamente:
- Ricorrenze mensili.
- Ricorrenze annuali.
- Scadenze con date di fine.
- Pagamenti sospesi.
- Pagamenti completati.
- Modifiche alle date.
- Mesi con un numero differente di giorni.

Evitare errori come spostare una ricorrenza dal 31 gennaio al 3 marzo senza una regola esplicita.

Le date devono essere gestite in modo coerente con il fuso orario locale, evitando problemi causati dalla conversione UTC.

---

# 8. DATABASE E PERSISTENZA

Utilizzare Dexie.js sopra IndexedDB.

Il database deve essere locale e non deve richiedere account o autenticazione.

Prevedere tabelle separate per:
- Payments
- InstallmentPlans
- PaymentHistory

Prevedere migrazioni del database.

IMPORTANTE: il progetto crescerà. Non modificare lo schema in maniera distruttiva quando vengono aggiunti nuovi campi.

Utilizzare versioning di Dexie per gestire le migrazioni.

## Backup

Prevedere:
- Esportazione completa dei dati in JSON.
- Importazione da JSON.
- Validazione dei dati importati.
- Gestione di file non validi.
- Conferma prima di sovrascrivere o unire dati esistenti.

Il backup deve includere tutte le entità necessarie.

---

# 9. PRIVACY E SICUREZZA

Questo progetto è destinato alla gestione di informazioni finanziarie personali.

La privacy è una priorità.

Regole:

- Nessun backend.
- Nessuna autenticazione cloud.
- Nessun invio di informazioni finanziarie a servizi esterni.
- Nessun analytics.
- Nessun tracking.
- Nessuna telemetria.
- Nessuna API esterna per i dati personali.

I dati devono rimanere in IndexedDB sul dispositivo.

IMPORTANTE: IndexedDB non è automaticamente cifrato.

Non dichiarare che i dati sono cifrati o protetti da password se questa funzionalità non viene implementata.

Prevedere in futuro la possibilità di cifrare i backup e valutare la cifratura locale.

Non inserire informazioni personali o finanziarie di esempio nel repository.

---

# 10. GITHUB PAGES E DEPLOYMENT

L'applicazione verrà pubblicata su GitHub Pages.

Il repository GitHub conterrà il codice sorgente.

GitHub Pages servirà esclusivamente i file statici generati da Vite.

Non deve esserci un backend.

## Requisiti Vite

Configurare correttamente il base path.

GitHub Pages utilizza normalmente un URL del tipo:

```text
https://username.github.io/repository-name/
```

Quindi Vite deve essere configurato con il base path corretto.

Non dare per scontato che l'applicazione venga servita dalla root `/`.

## Requisiti di deployment

- Build tramite `npm run build`.
- Output statico in `dist/`.
- Deployment automatico tramite GitHub Actions.
- Gestione corretta degli asset.
- PWA funzionante su GitHub Pages.
- Service Worker configurato correttamente.
- Manifest PWA valido.
- Icone PWA.
- Supporto HTTPS.

Se viene utilizzato React Router, verificare attentamente il funzionamento del routing su GitHub Pages, che non supporta automaticamente il fallback SPA per tutte le route.

Preferire una soluzione compatibile, ad esempio HashRouter, se necessario.

## Privacy del deployment

Il fatto che il sito sia pubblicato su GitHub Pages non significa che i dati finanziari siano pubblici.

Il codice dell'applicazione è scaricabile da chi visita il sito, ma i dati IndexedDB sono locali al browser e all'origine del sito.

Non utilizzare storage cloud.

Non inserire dati personali nel codice sorgente.

Un repository privato non equivale automaticamente a un sito GitHub Pages privato: il deployment deve essere considerato accessibile tramite URL.

---

# 11. PWA E UTILIZZO SU SMARTPHONE

L'applicazione dovrà poter essere installata su Android come una normale applicazione.

Utilizzare vite-plugin-pwa.

Requisiti:

- Web App Manifest.
- Icone appropriate.
- Service Worker.
- Cache degli asset statici.
- Funzionamento offline dopo il primo caricamento.
- Aggiornamento dell'applicazione quando viene pubblicata una nuova versione.
- Layout mobile responsive.

L'utente deve poter aprire il sito con Chrome su Android e installarlo dalla funzione "Installa app" o "Aggiungi a schermata Home".

L'applicazione deve poter essere utilizzata anche senza connessione dopo la corretta installazione e il primo caricamento.

Attenzione: una PWA non equivale a un'applicazione Android nativa.

Widget Android nativi e alcune funzionalità avanzate potranno essere valutati successivamente tramite Capacitor.

---

# 12. FUNZIONALITÀ FUTURE — ROADMAP

Non implementare necessariamente tutto subito.

La priorità è costruire una base solida e lasciare spazio alla crescita.

## Fase 1 — Core application

- Dashboard.
- Gestione pagamenti.
- Abbonamenti.
- Finanziamenti.
- Cronologia.
- Calendario.
- IndexedDB.
- Backup e restore.
- Design responsive.
- Deployment GitHub Pages.
- PWA.

## Fase 2 — Miglioramenti

- Ricerca globale.
- Filtri avanzati.
- Ordinamento pagamenti.
- Statistiche mensili.
- Grafici delle uscite ricorrenti.
- Previsioni finanziarie.
- Notifiche sulle scadenze.
- Tag personalizzati.
- Gestione di più valute.
- Ricerca e filtri nel calendario.

## Fase 3 — Funzionalità avanzate

- Widget Android.
- Esportazione CSV.
- Report PDF.
- Dashboard personalizzabile.
- Dark mode.
- Cifratura locale.
- Backup cifrati.
- Importazione guidata da file.
- Possibile sincronizzazione tra dispositivi tramite soluzione controllata dall'utente.

## Fase 4 — Possibili espansioni

Solo se realmente utili:
- Gestione entrate.
- Gestione spese occasionali.
- Budget mensili.
- Obiettivi di risparmio.
- Analisi patrimoniale.

Non spostare il focus iniziale dell'applicazione.

---

# 13. QUALITÀ DEL CODICE

Voglio un progetto mantenibile e professionale.

Regole:

- TypeScript strict.
- Componenti piccoli e riutilizzabili.
- Separazione tra UI e business logic.
- Funzioni pure per i calcoli.
- Validazione dei form.
- Gestione degli errori.
- Stati di loading.
- Empty states.
- Conferme per operazioni distruttive.
- Accessibilità di base.
- Nessun dato mockato nella produzione.
- Nessun `console.log` lasciato inutilmente.
- Nessun codice duplicato.
- Nessun componente monolitico.

Quando utile, introdurre:
- Zod per la validazione.
- React Hook Form per i form complessi.
- date-fns per le date.
- Vitest per i test.
- Testing Library per i componenti.

Non aggiungere tutte queste dipendenze automaticamente: valutare prima il progetto esistente.

---

# 14. TEST E AFFIDABILITÀ

Le operazioni finanziarie devono essere precise.

Particolare attenzione a:
- Calcoli monetari.
- Arrotondamenti.
- Date.
- Ricorrenze.
- Rate.
- Importi residui.
- Modifiche ai pagamenti.
- Backup e restore.

Evitare di usare floating point in maniera ingenua per somme di denaro.

Valutare l'utilizzo di importi interi in centesimi nel modello di dominio.

Esempio:

```typescript
const amountInCents = 5499;
```

I test devono coprire soprattutto le funzioni di business logic.

---

# 15. MODALITÀ DI LAVORO

Prima di iniziare:

1. Analizza tutti i file del repository.
2. Identifica le funzionalità già implementate.
3. Identifica problemi architetturali.
4. Verifica le dipendenze.
5. Verifica lo stato del database.
6. Verifica la build attuale.
7. Confronta lo stato reale con gli obiettivi descritti in questo documento.

Successivamente crea un piano di lavoro ordinato.

Non riscrivere l'intero progetto in una sola operazione.

Procedi per step indipendenti.

Per ogni step:
- Spiega cosa intendi modificare.
- Mantieni le funzionalità esistenti.
- Implementa la modifica.
- Esegui i test disponibili.
- Esegui `npm run build`.
- Risolvi eventuali errori.
- Aggiorna la documentazione quando necessario.

Non dichiarare una funzionalità completata se non è stata effettivamente implementata e verificata.

Non creare file inutili solo per rispettare rigidamente la struttura suggerita.

Non introdurre dipendenze o servizi a pagamento.

---

# 16. PRIMO TASK RICHIESTO A GITHUB COPILOT

Per iniziare, NON aggiungere immediatamente nuove funzionalità.

Prima analizza il progetto attuale e restituisci un report con:

1. Architettura attuale.
2. Stack tecnologico effettivamente utilizzato.
3. Funzionalità già implementate.
4. Funzionalità mancanti.
5. Problemi tecnici individuati.
6. Problemi di design.
7. Problemi di compatibilità con GitHub Pages.
8. Problemi relativi alla PWA e all'offline.
9. Possibili problemi di persistenza dei dati.
10. Piano di refactoring consigliato.

Dopo il report, proponi una roadmap tecnica divisa in piccoli step.

La prima priorità è ottenere una base architetturale solida, un'interfaccia coerente con il design system descritto e un calendario affidabile.

Non procedere con modifiche distruttive senza aver prima spiegato cosa verrà cambiato.

---

# VISIONE FINALE

Payments deve diventare il mio centro di controllo personale per tutti i pagamenti ricorrenti e gli impegni finanziari.

Voglio aprirlo e capire immediatamente:

- Cosa devo pagare.
- Quando devo pagarlo.
- Quanto sto pagando.
- Quanto mi rimane da pagare.
- Quando finiranno i miei finanziamenti.
- Quanto pesano gli impegni ricorrenti sul mio budget.

Deve essere un'applicazione veloce, minimal, privata, installabile e utilizzabile offline.

La semplicità dell'interfaccia deve nascondere una struttura tecnica solida.

Costruisci il progetto pensando alle funzionalità che potrà avere tra un anno, non soltanto a quelle che possiede oggi.