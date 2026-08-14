# Tedware website

De officiële statische bedrijfswebsite voor [tedware.nl](https://tedware.nl). De site presenteert Tedware als Nederlandse onafhankelijke softwarestudio en bevat een eerste projectpagina voor Killdoku, een supportbasis en een nadrukkelijk onvoltooid privacybeleid-sjabloon.

## Architectuur

De website gebruikt alleen HTML5, moderne CSS en vanilla JavaScript. Er zijn geen frameworks, buildstappen, externe lettertypen, trackers, cookies of runtime-dependencies. Alle paden zijn relatief en de bestanden kunnen direct vanaf GitHub Pages worden aangeboden.

```text
/
├── index.html                  Homepage, About, Projects en Contact
├── privacy.html                Tweetalige privacytemplate
├── support.html                Tweetalige Killdoku-supportpagina
├── css/styles.css              Gedeeld ontwerp en responsive regels
├── js/main.js                  Taal, navigatie en kleine interacties
├── js/translations.js          Alle Engelse en Nederlandse teksten
├── assets/icons/favicon.svg    Tijdelijke favicon-placeholder
├── assets/images/              Ruimte voor toekomstige officiële media
├── scripts/validate-site.mjs   Dependencyvrije lokale controle
├── scripts/test-i18n.mjs       Tests voor taalkeuze en opslagfallback
├── robots.txt
├── sitemap.xml
├── site.webmanifest
├── CNAME
└── .nojekyll
```

## Lokaal bekijken

Open bij voorkeur een eenvoudige lokale webserver in deze map. Met Python op Windows:

```powershell
py -m http.server 8000
```

Open daarna `http://localhost:8000/`. Stop de server met `Ctrl+C`. Zonder Python kan `index.html` rechtstreeks worden geopend; een lokale server benadert GitHub Pages echter beter.

Voer, als Node.js beschikbaar is, ook de dependencyvrije projectcontrole uit:

```powershell
node scripts/validate-site.mjs
node scripts/test-i18n.mjs
```

## EN/NL-vertalingen

Engels staat volledig in de HTML en blijft daardoor bruikbaar als JavaScript of browseropslag niet beschikbaar is. `js/translations.js` bevat voor iedere zichtbare tekst en relevante metadata een Engelse en Nederlandse waarde.

Bij een eerste bezoek wordt altijd Engels gebruikt. De knoppen `EN / NL` roepen de vertaalmodule in `js/main.js` aan. Een handmatige keuze wordt onder de sleutel `tedware-language` in `localStorage` bewaard. Als opslag wordt geblokkeerd, werkt de taalwissel nog steeds voor de huidige pagina.

Nieuwe tekst toevoegen:

1. geef het HTML-element een unieke `data-i18n="groep.sleutel"`;
2. voeg dezelfde sleutel aan zowel `en` als `nl` in `js/translations.js` toe;
3. gebruik voor attributen bijvoorbeeld `data-i18n-attr="content:meta.sleutel"`;
4. voer `node scripts/validate-site.mjs` uit.

## Verplichte placeholders vóór lancering

### Contact

Vervang `CONTACT_EMAIL_HERE` één keer in `js/main.js` door het echte openbare Tedware-e-mailadres. Tot die tijd toont de site bewust geen werkende e-maillink. De code activeert `mailto:` alleen wanneer de waarde op een werkelijk e-mailadres lijkt. Zonder JavaScript blijft de neutrale melding zichtbaar; voeg het adres later ook als statische fallback aan de drie HTML-pagina’s toe als e-mailcontact zonder JavaScript vereist is.

### Privacybeleid

`privacy.html` is een redactiesjabloon en geen definitief juridisch document. Voor publicatie van Killdoku of een andere app moeten alle gemarkeerde acties worden afgerond. Controleer minimaal:

- op welk product en welke versie het beleid van toepassing is;
- de ingangsdatum en verantwoordelijke onderneming;
- alle werkelijk verwerkte gegevenscategorieën en gegevensbronnen;
- de doelen en, waar vereist, rechtsgronden;
- iedere SDK, hostingpartij, platformdienst of andere derde partij;
- bewaartermijnen en verwijderingsprocedures;
- doelgroep, leeftijdsclassificatie, landen en regels voor kinderen;
- werkelijk toegepaste beveiligingsmaatregelen;
- gebruikersrechten en het afhandelingsproces;
- een werkend privacycontactadres;
- overeenstemming met de Google Play Data safety-sectie en eventuele App Store-privacyantwoorden.

Laat de definitieve tekst zo nodig juridisch beoordelen. Verwijder pas daarna de waarschuwing en de aanduiding “Draft template / Conceptsjabloon”.

### Productmedia en publicatiegegevens

- Vervang de Killdoku-mediaplaatshouder in `index.html` pas door officiële screenshots of artwork.
- Vervang `assets/icons/favicon.svg` zodra er een officieel merkicoon bestaat.
- Voeg geverifieerde downloadlinks, platformen, releasedatum, versies en systeemeisen toe wanneer deze vaststaan.
- Overweeg later een officiële social-previewafbeelding en voeg die dan als `og:image` en `twitter:image` toe. Titel, beschrijving, URL, type en locale zijn al geconfigureerd.

## Repository aanmaken en naar GitHub pushen

Publiceer pas wanneer de placeholders die voor de lancering relevant zijn zijn gecontroleerd.

```powershell
git init
git add .
git commit -m "Build Tedware website"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

Vervang `USERNAME` en `REPOSITORY` door de werkelijke GitHub-waarden. Er worden door dit project geen credentials opgeslagen.

## GitHub Pages inschakelen

1. Open op GitHub de repository en ga naar **Settings → Pages**.
2. Kies bij **Build and deployment** voor **Deploy from a branch**.
3. Selecteer branch `main`, map `/ (root)` en sla de instelling op.
4. Wacht tot GitHub de Pages-URL toont en controleer eerst die URL.
5. Vul onder **Custom domain** `tedware.nl` in. Het bestand `CNAME` in deze repository bevat deze domeinnaam al.

## `tedware.nl`, STRATO en HTTPS

Maak nog geen DNS-records op basis van algemene voorbeelden. De juiste doelwaarden hangen af van de uiteindelijke GitHub-accountnaam, repository-instelling en de instructies die GitHub Pages op dat moment toont.

Veilige volgorde:

1. activeer eerst GitHub Pages en noteer de werkelijke Pages-hostnaam;
2. open daarna de custom-domain-instructies in **Settings → Pages**;
3. voeg in STRATO uitsluitend de door GitHub gevraagde records voor het hoofddomein en eventueel `www` toe;
4. verwijder of wijzig alleen conflicterende bestaande records nadat hun functie bekend is;
5. wacht op DNS-validatie in GitHub;
6. activeer **Enforce HTTPS** zodra GitHub aangeeft dat het certificaat beschikbaar is;
7. controleer `https://tedware.nl`, `robots.txt`, `sitemap.xml`, privacy en support opnieuw.

## Google Search Console

DNS-verificatie heeft de voorkeur en vereist geen wijziging aan de site. Kies in Search Console een domeinproperty voor `tedware.nl` en plaats later het exacte TXT-record dat Google verstrekt bij STRATO.

Als HTML-metaverificatie nodig blijkt, voeg dan de exacte door Google verstrekte regel in de `<head>` van `index.html` toe, bij voorkeur direct na `<meta name="robots" ...>`, bijvoorbeeld:

```html
<!-- Alleen vervangen door de exacte waarde uit Search Console -->
<meta name="google-site-verification" content="GOOGLE_VERIFICATION_VALUE_HERE">
```

Commit en push die wijziging en laat Search Console daarna verifiëren. Plaats nooit een zelfbedachte verificatiewaarde.

## Publicatiechecklist

- test homepage, privacy en support in beide talen;
- ververs iedere pagina na een taalkeuze om opslag te controleren;
- test toetsenbordnavigatie, mobiel menu en FAQ-items;
- test op een kleine telefoonbreedte, tablet en desktop;
- controleer de browserconsole en het netwerkoverzicht op fouten of ontbrekende bestanden;
- voer `node scripts/validate-site.mjs` uit;
- voer `node scripts/test-i18n.mjs` uit;
- controleer alle placeholders met `rg "_HERE|\[ADD|\[CONFIRM|\[DATUM|\[PRODUCT"`;
- actualiseer de datums in `sitemap.xml` na belangrijke inhoudswijzigingen;
- vergelijk het definitieve privacybeleid met het werkelijke appgedrag en de storeverklaringen.

De website wordt door deze repository niet automatisch gepubliceerd.
