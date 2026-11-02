# Payments — Personal Tracker

App personale local-first per tenere sotto controllo abbonamenti, pagamenti ricorrenti e finanziamenti. I dati sono salvati nel browser tramite IndexedDB (Dexie); non è previsto un backend applicativo.

## Stack

- React + TypeScript + Vite
- Dexie + IndexedDB per i dati locali
- PWA installabile
- UI minimale bianco/nero, ispirata alle convenzioni shadcn/ui

## Struttura

```text
src/
  components/       # componenti UI riutilizzabili
  pages/            # schermate dell'app (calendario, future pagine)
  services/         # accesso al database locale
  lib/              # funzioni pure e utility
  types/            # modelli e tipi condivisi
  App.tsx           # shell, navigazione e coordinamento delle schermate
  main.tsx          # bootstrap React
  style.css         # design system e responsive styles
```

## Funzionalità

- Dashboard con riepilogo mensile e annuale
- Gestione abbonamenti, utenze e finanziamenti
- Registrazione pagamenti e cronologia
- Calendario mensile con scadenze ricorrenti, selezione del giorno e totale giornaliero/mensile
- Backup e ripristino JSON
- Installazione PWA e funzionamento offline dopo il primo caricamento

## Sviluppo

```bash
npm install
npm run dev
```

Build di produzione:

```bash
npm run build
```

## Privacy e backup

I dati finanziari restano nel database IndexedDB del browser e non vengono inviati a un server da questa app. IndexedDB non è cifrato automaticamente: proteggi il dispositivo e conserva backup JSON in un luogo sicuro. Ogni browser/dispositivo ha il proprio database; per trasferire i dati tra dispositivi usa esportazione e importazione del backup.
