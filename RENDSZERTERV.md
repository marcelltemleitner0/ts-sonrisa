# Rendszerterv

## 1. Áttekintés

A parkolófoglalási rendszer célja, hogy nyilvántartsa a parkolóhelyeket, fogadja a foglalási kéréseket, eldöntse azok elfogadhatóságát, lekérdezhetővé tegye a foglalásokat, és lehetővé tegye a lemondást.

A megoldás egy **Express alkalmazás**, amely REST API-t és egyszerű webes felületet (EJS) biztosít, PostgreSQL adatbázissal.



## 2. Fő komponensek

### 2.1 Adatmodell

Három entitás alkotja az adatbázist:

**User** — a foglalást kérelmező felhasználó
- `id` (PK, autoincrement)
- `name` (string)

**ParkingSpot** — parkolóhely
- `id` (PK, string — pl. „A1”, „B2”)

**Reservation** — foglalás
- `id` (PK, autoincrement)
- `parking_spot_id` (FK → ParkingSpot)
- `user_id` (FK → User)
- `start_time`, `end_time` (timestamp)
- `status` (enum: `APPROVED` | `CANCELLED`)



### 2.2 Controller réteg

| Controller | Felelősség |
|---|---|
| `UserController` | Felhasználó regisztráció, név-validáció |
| `ParkingSpotController` | Összes hely listázása, jelenleg szabad helyek lekérdezése |
| `ReservationController` | Foglalás létrehozása, lekérdezés, lemondás |

### 2.3 Foglalási logika

A foglalás elfogadhatóságát több szinten ellenőrzi a rendszer:

1. **Idővalidáció** — kezdő időpont < záró időpont
2. **Múltbeli foglalás tiltása** — kezdő időpont nem lehet a múltban
3. **Entitás-létezés** — user és parkolóhely létezik-e
4. **Ütközésellenőrzés** — van-e már `APPROVED` státuszú foglalás ugyanarra a helyre az adott időintervallumra


A lemondás **soft delete**: a státusz `CANCELLED`-re vált, az adat megmarad az adatbázisban. A lemondott foglalások nem blokkolják az időintervallumot.

### 2.4 Webes felület

Egyszerű EJS-alapú oldalak Tailwind CSS-sel:

| Oldal | Útvonal | Funkció |
|---|---|---|
| Kezdőlap | `/` | Navigáció regisztrációhoz és foglaláshoz |
| Regisztráció | `/register` | Név megadása, user létrehozása |
| Foglalás | `/reservation` | Hely kiválasztása, időpont megadása, foglalások kezelése |

A felhasználó azonosítása `localStorage`-ban tárolt `user_id` alapján történik — nincs külön auth rendszer.


## 3. Tesztelési stratégia

| Típus | Eszköz | Mit fed le |
|---|---|---|
| Unit teszt | Jest + mock repository | Controller logika izoláltan (validáció, hibakezelés) |
| Integrációs teszt | Jest + Supertest + valós PostgreSQL | Teljes HTTP kérés → válasz → adatbázis ellenőrzés |

Az integrációs tesztek külön `parking_db_test` adatbázist használnak.

## 4. Korlátok

- Nincs járműtípus / korlátozott hely támogatás.
- Nincs authentikáció — a `user_id` a kliens oldalon van tárolva.
