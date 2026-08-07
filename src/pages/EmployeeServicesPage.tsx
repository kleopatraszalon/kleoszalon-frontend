import React from "react";
import { UsersRound, Clock3, Link2 } from "lucide-react";

export default function EmployeeServicesPage() {
  return (
    <div style={{ padding: 18 }}>
      <h1 style={{ margin: 0, fontSize: 24 }}>Szakember–szolgáltatás beállítások</h1>
      <p style={{ margin: "6px 0 18px", color: "#6f6b63" }}>
        Itt kezeljük, hogy melyik szakember mely szolgáltatást végezheti, és az adott szakembernél mennyi a foglalási idő.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 }}>
        <div style={{ background: "#fff", border: "1px solid #e8e5df", borderRadius: 14, padding: 16 }}>
          <UsersRound size={20}/><h3>Szakember-hozzárendelés</h3><p style={{ color: "#6f6b63" }}>A szolgáltatás csak a hozzárendelt munkatársaknál jelenjen meg foglalhatóként.</p>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e8e5df", borderRadius: 14, padding: 16 }}>
          <Clock3 size={20}/><h3>Egyedi időtartam</h3><p style={{ color: "#6f6b63" }}>Ugyanaz a szolgáltatás szakemberenként eltérő időtartamot kaphat.</p>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e8e5df", borderRadius: 14, padding: 16 }}>
          <Link2 size={20}/><h3>Altegio kapcsolat</h3><p style={{ color: "#6f6b63" }}>Az importált Altegio szakember-ID-k megmaradnak, így a munkatársimport után automatikusan összekapcsolhatók.</p>
        </div>
      </div>
    </div>
  );
}
