import React, { FormEvent, useState } from "react";

type Props = {
  unlocking: boolean;
  error: string | null;
  onUnlock: (password: string) => Promise<boolean>;
};

export default function AdminIdleLock({ unlocking, error, onUnlock }: Props) {
  const [password, setPassword] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!password || unlocking) return;
    const ok = await onUnlock(password);
    if (ok) setPassword("");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Adminisztrátori munkamenet zárolva"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483000,
        display: "grid",
        placeItems: "center",
        background: "rgba(20, 15, 10, .76)",
        backdropFilter: "blur(12px)",
        padding: 24,
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "min(440px, 100%)",
          background: "#fffdf8",
          border: "1px solid #dfd3bf",
          borderRadius: 20,
          boxShadow: "0 24px 80px rgba(0,0,0,.28)",
          padding: 28,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".12em", color: "#8a6b2f", textTransform: "uppercase" }}>
          Biztonsági zárolás
        </div>
        <h2 style={{ margin: "8px 0 8px", fontSize: 26 }}>Admin munkamenet zárolva</h2>
        <p style={{ margin: "0 0 22px", color: "#665f56", lineHeight: 1.5 }}>
          5 perc inaktivitás után az admin felület lezár. A munkamenet nem lépett ki; a folytatáshoz add meg az adminisztrátori jelszót.
        </p>
        <label style={{ display: "grid", gap: 8, fontWeight: 700 }}>
          Jelszó
          <input
            autoFocus
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={unlocking}
            style={{ border: "1px solid #cfc5b4", borderRadius: 10, padding: "12px 14px", fontSize: 16 }}
          />
        </label>
        {error && <div style={{ marginTop: 12, color: "#a61b1b", fontWeight: 700 }}>{error}</div>}
        <button
          type="submit"
          disabled={!password || unlocking}
          style={{
            width: "100%",
            marginTop: 18,
            border: 0,
            borderRadius: 10,
            padding: "12px 16px",
            fontWeight: 800,
            fontSize: 15,
            cursor: unlocking ? "wait" : "pointer",
            background: "#251d15",
            color: "white",
          }}
        >
          {unlocking ? "Ellenőrzés…" : "Feloldás"}
        </button>
        <p style={{ margin: "14px 0 0", color: "#8a3b32", fontSize: 12, lineHeight: 1.45 }}>
          Hibás jelszó esetén a zárolt munkamenet azonnal kijelentkezik.
        </p>
      </form>
    </div>
  );
}
