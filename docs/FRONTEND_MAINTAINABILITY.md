# VIR frontend karbantarthatósági szabályok

## Cél
A frontend fejlesztése maradjon kiszámítható akkor is, amikor új modulok, szerepkörök és alias route-ok kerülnek a VIR-be.

## Routing
- Egy statikus URL útvonalnak pontosan egy React Router definíciója lehet.
- A route-hozzáférési logika kizárólag a `src/routing/routeAccess.tsx` modulban élhet.
- Az `App.tsx` nem definiálhat saját `RequireAuth` vagy `RequireRoles` implementációt.
- Új szerepkör-csoportot központilag kell létrehozni a `routeAccess.tsx` fájlban.
- Kritikus menüpont új route-ja csak a `scripts/check-menu-routes.js` audit frissítésével merge-elhető.

## Jogosultság
A frontend guard kizárólag UX-határ. A tényleges biztonsági határ minden esetben a backend RBAC/tenant ellenőrzés. A frontend nem tekinthet localStorage vagy sessionStorage szerepkört hiteles jogosultsági bizonyítéknak.

## API
A VIR frontend HTTP-hívásai a kanonikus `src/api/api.ts` kliensen keresztül menjenek, hogy az origin-kezelés, cookie/Bearer session, retry és idempotency egységes maradjon.

## CI kapu
A frontend PR csak akkor tekinthető merge-képesnek, ha átmegy legalább ezeken:
1. dependency security audit;
2. menu/routing architecture audit;
3. TypeScript typecheck;
4. strict lint;
5. frontend tesztek;
6. production build.

A routing audit a duplikált statikus route-okat automatikusan hibának minősíti.

## Következő refaktorálási cél
Az `App.tsx` route-listáját funkcionális modulokra kell bontani (`booking`, `hr`, `finance`, `inventory`, `admin`, `public`). Ezt fokozatosan, regressziós tesztekkel kell végrehajtani; egyszerre egy route-csoport költözzön külön modulba.
