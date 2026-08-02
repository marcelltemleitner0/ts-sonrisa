# Döntési napló + reflexió

## Döntési táblázat

| # | Döntési pont | Amit választottam | Miért | Elvetett alternatíva |
|---|---|---|---|---|
| 1 | Adatbázis | TypeORM | Az ORM gyorsítja a fejlesztést az entitás-alapú modellezéssel, automatikus mappinggel és típusos lekérdezésekkel. Illetve volt már tapasztalatom is vele.| Raw SQL: nagyobb kontroll és optimalizálási lehetőség komplex queryknél, de több manuális kódot, mappinget és karbantartást |
| 2 | Felhasználó-azonosítás | localStorage `user_id` + egyszerű regisztráció (csak név) |  nincs auth komplexitás (JWT, session, jelszó). A feladat nem kért authentikációt, csak a kérelmező azonosítását. | JWT token alapú auth, session cookie, OAuth
| 3 | UI megközelítés | EJS sablonok + Tailwind CSS (CDN) | Szerver-oldali renderelés, nincs külön frontend build pipeline. A Tailwind gyors, konzisztens UI-t ad minimális erőfeszítéssel. | React SPA (külön build, state management), tiszta HTML (nincs styling) |


---

## Rövid reflexió

A fejlesztés során a legnagyobb technikai kihívás az **időzóna-kezelés** és az **ütközésellenőrzés pontos SQL-leírása** volt — a datetime-local input és a PostgreSQL timestamp közötti konverzió hibát okozott, amit külön commit-tal javítottam. A TypeORM QueryBuilder jól működött az overlap-logikához, de a kezdeti FreeParkingSpot lekérdezés hibás JOIN feltétellel indult, amit szintén külön commit-ban korrigáltam.

**AI-asszisztens használata:** ChatGPT-t és Gemini-t használtam a fejlesztés során. Konkrétan: (1) TypeORM entitás-sémák generálása a feladat specifikációja alapján, (2) Jest unit és Supertest integrációs tesztek készítése a controller kód alapján — a tesztek struktúráját az AI adta, de a mock-okat és edge case-eket én finomítottam, (3) EJS view-k Tailwind CSS-sel való refaktorálása. A nyers prompt history a `raw.md` fájlban található.

A legnagyobb hiányosság, amit azonosítottam: rendszerben nincs valódi felhasználó-hitelesítés és jogosultságkezelés. A jelenlegi megoldás csak egyszerű felhasználó-azonosítást használ, ami elegendő volt a feladat követelményeihez, de production környezetben nem lenne megfelelő. Egy továbbfejlesztett verzióban JWT vagy session alapú autentikációt, valamint jogosultsági szinteket vezetnék be a felhasználók és adminisztrátorok kezelésére.

További fejlesztési lehetőség az extra járműtípus-korlátozások kezelése, például speciális parkolóhelyek (mozgáskorlátozott, elektromos járművek számára fenntartott helyek) validációja foglaláskor.

Összességében a rendszer a feladat kötelező követelményeinek nagy részét lefedi: parkolóhely-nyilvántartás, foglalás, elfogadhatóság-ellenőrzés, lekérdezés és lemondás működik, tesztekkel le van fedve, és egy parancs indítja.
