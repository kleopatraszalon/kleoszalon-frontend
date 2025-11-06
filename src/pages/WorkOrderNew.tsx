import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";

type Employee = {
  id: string | number;
  name: string; // egységesített felhasználói név
  role: string;
};

type ServiceItem = {
  id: string | number;
  name: string;
  price: number;
  duration_minutes: number;
  category?: string;
};

type ServiceCategory = {
  category: string;
  services: ServiceItem[];
};

type ClientInfo = {
  id?: string | number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
};

type VisitStatus = "várakozik" | "megérkezett" | "nem_jött_el" | "megerősítve";

type WorkOrderDraft = {
  visit_status: VisitStatus;
  record_note: string;
  employee_id: string; // select value stringként jön
  client: ClientInfo;
  selectedServices: {
    service_id: string;
    name: string;
    price: number;
    duration_minutes: number;
  }[];
};

// ---- segédek ----
const safeParse = <T,>(text: string, fallback: T): T => {
  try {
    return text ? (JSON.parse(text) as T) : fallback;
  } catch {
    return fallback;
  }
};

const asString = (v: unknown) => (v == null ? "" : String(v));

const toDisplayName = (row: any): string => {
  const full = row?.full_name ?? row?.name ?? "";
  if (typeof full === "string" && full.trim()) return full.trim();
  const ln = asString(row?.last_name);
  const fn = asString(row?.first_name);
  const combo = `${ln} ${fn}`.trim();
  return combo || "Ismeretlen";
};

const normalizeEmployees = (data: any[]): Employee[] =>
  data.map((row) => ({
    id: row?.id,
    name: toDisplayName(row),
    role: row?.role ?? "employee",
  }));

// Lapos lista → kategóriákba rendezés
const groupServices = (flat: any[]): ServiceCategory[] => {
  const map = new Map<string, ServiceItem[]>();
  for (const r of flat) {
    const cat =
      r?.category ??
      r?.category_name ??
      r?.service_category ??
      "Egyéb";
    const item: ServiceItem = {
      id: r?.id,
      name: r?.name ?? "Ismeretlen szolgáltatás",
      price: Number(r?.price ?? 0),
      duration_minutes: Number(r?.duration_minutes ?? r?.duration ?? 0),
      category: cat,
    };
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(item);
  }
  return Array.from(map.entries()).map(([category, services]) => ({
    category,
    services,
  }));
};

// Már kategorizált adat
const isCategorized = (arr: any[]): boolean =>
  arr.length > 0 &&
  typeof arr[0] === "object" &&
  "category" in arr[0] &&
  Array.isArray(arr[0].services);

function WorkOrderNew() {
  // token + szerepkör a localStorage-ból
  const token = localStorage.getItem("kleo_token") || localStorage.getItem("token") || "";
  const roleFromDb = localStorage.getItem("kleo_role") || "guest";

  const allowedRoles = ["admin", "receptionist", "employee", "worker"];
  const unauthorized = !allowedRoles.includes(roleFromDb);

  // állapotok
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [searchService, setSearchService] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState<WorkOrderDraft>({
    visit_status: "várakozik",
    record_note: "",
    employee_id: "",
    client: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
    },
    selectedServices: [],
  });

  // ─────────── Dolgozók betöltése ───────────
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const res = await fetch("/api/employees", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await res.text();
        const raw = safeParse<any[]>(text, []);
        if (!Array.isArray(raw)) return;
        setEmployees(normalizeEmployees(raw));
      } catch (err) {
        console.error("Dolgozók betöltése hiba:", err);
      }
    })();
  }, [token]);

  // ─────────── Szolgáltatások betöltése ───────────
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const res = await fetch("/api/services", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await res.text();
        const raw = safeParse<any[]>(text, []);
        if (!Array.isArray(raw)) {
          setServiceCategories([]);
          return;
        }
        if (isCategorized(raw)) {
          // már kategorizált
          const cats = raw.map((c: any) => ({
            category: String(c.category ?? "Egyéb"),
            services: Array.isArray(c.services)
              ? c.services.map((s: any) => ({
                  id: s?.id,
                  name: s?.name ?? "Ismeretlen szolgáltatás",
                  price: Number(s?.price ?? 0),
                  duration_minutes: Number(s?.duration_minutes ?? s?.duration ?? 0),
                }))
              : [],
          })) as ServiceCategory[];
          setServiceCategories(cats);
        } else {
          // lapos → csoportosít
          setServiceCategories(groupServices(raw));
        }
      } catch (err) {
        console.error("Szolgáltatások betöltése hiba:", err);
        setServiceCategories([]);
      }
    })();
  }, [token]);

  // ─────────── Szolgáltatás hozzáadása ───────────
  const addServiceToDraft = (s: ServiceItem) => {
    setDraft((prev) => ({
      ...prev,
      selectedServices: [
        ...prev.selectedServices,
        {
          service_id: String(s.id),
          name: s.name,
          price: Number(s.price ?? 0),
          duration_minutes: Number(s.duration_minutes ?? 0),
        },
      ],
    }));
  };

  // ─────────── Szolgáltatás eltávolítása ───────────
  const removeServiceFromDraft = (service_id: string) => {
    setDraft((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.filter((svc) => svc.service_id !== service_id),
    }));
  };

  // ─────────── Státusz állítása ───────────
  const setVisitStatus = (status: VisitStatus) => {
    setDraft((prev) => ({ ...prev, visit_status: status }));
  };

  // ─────────── Vendég mezők frissítése ───────────
  const updateClientField = (field: keyof ClientInfo, value: string) => {
    setDraft((prev) => ({
      ...prev,
      client: {
        ...prev.client,
        [field]: value,
      },
    }));
  };

  // ─────────── Dolgozó kiválasztása ───────────
  const updateEmployee = (id: string) => {
    setDraft((prev) => ({ ...prev, employee_id: id }));
  };

  // ─────────── Mentés backendre ───────────
  const handleSave = async () => {
    setSaving(true);
    setMsg("");

    const payload = {
      employee_id: draft.employee_id || null,
      visit_status: draft.visit_status,
      record_note: draft.record_note,
      client_first_name: draft.client.first_name,
      client_last_name: draft.client.last_name,
      client_phone: draft.client.phone,
      client_email: draft.client.email,
      services: draft.selectedServices.map((svc) => ({
        service_id: svc.service_id,
        price: svc.price,
        duration_minutes: svc.duration_minutes,
      })),
    };

    try {
      const res = await fetch("/api/workorders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = safeParse<any>(text, {});
      if (res.ok) {
        setMsg("✅ Munkalap elmentve");
        // Példa: átirányítás később
        // window.location.href = `/workorders/${data?.work_order?.id}`;
      } else {
        setMsg(data?.error || "❌ Mentés sikertelen");
      }
    } catch (err) {
      console.error("Mentési hiba:", err);
      setMsg("❌ Hálózati vagy szerver hiba mentéskor");
    } finally {
      setSaving(false);
    }
  };

  // ─────────── Státusz gomb design ───────────
  const statusBtnClass = (value: VisitStatus) =>
    `px-3 py-2 rounded border text-sm font-medium ${
      draft.visit_status === value
        ? "bg-gray-800 text-white border-gray-800"
        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
    }`;

  // ─────────── Keresés szerinti szűrt lista ───────────
  const filteredCategories: ServiceCategory[] = useMemo(() => {
    const q = searchService.toLowerCase();
    return serviceCategories.map((cat) => ({
      category: cat.category,
      services: cat.services.filter((s) => s.name.toLowerCase().includes(q)),
    }));
  }, [serviceCategories, searchService]);

  // ─────────── RENDER ───────────
  if (unauthorized) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-100">
        <Sidebar />
        <main className="flex-1 p-6">
          <h2 className="text-3xl font-semibold mb-6">Új munkalap</h2>
          <div className="bg-white dark:bg-neutral-800 p-6 rounded shadow text-center text-red-600 font-semibold max-w-md">
            Nincs jogosultságod a munkalap létrehozásához.
            <div className="text-center text-gray-600 dark:text-gray-300 text-sm mt-2 font-normal">
              (Jelenlegi szerepköröd: {roleFromDb})
            </div>
          </div>
        </main>
      </div>
    );
  }

  const selectedEmp = employees.find((e) => String(e.id) === draft.employee_id);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-100">
      {/* BAL OLDALI MENÜ */}
      <Sidebar />

      {/* JOBB OLDALI TARTALOM */}
      <main className="flex-1 p-6">
        <h2 className="text-3xl font-semibold mb-6">Új munkalap</h2>

        <div className="flex flex-col md:flex-row gap-4">
          {/* BAL HASÁB */}
          <section className="bg-white dark:bg-neutral-800 rounded-lg shadow p-4 w-full md:w-1/4 flex flex-col gap-4">
            {/* Fejléc blokk */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
                {selectedEmp ? selectedEmp.name.slice(0, 2) : "??"}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {selectedEmp ? selectedEmp.name : "Dolgozó nincs kiválasztva"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Új munkalap</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date().toLocaleDateString("hu-HU", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}{" "}
                  {new Date().toLocaleTimeString("hu-HU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                <button
                  className="text-[11px] text-blue-600 underline mt-1"
                  onClick={() => {
                    // későbbi feature: időpont módosítása
                  }}
                >
                  Módosítás
                </button>
              </div>
            </div>

            {/* Státusz gombok */}
            <div className="flex flex-wrap gap-2">
              <button className={statusBtnClass("várakozik")} onClick={() => setVisitStatus("várakozik")}>
                Várakozás az ügyfélre
              </button>
              <button className={statusBtnClass("megérkezett")} onClick={() => setVisitStatus("megérkezett")}>
                Ügyfél megérkezett
              </button>
              <button className={statusBtnClass("nem_jött_el")} onClick={() => setVisitStatus("nem_jött_el")}>
                Nem jött el
              </button>
              <button className={statusBtnClass("megerősítve")} onClick={() => setVisitStatus("megerősítve")}>
                Megerősítve
              </button>
            </div>

            {/* Rekord megjegyzése */}
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">Rögzített mezők</div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Rekord megjegyzése</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg text-sm p-2 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-100"
              rows={3}
              value={draft.record_note}
              onChange={(e) => setDraft((prev) => ({ ...prev, record_note: e.target.value }))}
              placeholder="Megjegyzés / instrukció a munkához..."
            />

            {/* alsó mini gombok */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button className="border rounded-lg py-2 px-2 text-gray-700 dark:text-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                Speciális mezők
              </button>
              <button className="border rounded-lg py-2 px-2 text-gray-700 dark:text-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                Bejegyzés megismétlése
              </button>
              <button className="border rounded-lg py-2 px-2 text-gray-700 dark:text-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                Bejegyzés-értesítések
              </button>
              <button className="border rounded-lg py-2 px-2 text-gray-700 dark:text-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                Módosítási előzmények
              </button>
            </div>
          </section>

          {/* KÖZÉPSŐ HASÁB */}
          <section className="bg-white dark:bg-neutral-800 rounded-lg shadow p-4 w-full md:w-2/4 flex flex-col gap-4">
            {/* Tabok */}
            <div className="flex border rounded-lg overflow-hidden text-sm font-medium text-gray-700 dark:text-gray-200 dark:border-neutral-700">
              <button className="flex-1 py-2 bg-gray-100 dark:bg-neutral-700/50 border-r dark:border-neutral-700">
                Szolgáltatások
              </button>
              <button className="flex-1 py-2 text-gray-400 cursor-not-allowed">Termékek</button>
            </div>

            {/* Kereső */}
            <input
              type="text"
              className="border border-gray-300 rounded-lg text-sm p-2 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-100"
              placeholder="Keresés szolgáltatás név szerint…"
              value={searchService}
              onChange={(e) => setSearchService(e.target.value)}
            />

            {/* Gyors ajánlott szolgáltatások */}
            <div className="flex flex-wrap gap-2">
              {(filteredCategories[0]?.services ?? []).slice(0, 3).map((svc) => (
                <button
                  key={String(svc.id)}
                  className="border rounded-lg p-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-neutral-700/50 flex-1 min-w-[140px] dark:border-neutral-700 dark:text-gray-100"
                  onClick={() => addServiceToDraft(svc)}
                >
                  <div className="font-medium text-gray-800 dark:text-gray-100">{svc.name}</div>
                  <div className="text-[12px] text-gray-600 dark:text-gray-300">{svc.price} Ft</div>
                  <div className="text-[11px] text-gray-400 dark:text-gray-400">
                    {svc.duration_minutes} perc
                  </div>
                </button>
              ))}
            </div>

            {/* Kategorizált lista */}
            <div className="border rounded-lg bg-gray-50 dark:bg-neutral-900 dark:border-neutral-700 max-h-[300px] overflow-auto text-sm">
              {filteredCategories.map((cat) => (
                <details key={cat.category} className="border-b last:border-b-0 dark:border-neutral-700">
                  <summary className="cursor-pointer px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-between">
                    <span>{cat.category}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">▼</span>
                  </summary>
                  <div className="bg-white dark:bg-neutral-800">
                    {cat.services.map((svc) => (
                      <div
                        key={String(svc.id)}
                        className="px-3 py-2 flex flex-col hover:bg-gray-50 dark:hover:bg-neutral-700/50 cursor-pointer border-t dark:border-neutral-700 text-gray-800 dark:text-gray-100"
                        onClick={() => addServiceToDraft(svc)}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{svc.name}</span>
                          <span>{svc.price} Ft</span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {svc.duration_minutes} perc
                        </div>
                      </div>
                    ))}
                    {cat.services.length === 0 && (
                      <div className="px-3 py-2 text-gray-400 dark:text-gray-500 text-xs">
                        Nincs találat ebben a kategóriában.
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>

            {/* Hozzáadott szolgáltatások */}
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Hozzáadott szolgáltatások
              </div>
              {draft.selectedServices.length === 0 && (
                <div className="text-xs text-gray-400 dark:text-gray-500">Még nincs kiválasztva szolgáltatás.</div>
              )}
              {draft.selectedServices.length > 0 && (
                <div className="border rounded-lg overflow-hidden text-sm dark:border-neutral-700">
                  {draft.selectedServices.map((svc) => (
                    <div
                      key={svc.service_id}
                      className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 bg-white dark:bg-neutral-800 dark:border-neutral-700"
                    >
                      <div>
                        <div className="font-medium text-gray-800 dark:text-gray-100">{svc.name}</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {svc.duration_minutes} perc • {svc.price} Ft
                        </div>
                      </div>
                      <button
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => removeServiceFromDraft(svc.service_id)}
                      >
                        eltávolít
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dolgozó kiválasztása */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">
                Melyik dolgozó végzi?
              </label>
              <select
                className="border border-gray-300 rounded-lg text-sm p-2 w-full focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-100"
                value={draft.employee_id}
                onChange={(e) => updateEmployee(e.target.value)}
              >
                <option value="">Válassz dolgozót…</option>
                {employees.map((emp) => (
                  <option key={String(emp.id)} value={String(emp.id)}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Mentés gomb */}
            <div className="flex justify-end">
              <button
                disabled={saving}
                onClick={handleSave}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${
                  saving ? "bg-gray-400 cursor-wait" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {saving ? "Mentés..." : "Munkalap mentése"}
              </button>
            </div>

            {msg && <div className="text-sm text-gray-700 dark:text-gray-200 font-medium">{msg}</div>}
          </section>

          {/* JOBB HASÁB: Vendég adatai */}
          <section className="bg-white dark:bg-neutral-800 rounded-lg shadow p-4 w-full md:w-1/4 flex flex-col gap-4">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex justify-between">
              <span>Vendég adatai</span>
              <button
                className="text-[11px] text-blue-600 underline"
                onClick={() => {
                  // későbbi feature: vendég keresése
                }}
              >
                Vendég keresése
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Keresztnév</label>
                <input
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-100"
                  placeholder="Keresztnév"
                  value={draft.client.first_name}
                  onChange={(e) => updateClientField("first_name", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Vezetéknév</label>
                <input
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-100"
                  placeholder="Vezetéknév"
                  value={draft.client.last_name}
                  onChange={(e) => updateClientField("last_name", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Telefonszám</label>
                <input
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-100"
                  placeholder="+36 30 000 0000"
                  value={draft.client.phone}
                  onChange={(e) => updateClientField("phone", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">E-mail</label>
                <input
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-100"
                  placeholder="pelda@mail.hu"
                  value={draft.client.email}
                  onChange={(e) => updateClientField("email", e.target.value)}
                />
              </div>

              <div className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                <input
                  id="otherClient"
                  type="checkbox"
                  className="mt-1"
                  onChange={() => {
                    // későbbi extra: más nevére rögzítés
                  }}
                />
                <label htmlFor="otherClient">Bejegyzés egy másik látogató számára</label>
              </div>
            </div>

            {/* korábbi vendégek */}
            <div className="text-sm">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                Korábbi ügyfelek
              </div>
              <div className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                Név + telefonszám listázva…
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default WorkOrderNew;
