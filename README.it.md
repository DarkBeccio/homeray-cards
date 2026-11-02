# Homeray

**La radiografia della tua casa in Home Assistant.** Homeray ti mostra a colpo d'occhio cosa non funziona nella tua casa intelligente: dispositivi che non rispondono, integrazioni ferme, aggiornamenti in attesa e batterie scariche. Non va configurato.

[![hacs](https://img.shields.io/badge/HACS-Default-41BDF5.svg)](https://hacs.xyz)
[![Offrimi un caffè](https://img.shields.io/badge/Offrimi%20un%20caff%C3%A8-PayPal-FFB547?logo=paypal&logoColor=white)](https://paypal.me/AndreaGuarducci1992)

🇬🇧 [Read in English](README.md)

![Quadro dei problemi di Homeray](images/issues-it.png)

## Le card

| Card | Cosa fa |
| --- | --- |
| `homeray-issues-card` | Trova da sola i dispositivi che non rispondono (e da quanto), le integrazioni ferme, gli aggiornamenti in attesa e le batterie scariche. Le TV in standby stanno in un elenco a parte e puoi smettere di monitorare un dispositivo direttamente dalla card. Toccando una riga si apre il dettaglio. |
| `homeray-gauge-card` | Indicatore ad anello con soglie di colore, per CPU, memoria, disco, temperatura o qualsiasi sensore numerico. |

Le card usano la lingua di Home Assistant: italiano se Home Assistant è in italiano, altrimenti inglese.

## Installazione

### Con HACS (consigliata)

Homeray è nello store predefinito di HACS.

[![Apri in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=DarkBeccio&repository=homeray-cards&category=plugin)

1. Apri **HACS** e cerca **Homeray**.
2. Aprilo, scegli **Scarica** e ricarica la pagina.

Se Homeray non compare nella ricerca, aggiungilo come repository personalizzato: HACS → tre puntini in alto a destra → **Repository personalizzati** → repository `https://github.com/DarkBeccio/homeray-cards`, tipo **Dashboard**. Poi cerca di nuovo.

### A mano

1. Scarica [`homeray-cards.js`](https://github.com/DarkBeccio/homeray-cards/raw/main/homeray-cards.js) e copialo in `/config/www/`.
2. Impostazioni → Dashboard → tre puntini → **Risorse** → **Aggiungi risorsa**: URL `/local/homeray-cards.js?v=1.1.0`, tipo **Modulo JavaScript**.
3. Ricarica la pagina (Ctrl+Maiusc+R). Nella console del browser compare `HOMERAY 1.1.0`.

## Quadro dei problemi

```yaml
type: custom:homeray-issues-card
summary: true
dark: true
```

| Opzione | Predefinito | Cosa fa |
| --- | --- | --- |
| `summary` | `false` | Mostra il riepilogo in cima: totale e stanze con più problemi (va bene anche `riepilogo`) |
| `dark` | `false` | Colori pieni per il tema scuro, invece dell'effetto vetro |
| `battery` | `20` | Soglia in % sotto cui una batteria è "scarica" (da 0 a 100) |
| `rows` | `7` | Righe mostrate per riquadro prima di "Mostra tutti" (1 o più) |
| `exclude_label` | `fuori_monitoraggio` | ID dell'etichetta dei dispositivi da ignorare del tutto: disponibilità, aggiornamenti e batterie |
| `grace` | `5` | Minuti in cui un dispositivo deve restare irraggiungibile prima di comparire, così le cadute brevi non fanno scattare l'allarme (0 = subito) |
| `standby_domains` | `[media_player]` | I dispositivi con un'entità di questi domini (TV, casse, lettori) vanno nell'elenco grigio "Spenti o in standby" invece che in quello rosso. `[]` lo disattiva |

Un dispositivo risulta "non risponde" quando almeno una sua entità è non disponibile e nessun'altra ha uno stato reale (sono tutte non disponibili o sconosciute). È una stima basata sulle entità, non una verifica diretta della connessione. Ogni riga dice da quanto tempo il dispositivo non risponde, e le cadute più vecchie vengono per prime; il tempo parte dall'ultimo cambio di stato visto da Home Assistant, quindi un riavvio lo azzera. Tra le batterie scariche ci sono i sensori di batteria sotto soglia e i sensori binari di batteria che segnalano "scarica"; un dispositivo già elencato con la percentuale non viene contato due volte. Se le integrazioni non si possono leggere, la card lo dice invece di mostrare "Tutto a posto".

**Smettere di monitorare un dispositivo.** Gli amministratori vedono un pulsante a forma di occhio su ogni riga: lo tocchi, confermi, e il dispositivo riceve l'etichetta `exclude_label` (se l'etichetta non esiste, viene creata). Per rimetterlo sotto controllo, apri l'elenco "Non monitorati" in fondo. L'etichetta si può anche aggiungere a mano da Impostazioni → Dispositivi. Chi non è amministratore non vede i pulsanti.

## Indicatore ad anello

```yaml
type: custom:homeray-gauge-card
entity: sensor.system_monitor_processor_temperature
name: Temperatura
min: 20
max: 85
warn: 65
bad: 75
decimals: 0
grid_options: {columns: 3, rows: 3}
```

| Opzione | Predefinito | Cosa fa |
| --- | --- | --- |
| `entity` | obbligatoria | Il sensore numerico da mostrare |
| `name` | nome dell'entità | Scritta sotto l'anello |
| `min` / `max` | `0` / `100` | Valori dell'anello vuoto e pieno (`max` deve essere maggiore di `min`) |
| `warn` / `bad` | nessuna | Soglie dell'arancione e del rosso |
| `invert` | `false` | Colori al contrario: rosso quando il valore è basso, per esempio giorni a una scadenza |
| `unit` | unità dell'entità | Testo sotto il numero |
| `decimals` | 1 sotto 10, poi 0 | Cifre decimali (da 0 a 6) |

Quattro anelli da 3 colonne stanno su una riga.

## Homeray Pro

Vuoi vedere tutta la rete di casa, piano per piano? **Homeray Pro** aggiunge la mappa della casa: l'edificio disegnato a spaccato, con router, switch e access point nella loro stanza, i cavi e le powerline, lo stato in tempo reale e la scheda di ogni apparato. Si disegna da sola a partire dall'elenco dei piani e dei collegamenti.

![Mappa della casa di Homeray Pro](images/homeray-pro-map-it.png)

Homeray Pro è in italiano e in inglese e comprende anche una card di affidabilità (disponibilità, cadute e caduta più lunga di ogni apparato negli ultimi giorni), il pulsante Ricarica per le integrazioni ferme, un tema scuro, una dashboard di sistema pronta, la modalità demo con dati finti e la guida completa. → **[homeray.app](https://homeray.app)**

## Sostieni il progetto

Homeray è gratis. Se ti fa risparmiare tempo, puoi [offrirmi un caffè](https://paypal.me/AndreaGuarducci1992) ☕

## Licenza

MIT © 2026 DarkBeccio. Homeray è un progetto indipendente, non affiliato a Home Assistant né a Nabu Casa.
