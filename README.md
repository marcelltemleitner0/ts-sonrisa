# ts-sonrisa — Parkolófoglalási rendszer

TypeScript + Express + TypeORM + PostgreSQL alapú parkolóhely-foglalási rendszer webes felülettel.

## Gyors indítás

```bash
docker compose up --build  
```

Ez elindítja:
- **PostgreSQL** adatbázist (`parking_db`)
- **Express alkalmazást** a `3000`-es porton
- **Teszteket** 

Az alkalmazás elindulása után automatikusan feltölti a parkolóhelyeket (A1–C2), majd lefuttatja a teszteket.

### Elérhetőségek

| Szolgáltatás | URL |
|---|---|
| Kezdőlap | http://localhost:3000 |
| Regisztráció | http://localhost:3000/register |
| Foglalás | http://localhost:3000/reservation |

## Fejlesztői indítás (Docker nélkül)

Előfeltétel: futó PostgreSQL (`postgres` / `postgres`, adatbázis: `parking_db`).

```bash
npm install
npm run dev          # szerver indítása
npm run db:seed      # parkolóhelyek feltöltése
npm test             # tesztek futtatása
```

## Projektstruktúra

```
src/
├── controllers/     # Üzleti logika (User, ParkingSpot, Reservation)
├── models/          # TypeORM modellek
├── routers/         # Express route-ok
├── views/           # EJS sablonok (web UI)
├── tests/
│   ├── unit/        # Jest unit tesztek
│   └── integration/ # Supertest integrációs tesztek
├── app.ts           # Express konfiguráció
├── main.ts          # Belépési pont
└── database.ts      # TypeORM DataSource
```

## Dokumentáció

| Fájl | Tartalom |
|---|---|
| [RENDSZERTERV.md](./RENDSZERTERV.md) | Rendszerarchitektúra, komponensek |
| [API.md](./API.md) | REST API végpontok leírása |
| [FELHASZNALOI_KEZIKONYV.md](./FELHASZNALOI_KEZIKONYV.md) | Webes felület használata |
| [DONTESI_NAPLO.md](./DONTESI_NAPLO.md) | Döntési napló és reflexió |
| [raw.md](./raw.md) | AI-asszisztens prompt history |

## Technológiai stack

- **Runtime:** Node.js, TypeScript 
- **Backend:** Express 
- **ORM:** TypeORM
- **Adatbázis:** PostgreSQL
- **Tesztelés:** Jest + Supertest
- **UI:** EJS + Tailwind CSS (CDN)
- **Konténerizáció:** Docker
