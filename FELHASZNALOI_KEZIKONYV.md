# Felhasználói kézikönyv

## Bevezetés

A parkolófoglalási rendszer webes felületen keresztül használható. A rendszer lehetővé teszi parkolóhelyek foglalását adott időintervallumra, valamint meglévő foglalások megtekintését és lemondását.



## 1. lépés — Regisztráció

1. A kezdőlapon kattints a **„Create an Account”** gombra, vagy menj közvetlenül ide: http://localhost:3000/register
2. Add meg a neved (minimum 2 karakter)
3. Kattints a **„Register”** gombra
4. Sikeres regisztráció után automatikusan átirányít a foglalási oldalra

> A rendszer elmenti a felhasználói azonosítódat a böngésző `localStorage`-ába. Ugyanabban a böngészőben később nem kell újra regisztrálni.

---

## 2. lépés — Foglalás létrehozása

A foglalási oldalon (`/reservation`) két panel látható:

### Foglalás kérése (bal oldali panel)

1. **Parking Spot** — válassz egy szabad helyet a legördülő listából
   - A lista csak azokat a helyeket mutatja, amelyek **jelenleg** szabadok
   - Ha nincs szabad hely: „No spots available" jelenik meg
2. **Start Window** — add meg a foglalás kezdetét (dátum + idő)
3. **End Window** — add meg a foglalás végét (dátum + idő)
4. Kattints a **„Reserve Slot"** gombra

**Fontos szabályok:**
- A kezdő időpontnak korábbinak kell lennie, mint a záró
- Múltbeli időpontra nem lehet foglalni
- Ha a hely már foglalt az adott időszakra, hibaüzenet jelenik meg

### Saját foglalások (jobb oldali panel)

A **„My Active Schedule"** szekcióban megjelennek a foglalásaid:

| Mező | Jelentés |
|---|---|
| `#ID` | Foglalás azonosító |
| Státusz badge | `APPROVED` (aktív) vagy `CANCELLED` (lemondott) |
| Location | Melyik parkolóhely |
| From / To | Foglalás kezdete és vége |

---

## 3. lépés — Foglalás lemondása

1. A foglalás kártyáján kattints a **„Cancel Booking"** gombra
2. Erősítsd meg a lemondást a felugró ablakban
3. A foglalás státusza `CANCELLED`-re vált
4. A hely felszabadul, és újra megjelenik a szabad helyek listájában

**Lemondás nem lehetséges, ha:**
- A foglalás már lejárt (a záró időpont elmúlt)
- A foglalás már korábban le lett mondva

---

## Elérhető parkolóhelyek

A rendszer induláskor 8 parkolóhellyel van feltöltve:

| Sor | Helyek |
|---|---|
| A | A1, A2, A3 |
| B | B1, B2, B3 |
| C | C1, C2 |

---

## API használat

A webes felületen kívül a rendszer REST API-n keresztül is használható. Részletes leírás: [API.md](./API.md)
