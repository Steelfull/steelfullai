# Deployment-Anleitung — steelfullai auf Hostinger VPS (mit CI/CD)

Diese Anleitung bringt deine Landing Page auf einen **Hostinger VPS** und richtet eine
**CI/CD-Pipeline mit GitHub** ein: Jedes Mal, wenn du Code auf den `main`-Branch pushst,
baut GitHub die App, prüft sie und deployt sie automatisch auf deinen Server.

> **Warum VPS und nicht Shared Hosting?**
> Die Seite ist eine Next.js-App mit Server-Middleware (Sprachrouting DE/EN/PT).
> Sie braucht einen echten Node.js-Server — auf einfachem Webhosting läuft das nicht.

---

## So funktioniert es (Architektur)

```
Du pushst Code  ──►  GitHub Actions  ──►  1) Build & Prüfung (npm run build)
                                          2) per SSH auf den VPS
                                             └─ git pull + docker compose up --build
                                                ├─ app    (Next.js, Port 3000, intern)
                                                └─ caddy  (Port 80/443, HTTPS automatisch)
```

- **Docker** kapselt die App reproduzierbar — kein manuelles Node-Gefrickel auf dem Server.
- **Caddy** holt und erneuert das **HTTPS-Zertifikat automatisch** (Let's Encrypt), sobald
  deine Domain auf den Server zeigt. Kein Certbot nötig.

Diese Dateien wurden dafür bereits ins Projekt gelegt:

| Datei | Zweck |
|---|---|
| `Dockerfile` | Baut ein schlankes Production-Image der App |
| `docker-compose.yml` | Startet App + Caddy zusammen |
| `Caddyfile` | Reverse-Proxy + automatisches HTTPS |
| `.dockerignore` | Hält das Image klein |
| `.github/workflows/deploy.yml` | Die CI/CD-Pipeline |
| `next.config.mjs` | Auf `output: 'standalone'` umgestellt (für Docker) |

---

## Voraussetzungen

- Ein **Hostinger VPS** (empfohlen: KVM 2 oder größer, **≥ 2 GB RAM** — der Next.js-Build
  braucht Speicher). Beim Bestellen als Betriebssystem **Ubuntu 24.04** wählen, oder gleich
  die **Docker-Vorlage** (dann ist Schritt B2 schon erledigt).
- Ein **GitHub-Account**.
- Deine **Domain** (DNS muss bei Hostinger oder deinem Registrar anpassbar sein).
- Auf deinem Windows-PC: **Git** installiert (https://git-scm.com/download/win).

Platzhalter in dieser Anleitung — ersetze sie überall durch deine Werte:
- `DEINE_DOMAIN.de` → deine echte Domain
- `VPS_IP` → die IP-Adresse deines VPS (steht im Hostinger hPanel)

---

## Teil A — GitHub-Repo erstellen und Code hochladen

1. Auf https://github.com/new ein **neues, privates Repository** anlegen, z. B. `steelfullai`.
   **Keine** README/`.gitignore`/Lizenz hinzufügen (das Projekt hat schon eine `.gitignore`).

2. Auf deinem PC ein Terminal im Projektordner öffnen
   (`C:\Users\tim-l\OneDrive\Desktop\steelfullai`) und ausführen:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Landing Page + Deployment-Setup"
   git branch -M main
   git remote add origin https://github.com/DEIN_GITHUB_NAME/steelfullai.git
   git push -u origin main
   ```

   > Beim ersten Push fragt GitHub nach Login — am einfachsten über den Browser-Login,
   > der sich automatisch öffnet.

Beim Push startet die Pipeline schon — der **Build-Check** läuft, das **Deploy** schlägt
aber noch fehl, weil VPS und Secrets noch fehlen. Das holen wir jetzt nach.

---

## Teil B — VPS vorbereiten

### B1. Per SSH auf den VPS einloggen
Im Hostinger **hPanel → VPS → Übersicht** findest du IP und Root-Passwort.
Auf deinem PC (PowerShell):

```bash
ssh root@VPS_IP
```

### B2. Docker installieren (überspringen, wenn du die Docker-Vorlage gewählt hast)
```bash
curl -fsSL https://get.docker.com | sh
docker --version
```

### B3. Deploy-Verzeichnis anlegen und Repo klonen
```bash
mkdir -p /opt/steelfullai
git clone https://github.com/DEIN_GITHUB_NAME/steelfullai.git /opt/steelfullai
cd /opt/steelfullai
```
> Bei einem privaten Repo fragt `git clone` nach Login. Am robustesten: ein
> **Deploy Token / Personal Access Token** auf GitHub erstellen und als Passwort eingeben
> (GitHub → Settings → Developer settings → Personal access tokens → "Fine-grained",
> nur Lesezugriff auf dieses eine Repo).

### B4. Die Domain für Caddy hinterlegen
Auf dem VPS eine `.env`-Datei im Projektordner erstellen (sie wird **nicht** in Git eingecheckt):
```bash
echo "DOMAIN=DEINE_DOMAIN.de" > /opt/steelfullai/.env
```

---

## Teil C — SSH-Schlüssel für die Pipeline einrichten

Damit GitHub auf den VPS deployen darf, braucht es einen eigenen SSH-Schlüssel.

### C1. Schlüsselpaar auf dem VPS erzeugen
```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy        # ← den GESAMTEN privaten Schlüssel kopieren
```
Kopiere die komplette Ausgabe des letzten Befehls (von
`-----BEGIN OPENSSH PRIVATE KEY-----` bis `-----END OPENSSH PRIVATE KEY-----`).

### C2. GitHub-Secrets anlegen
Im GitHub-Repo: **Settings → Secrets and variables → Actions → New repository secret**.
Lege diese vier an:

| Name | Wert |
|---|---|
| `VPS_HOST` | `VPS_IP` (die IP deines Servers) |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | der komplette **private** Schlüssel aus C1 |
| `VPS_PORT` | `22` |

---

## Teil D — Domain auf den VPS zeigen lassen

Im Hostinger **hPanel → Domains → DNS-Zone** (oder beim Registrar deiner Domain)
zwei Einträge setzen/ändern:

| Typ | Name | Wert |
|---|---|---|
| `A` | `@` | `VPS_IP` |
| `A` | `www` | `VPS_IP` |

> DNS-Änderungen brauchen ein paar Minuten bis Stunden. Erst wenn die Domain auf die
> VPS-IP zeigt, kann Caddy das HTTPS-Zertifikat ausstellen.

---

## Teil E — Erstes Deployment auslösen

Du hast zwei Möglichkeiten:

**a) Manuell über GitHub:** Repo → Tab **Actions** → Workflow "Deploy to Hostinger VPS"
→ **Run workflow**.

**b) Per Push:** irgendeine Kleinigkeit ändern und pushen:
```bash
git commit --allow-empty -m "Trigger deploy"
git push
```

Schau im Tab **Actions** zu, wie die Pipeline läuft. Beim ersten Mal dauert der Docker-Build
ein paar Minuten. Danach ist deine Seite live unter `https://DEINE_DOMAIN.de`.

Alternativ direkt auf dem VPS einmal starten (zum Testen, ohne Pipeline):
```bash
cd /opt/steelfullai && docker compose up -d --build
```

---

## Der Alltag danach (so einfach ist es)

Ab jetzt gilt: **Code ändern → committen → pushen → fertig.**
```bash
git add .
git commit -m "Text auf der Startseite angepasst"
git push
```
GitHub baut, prüft und deployt automatisch. Schlägt der Build fehl, wird **nicht** deployed —
die Live-Seite bleibt unangetastet.

---

## Inhalte & Kontaktdaten anpassen

- **Kontakt-Links** (Calendly, WhatsApp, E-Mail, Social): in `src/config/contact.ts`.
  Aktuell stehen dort Standardwerte — vor allem die **WhatsApp-Nummer** (`5521999999999`)
  ist ein Platzhalter und sollte auf deine echte Nummer geändert werden.
- **Domain für SEO/Sitemap**: Falls deine Domain **nicht** `steelfullai.com` ist, den Wert
  `SITE_URL` in diesen drei Dateien anpassen:
  `src/app/[locale]/layout.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`,
  sowie `src/components/StructuredData.tsx`.
- **Texte** (DE/EN/PT): in `src/messages/de.json`, `en.json`, `pt.json`.

Nach jeder Änderung einfach committen und pushen — die Pipeline übernimmt den Rest.

> **Hinweis:** Der Abschnitt mit dem Foto von dir ("Über mich") wurde wie gewünscht entfernt;
> der Text dieses Abschnitts bleibt erhalten und wird jetzt über die volle Breite angezeigt.

---

## Problembehebung

- **Seite nicht erreichbar / kein HTTPS:** Zeigt die Domain schon auf die VPS-IP?
  Prüfen mit `ping DEINE_DOMAIN.de`. Caddy-Logs ansehen:
  `cd /opt/steelfullai && docker compose logs caddy`.
- **Deploy-Job scheitert bei "ssh":** Secrets `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY` prüfen;
  der private Schlüssel muss vollständig (inkl. BEGIN/END-Zeilen) hinterlegt sein.
- **Build bricht wegen zu wenig RAM ab:** größeren VPS-Plan wählen oder temporär Swap anlegen.
- **App-Logs ansehen:** `cd /opt/steelfullai && docker compose logs app`.
- **Status der Container:** `docker compose ps`.
- **Manuell neu starten:** `cd /opt/steelfullai && docker compose up -d --build`.
