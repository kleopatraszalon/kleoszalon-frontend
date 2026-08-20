import React, { useEffect, useState } from "react";

const COPYRIGHT_TEXT = "© 2026 Kleopátra2003 Kft. · Minden jog fenntartva.";

export default function CopyrightNotice() {
  const [open, setOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(() => window.location.pathname === "/login");
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    const update = () => {
      setIsLogin(window.location.pathname === "/login");
      const shell = document.querySelector(".app-layout-shell");
      if (!shell) {
        setSidebarVisible(false);
        return;
      }
      const mobile = window.matchMedia("(max-width: 900px)").matches;
      const classes = shell.classList;
      setSidebarVisible(
        mobile
          ? classes.contains("is-mobile-sidebar-open")
          : !classes.contains("is-sidebar-collapsed"),
      );
    };

    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    window.addEventListener("popstate", update);
    window.addEventListener("resize", update);
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const showFooter = isLogin || sidebarVisible;
  if (!showFooter) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Szerzői jogi és tulajdonosi tájékoztató megnyitása"
        style={{
          position: "fixed",
          zIndex: 1205,
          left: isLogin ? "50%" : 12,
          bottom: isLogin ? 12 : 8,
          transform: isLogin ? "translateX(-50%)" : undefined,
          width: isLogin ? "auto" : "calc(var(--sidebar-width, 270px) - 24px)",
          maxWidth: isLogin ? "calc(100vw - 24px)" : undefined,
          padding: 0,
          border: 0,
          borderRadius: 0,
          background: "transparent",
          boxShadow: "none",
          color: isLogin ? "#6f675b" : "#b9aa8d",
          fontSize: 10,
          lineHeight: 1.35,
          textAlign: "center",
          cursor: "pointer",
          appearance: "none",
        }}
      >
        <span>{COPYRIGHT_TEXT}</span>
        <span
          style={{
            display: "block",
            marginTop: 2,
            textDecoration: "underline",
            textUnderlineOffset: 2,
            opacity: 0.9,
          }}
        >
          Szerzői jogi és tulajdonosi tájékoztató
        </span>
      </button>

      {open && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 5000,
            display: "grid",
            placeItems: "center",
            padding: 18,
            background: "rgba(10,12,18,.62)",
            backdropFilter: "blur(5px)",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="copyright-title"
            style={{
              width: "min(820px, 96vw)",
              maxHeight: "88vh",
              overflow: "auto",
              borderRadius: 18,
              background: "#fff",
              boxShadow: "0 26px 80px rgba(0,0,0,.3)",
              color: "#2f3440",
            }}
          >
            <header style={{ position: "sticky", top: 0, zIndex: 1, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", padding: "18px 22px", borderBottom: "1px solid #eceef2", background: "rgba(255,255,255,.97)" }}>
              <div>
                <div style={{ fontSize: 11, color: "#a27d3f", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Kleopátra VIR</div>
                <h2 id="copyright-title" style={{ margin: "4px 0 0", fontSize: 20 }}>Szerzői jogi és tulajdonosi tájékoztató</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Bezárás" style={{ border: "1px solid #e4e7ed", borderRadius: 10, background: "#fff", padding: "8px 11px", cursor: "pointer", fontWeight: 700 }}>Bezárás</button>
            </header>

            <div style={{ padding: "22px", fontSize: 14, lineHeight: 1.65 }}>
              <p><strong>Hatályos: 2026. augusztus 20.</strong></p>
              <p><strong>© 2026 Kleopátra2003 Kft. · Minden jog fenntartva.</strong></p>

              <h3>1. Tulajdonos és jogosult</h3>
              <p>A Kleopátra Vállalatirányítási Rendszer (VIR) teljes fejlesztése a Kleopátra2003 Kft. által végzett fejlesztési tevékenység eredménye. A VIR mint egyedi szoftvertermék, továbbá a Kleopátra2003 Kft. által létrehozott forráskód, tárgykód, felhasználói felület, grafikai megoldások, adatmodell, rendszerstruktúra, specifikációk, dokumentációk, üzleti logika, munkafolyamatok, elnevezések, saját adatstruktúrák és egyéb fejlesztési eredmények a Kleopátra2003 Kft. tulajdonát képezik, illetve a társaság gyakorolja az azokhoz kapcsolódó vagyoni jogokat.</p>

              <h3>2. Szerzői jogi védelem</h3>
              <p>A VIR és annak szerzői jogi védelemre alkalmas elemei a szerzői jogról szóló 1999. évi LXXVI. törvény, valamint az alkalmazandó európai uniós és nemzetközi szabályok alapján védelem alatt állnak.</p>

              <h3>3. Felhasználási korlátozások</h3>
              <p>A VIR használata kizárólag az arra jogosult felhasználók részére, a számukra biztosított hozzáférési és munkaköri jogosultságok keretében engedélyezett. A rendszerhez való hozzáférés nem jelent tulajdonjog-, szerzői jog-, forráskód- vagy egyéb szellemi tulajdonjog-átruházást.</p>
              <p>A jogszabály által kifejezetten megengedett esetek kivételével a Kleopátra2003 Kft. előzetes írásbeli engedélye nélkül tilos különösen a rendszer vagy annak részeinek másolása, többszörözése, terjesztése, módosítása, átdolgozása, visszafejtése, jogosulatlan hozzáférhetővé tétele, harmadik fél részére történő átadása, továbbértékesítése vagy más rendszerbe történő jogosulatlan beépítése.</p>

              <h3>4. Üzleti és bizalmas információk</h3>
              <p>A VIR-ben kezelt nem nyilvános üzleti, pénzügyi, személyügyi, ügyfél-, munkavállalói, műszaki és egyéb vállalati információk kizárólag megfelelő jogosultság alapján használhatók fel. Jogosulatlan megszerzésük, továbbításuk vagy nyilvánosságra hozataluk tilos.</p>

              <h3>5. Harmadik féltől származó komponensek</h3>
              <p>A VIR technikai működése tartalmazhat harmadik személyek által biztosított nyílt forráskódú vagy más licencfeltételek alatt használható könyvtárakat, keretrendszereket és komponenseket. Ezek önálló jogai az eredeti jogosultakat illetik meg, és rájuk a saját licencfeltételeik vonatkoznak. Ez nem érinti a Kleopátra2003 Kft. saját fejlesztési eredményeinek tulajdonjogát és szerzői vagyoni jogait.</p>

              <h3>6. Jogérvényesítés</h3>
              <p>A Kleopátra2003 Kft. fenntartja a jogot arra, hogy a VIR vagy a kapcsolódó fejlesztési eredmények jogosulatlan felhasználása, másolása, hozzáférhetővé tétele vagy egyéb jogsértő használata esetén a rendelkezésére álló polgári jogi, szerzői jogi, munkajogi és egyéb jogi eszközöket igénybe vegye.</p>

              <h3>7. Irányadó jog</h3>
              <p>A jelen tájékoztatóra és a VIR használatára Magyarország joga irányadó, különösen a szerzői jogról szóló 1999. évi LXXVI. törvény rendelkezései.</p>

              <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid #eceef2", fontWeight: 800, textAlign: "center" }}>
                © 2026 Kleopátra2003 Kft. · Minden jog fenntartva.
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
