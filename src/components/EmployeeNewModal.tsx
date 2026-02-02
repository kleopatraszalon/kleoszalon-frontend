import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import withBase from "../utils/apiBase";

/* ---------- Típusok ---------- */
type UUID = string;

interface LocationItem {
  id: UUID | string;
  name: string;
}

interface ServiceRow {
  id: UUID | string;
  name: string;
  description?: string | null;
  price?: number | null;
  duration?: number | null;
  duration_minutes?: number | null;
  is_active?: boolean | null;
}

interface EmployeeNewModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onEmployeeCreated?: (newEmp: any) => void;
}

/* ---------- Segédfüggvények ---------- */
const getToken = () =>
  localStorage.getItem("kleo_token") ||
  localStorage.getItem("token") ||
  "";

/** Mindig Record<string,string>-et ad vissza (üres vagy Authorization-nel). */
const authHeaders = (): Record<string, string> => {
  const t = getToken();
  const h: Record<string, string> = {};
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
};

const safeParse = <T,>(txt: string, fallback: T): T => {
  try { return JSON.parse(txt) as T; } catch { return fallback; }
};

/* =================================================================== */
/*                           ÚJ DOLGOZÓ MODAL                           */
/* =================================================================== */
const EmployeeNewModal: React.FC<EmployeeNewModalProps> = ({
  isOpen,
  onRequestClose,
  onEmployeeCreated,
}) => {
  /* ----- Alap mezők ----- */
  const [fullName, setFullName]   = useState("");
  const [phone, setPhone]         = useState("");
  const [email, setEmail]         = useState("");

  /* ----- Login / jog ----- */
  const [loginName, setLoginName]     = useState("");
  const [plainPassword, setPlainPassword] = useState("");
  const [roleAdmin, setRoleAdmin]         = useState(false);
  const [roleReception, setRoleReception] = useState(false);
  const [roleHair, setRoleHair]           = useState(false);
  const [roleNails, setRoleNails]         = useState(false);
  const [roleCosmetic, setRoleCosmetic]   = useState(false);

  /* ----- Telephely + státusz ----- */
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [locationId, setLocationId] = useState<string>("");
  const [active, setActive] = useState(true);

  /* ----- Szolgáltatások ----- */
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesErr, setServicesErr] = useState("");

  /* hozzárendelés: service_id -> { checked, custom_minutes } */
  const [employeeServices, setEmployeeServices] = useState<
    Record<string, { checked: boolean; custom_minutes: string }>
  >({});

  /* ----- Fotó ----- */
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  /* ----- Állapot üzenetek ----- */
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  /* ---------- Betöltések ---------- */
  useEffect(() => {
    if (!isOpen) return;

    // Telephelyek (opcionális)
    fetch(withBase("locations"), { headers: authHeaders() })
      .then((r) => r.text())
      .then((txt) => safeParse<LocationItem[]>(txt, []))
      .then((arr) => {
        const list = Array.isArray(arr) ? arr : [];
        setLocations(list);
        if (!locationId && list.length) setLocationId(String(list[0].id));
      })
      .catch((e) => console.error("Telephelyek betöltési hiba:", e));

    // Szolgáltatások
    setServicesLoading(true);
    setServicesErr("");
    fetch(withBase("services/available"), { headers: authHeaders() })
      .then(async (res) => {
        const txt = await res.text();
        if (!res.ok) throw safeParse<any>(txt, { error: "Betöltési hiba" });
        const data = safeParse<ServiceRow[]>(txt, []);
        setServices(data);

        // Init map
        const initMap: Record<string, { checked: boolean; custom_minutes: string }> = {};
        (data || []).forEach((s) => {
          const mins = s.duration_minutes ?? s.duration ?? "";
          initMap[String(s.id)] = { checked: false, custom_minutes: mins ? String(mins) : "" };
        });
        setEmployeeServices(initMap);
        setServicesLoading(false);
      })
      .catch((e) => {
        console.error("Szolgáltatások hiba:", e);
        setServicesErr(e?.error || "Nem sikerült a szolgáltatásokat betölteni.");
        setServicesLoading(false);
      });
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Fotó kezelése ---------- */
  const onPickPhoto: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] || null;
    setPhotoFile(f);
    if (f) {
      const rd = new FileReader();
      rd.onload = (ev) => setPhotoPreview(String(ev.target?.result || ""));
      rd.readAsDataURL(f);
    } else {
      setPhotoPreview("");
    }
  };

  /* ---------- Szolgáltatás toggle / perc ---------- */
  const toggleServiceForEmployee = (serviceId: string) => {
    setEmployeeServices((prev) => {
      const cur = prev[serviceId] || { checked: false, custom_minutes: "" };
      return { ...prev, [serviceId]: { ...cur, checked: !cur.checked } };
    });
  };
  const updateServiceMinutes = (serviceId: string, val: string) => {
    setEmployeeServices((prev) => {
      const cur = prev[serviceId] || { checked: false, custom_minutes: "" };
      return { ...prev, [serviceId]: { ...cur, custom_minutes: val } };
    });
  };

  /* ---------- Gombok ---------- */
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let s = "";
    for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
    setPlainPassword(s);
  };

  const handleSaveNewEmployee = async () => {
    setSaving(true); setErrorMsg(""); setSuccessMsg("");

    if (!fullName.trim())        { setErrorMsg("A név kötelező."); setSaving(false); return; }
    if (!phone.trim())           { setErrorMsg("A telefonszám kötelező."); setSaving(false); return; }
    if (!loginName.trim())       { setErrorMsg("A belépési név kötelező."); setSaving(false); return; }
    if (!plainPassword.trim())   { setErrorMsg("Adj meg (vagy generálj) jelszót."); setSaving(false); return; }

    const roles: string[] = [];
    if (roleAdmin) roles.push("admin");
    if (roleReception) roles.push("reception");
    if (roleHair) roles.push("hairdresser");
    if (roleNails) roles.push("nailtech");
    if (roleCosmetic) roles.push("cosmetician");

    try {
      const payload: any = {
        full_name: fullName,
        phone,
        email: email || null,
        login_name: loginName,
        plain_password: plainPassword,
        roles,
        active,
        location_id: locationId || null,
        photo_url: photoUrl || null,
      };

      // Ha fájlt választottak, küldünk egy DataURL-t is (backend: mentsd /assets/employees_photo alá)
      if (photoFile && photoPreview) {
        payload.photo_upload_name = photoFile.name;
        payload.photo_upload_dataurl = photoPreview;
      }

     const res = await fetch(withBase("employees"), {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...authHeaders(),
  },
  body: JSON.stringify(payload),
});

      const txt = await res.text();
      const data = safeParse<any>(txt, {});
      if (!res.ok) {
        setErrorMsg(data?.error || "Nem sikerült létrehozni az új dolgozót.");
      } else {
        setSuccessMsg("Új dolgozó elmentve.");
        onEmployeeCreated?.(data);

        // űrlap ürítése (telephely maradhat)
        setFullName(""); setPhone(""); setEmail("");
        setLoginName(""); setPlainPassword("");
        setRoleAdmin(false); setRoleReception(false); setRoleHair(false); setRoleNails(false); setRoleCosmetic(false);
        setActive(true);
        setPhotoUrl(""); setPhotoFile(null); setPhotoPreview("");

        // (Szolgáltatás-hozzárendelés későbbi PATCH végponttal)
      }
    } catch (e) {
      console.error("Hálózati hiba:", e);
      setErrorMsg("Hálózati hiba történt mentés közben.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  /* ---------- Modal stílus: nincs belső scroll, keret nőhet ---------- */
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Új dolgozó felvétele"
      style={{
        overlay: { backgroundColor: "rgba(18,12,8,0.65)",
          backdropFilter: "blur(4px)", zIndex: 9999 },
        content: {
          inset: "40px auto auto",
          maxWidth: "1200px",
          width: "calc(100% - 80px)",
          margin: "0 auto",
          border: "none",
          background: "transparent",
          padding: 0,
          overflow: "visible", // nincs belső scroll
        },
      }}
    >
      <div className="bg-white/98 text-[#120c08] border border-[#d5c4a4] rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.35)] overflow-visible">
        {/* FELSŐ GOMBSOR – kicsi, NÉGYZETES, egy sorban */}
        <div className="flex items-center justify-end gap-2 p-3 border-b border-[#e3d8c3] bg-gradient-to-r from-[#fffaf5] via-[#f9f0e4] to-[#fffaf5]">
          <button
            onClick={onRequestClose}
            className="px-3 py-2 text-xs font-medium rounded-full border border-[#d5c4a4] text-[#5d5a55] bg-white/80 hover:bg-white"
            title="Bezár"
          >
            Bezár
          </button>
          <button
            onClick={generatePassword}
            className="px-3 py-2 text-xs font-medium rounded-full border border-[#d5c4a4] text-[#5d5a55] bg-white/80 hover:bg-white"
            title="Jelszó generálás"
          >
            Jelszó
          </button>
          <button
            onClick={handleSaveNewEmployee}
            disabled={saving}
            className={`px-3 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-[#b69861] to-[#ec008c] text-white shadow-md hover:shadow-lg hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed bg-emerald-600 text-white hover:bg-emerald-700 ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
            title="Mentés"
          >
            {saving ? "Mentés…" : "Mentés"}
          </button>
        </div>

        {/* FEJLÉC – avatar + cím */}
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-300 grid place-items-center overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} alt="Előnézet" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-xs leading-tight text-center">No<br/>Photo</span>
              )}
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold">Új munkatárs felvétele</div>
              <div className="text-xs text-gray-500">Hozz létre egy fiókot. A többi adat később is kitölthető.</div>
            </div>

            {/* Fotó beállítások */}
            <div className="flex flex-col gap-1 text-xs">
              <label className="text-gray-500">Fotó feltöltése</label>
              <input type="file" accept="image/*" onChange={onPickPhoto} />
              <label className="text-gray-500 mt-2">Fotó URL (opcionális)</label>
              <input
                className="border border-gray-300 rounded-md px-2 py-1"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="/assets/employees_photo/valaki.jpg"
              />
            </div>
          </div>
        </div>

        {/* TARTALOM – kártyák, nincs belső overflow */}
        <div className="px-4 pb-5">
          {/* Kapcsolat + Munkavégzés */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-[#faf7f0] border border-[#e3d8c3] rounded-lg p-3 space-y-2">
              <div className="text-sm font-semibold">Kapcsolat</div>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">Teljes név *</span>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="pl. Szabó Anna"
                />
              </label>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">Telefonszám *</span>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+36 30 …"
                />
              </label>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">E-mail</span>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="valaki@szalon.hu"
                />
              </label>
            </section>

            <section className="bg-[#faf7f0] border border-[#e3d8c3] rounded-lg p-3 space-y-2">
              <div className="text-sm font-semibold">Munkavégzés helye</div>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">Telephely (opcionális)</span>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                >
                  <option value="">— Nincs telephely hozzárendelve —</option>
                  {locations.map((loc) => (
                    <option key={String(loc.id)} value={String(loc.id)}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Aktív dolgozó (foglalható)
              </label>
            </section>
          </div>

          {/* Belépés & jogosultság */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <section className="bg-[#faf7f0] border border-[#e3d8c3] rounded-lg p-3 space-y-2">
              <div className="text-sm font-semibold">Belépés</div>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">Felhasználónév (login_name) *</span>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="pl. szabo.anna"
                />
              </label>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">Jelszó *</span>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={plainPassword}
                    onChange={(e) => setPlainPassword(e.target.value)}
                    placeholder="●●●●●●●●●●"
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200"
                  >
                    Generál
                  </button>
                </div>
                <span className="text-[11px] text-gray-500">Mentéskor titkosítva kerül tárolásra.</span>
              </label>
            </section>

            <section className="bg-[#faf7f0] border border-[#e3d8c3] rounded-lg p-3 space-y-2">
              <div className="text-sm font-semibold">Jogosultságok / szerepkörök</div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={roleAdmin} onChange={(e) => setRoleAdmin(e.target.checked)} />
                  Admin
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={roleReception} onChange={(e) => setRoleReception(e.target.checked)} />
                  Recepciós
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={roleHair} onChange={(e) => setRoleHair(e.target.checked)} />
                  Fodrász
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={roleNails} onChange={(e) => setRoleNails(e.target.checked)} />
                  Műkörmös
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={roleCosmetic} onChange={(e) => setRoleCosmetic(e.target.checked)} />
                  Kozmetikus
                </label>
              </div>
            </section>
          </div>

          {/* Szolgáltatások */}
          <section className="bg-[#faf7f0] border border-[#e3d8c3] rounded-lg p-3 space-y-2 mt-4">
            <div className="text-sm font-semibold">Szolgáltatások</div>
            <p className="text-[11px] text-gray-500">
              Mit végezhet ez a dolgozó, és hány perc alatt? (A hozzárendelés később külön backend végponttal rögzíthető.)
            </p>

            {servicesLoading && <div className="text-xs text-gray-500">Betöltés…</div>}
            {servicesErr && <div className="text-xs text-red-600">{servicesErr}</div>}

            {!servicesLoading && !servicesErr && services.length === 0 && (
              <div className="text-xs text-gray-500">Nincs elérhető szolgáltatás.</div>
            )}

            {!servicesLoading && !servicesErr && services.length > 0 && (
              <div className="divide-y divide-gray-200">
                {services.map((srv) => {
                  const id = String(srv.id);
                  const state = employeeServices[id] || { checked: false, custom_minutes: "" };
                  const baseMin = srv.duration_minutes ?? srv.duration ?? null;
                  const priceDisplay = srv.price != null ? `${srv.price} Ft` : "—";

                  return (
                    <div key={id} className="py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <label className="flex items-start gap-2 flex-1 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          className="mt-[2px]"
                          checked={state.checked}
                          onChange={() => toggleServiceForEmployee(id)}
                        />
                        <div>
                          <div className="font-medium">{srv.name}</div>
                          <div className="text-[11px] text-gray-500">
                            Ár: {priceDisplay} · Alap idő: {baseMin ?? "—"} perc
                          </div>
                          {srv.description && (
                            <div className="text-[11px] text-gray-500">{srv.description}</div>
                          )}
                        </div>
                      </label>

                      {state.checked && (
                        <div className="text-[12px] flex items-center gap-2">
                          <span>Idő (perc):</span>
                          <input
                            type="number"
                            min={1}
                            className="w-20 border border-gray-300 rounded-md px-2 py-1"
                            value={state.custom_minutes}
                            onChange={(e) => updateServiceMinutes(id, e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Üzenetek */}
          {errorMsg && <div className="mt-3 text-xs text-red-600">{errorMsg}</div>}
          {successMsg && <div className="mt-3 text-xs text-emerald-600">{successMsg}</div>}
        </div>
      </div>
    </Modal>
  );
};

export default EmployeeNewModal;
