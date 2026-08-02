# API leírás

Alap URL: `http://localhost:3000`

Minden API válasz JSON formátumú. A kérések törzse (ahol releváns) `Content-Type: application/json` headert igényel.

---

## User

### Regisztráció

```
POST /api/v1/CreateUser
```

**Request body:**

```json
{
  "name": "Kovács János"
}
```

**Validáció:**
- `name` kötelező, nem lehet üres
- `name` string típusú kell legyen
- `name` minimum 2 karakter (whitespace levágás után)

**Sikeres válasz:** `201 Created`

```json
{
  "id": 1,
  "name": "Kovács János"
}
```

**Hibák:**

| Státusz | Üzenet | Ok |
|---|---|---|
| 400 | `"Name is required"` | Hiányzó név |
| 400 | `"Name must be a string"` | Nem string típus |
| 400 | `"Name must be at least 2 characters long"` | Túl rövid név |
| 500 | `"Failed to create user"` | Szerver/DB hiba |

---

## Parkolóhelyek

### Összes parkolóhely listázása

```
GET /api/v1/GetAllParkingSpot
```

**Sikeres válasz:** `200 OK`

```json
[
  { "id": "A1" },
  { "id": "A2" },
  { "id": "A3" }
]
```

---

### Jelenleg szabad parkolóhelyek

```
GET /api/v1/GetFreeParkingSpot
```

Azokat a helyeket adja vissza, amelyeken **ebben a pillanatban** nincs aktív (`APPROVED`) foglalás.

**Sikeres válasz:** `200 OK`

```json
{
  "message": "Free parking spots",
  "parkingSpots": [
    { "id": "A2" },
    { "id": "B1" }
  ]
}
```

---

## Foglalások

### Összes foglalás lekérdezése

```
GET /api/v1/getAllReservation
```

**Sikeres válasz:** `200 OK`

```json
[
  {
    "id": 1,
    "parking_spot_id": "A1",
    "user_id": 1,
    "start_time": "2026-08-02T10:00:00.000Z",
    "end_time": "2026-08-02T12:00:00.000Z",
    "status": "APPROVED",
    "user": {
      "id": 1,
      "name": "Kovács János"
    },
    "parkingSpot": {
      "id": "A1"
    }
  }
]
```

---

### Foglalás létrehozása

```
POST /api/v1/CreateReservation
```

**Request body:**

```json
{
  "user_id": 1,
  "parking_spot_id": "A1",
  "start_time": "2026-08-02T10:00:00",
  "end_time": "2026-08-02T12:00:00"
}
```

**Validáció és üzleti szabályok:**
- Kezdő időpont < záró időpont
- Kezdő időpont nem lehet a múltban
- User léteznie kell
- Parkolóhely léteznie kell
- Nincs ütköző `APPROVED` foglalás ugyanarra a helyre

**Sikeres válasz:** `201 Created`

```json
{
  "message": "Reservation created successfully",
  "reservation": {
    "id": 1,
    "parking_spot_id": "A1",
    "user_id": 1,
    "start_time": "2026-08-02T10:00:00.000Z",
    "end_time": "2026-08-02T12:00:00.000Z",
    "status": "APPROVED"
  }
}
```

**Hibák:**

| Státusz | Üzenet | Ok |
|---|---|---|
| 400 | `"Start time must be before end time"` | Érvénytelen időintervallum |
| 400 | `"Cannot create a reservation in the past"` | Múltbeli kezdő időpont |
| 404 | `"User does not exist"` | Ismeretlen user_id |
| 404 | `"Parking spot does not exist"` | Ismeretlen parking_spot_id |
| 409 | `"Parking spot is already reserved for this time."` | Időütközés |
| 500 | `"Failed to create reservation"` | Szerver/DB hiba |

---

### Felhasználó foglalásainak lekérdezése

```
GET /api/v1/myReservation/:userId
```

**Példa:** `GET /api/v1/myReservation/1`

**Sikeres válasz:** `200 OK`

```json
[
  {
    "id": 1,
    "parking_spot_id": "A1",
    "user_id": 1,
    "start_time": "2026-08-02T10:00:00.000Z",
    "end_time": "2026-08-02T12:00:00.000Z",
    "status": "APPROVED",
    "parkingSpot": {
      "id": "A1"
    }
  }
]
```

A foglalások `start_time` szerint csökkenő sorrendben jelennek meg. Ha a usernek nincs foglalása, üres tömböt ad vissza.

---

### Foglalás lemondása

```
PATCH /api/v1/CancelReservation/:reservationId
```

**Példa:** `PATCH /api/v1/CancelReservation/1`

Nincs request body. A foglalás státusza `CANCELLED`-re vált (soft delete).

**Sikeres válasz:** `200 OK`

```json
{
  "message": "Reservation cancelled successfully.",
  "reservation": {
    "id": 1,
    "status": "CANCELLED",
    "...": "..."
  }
}
```

**Hibák:**

| Státusz | Üzenet | Ok |
|---|---|---|
| 404 | `"Reservation not found"` | Ismeretlen reservationId |
| 400 | `"You cannot cancel a reservation that has already ended."` | Lejárt foglalás |
| 400 | `"Reservation has already been cancelled."` | Már lemondott foglalás |
| 500 | `"Failed to cancel reservation"` | Szerver/DB hiba |

---

## Webes oldalak

| Metódus | Útvonal | Leírás |
|---|---|---|
| GET | `/` | Kezdőlap |
| GET | `/register` | Regisztrációs oldal |
| GET | `/reservation` | Foglalási oldal |

---
