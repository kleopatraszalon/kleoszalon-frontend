import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import withBase from "../utils/apiBase";

type UUID = string;

interface ServiceTypeItem {
  id: UUID | string;
  name: string;
}

interface ServiceOption {
  id: UUID | string;
  name: string;
}

export type Service = {
  id: UUID | string;
  name: string;
  code?: string | null;
  short_name?: string | null;
  description_short?: string | null;
  description_long?: string | null;
  service_type_id?: UUID | null;
  parent_service_id?: UUID | null;
  base_price?: number | null;
  list_price?: number | null;
  currency?: string | null;
  duration_minutes?: number | null;
  wait_duration_min?: number | null;
  promo_price?: number | null;
  promo_valid_from?: string | null;
  promo_valid_to?: string | null;
  promo_label?: string | null;
  online_bookable?: boolean | null;
  is_active?: boolean | null;
  is_combo?: boolean | null;
};

interface ServiceNewModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onServiceCreated?: (srv: Service | null) => void;
}

const getToken = () =>
  localStorage.getItem("kleo_token") ||
  localStorage.getItem("token") ||
  "";

const authHeaders = (): Record<string, string> => {
  const t = getToken();
  const h: Record<string, string> = {};
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
};

const safeParse = <T,>(txt: string, fallback: T): T => {
  try {
    return JSON.parse(txt) as T;
  } catch {
    return fallback;
  }
};

async function parseJson<T>(
  res: Response,
  fallback: T
): Promise<T> {
  const txt = await res.text();
  if (!txt) return fallback;
  return safeParse<T>(txt, fallback);
}

/* =================================================================== */
/*                      ÚJ SZOLGÁLTATÁS FELVÉTELE                      */
/* =================================================================== */

const ServiceNewModal: React.FC<ServiceNewModalProps> = ({
  isOpen,
  onRequestClose,
  onServiceCreated,
}) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [shortName, setShortName] = useState("");

  const [serviceTypes, setServiceTypes] = useState<
    ServiceTypeItem[]
  >([]);
  const [servicesForParent, setServicesForParent] = useState<
    ServiceOption[]
  >([]);
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [parentServiceId, setParentServiceId] = useState("");

  const [basePrice, setBasePrice] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [currency, setCurrency] = useState("HUF");

  const [durationMin, setDurationMin] = useState("");
  const [waitDurationMin, setWaitDurationMin] = useState("");

  const [descShort, setDescShort] = useState("");
  const [descLong, setDescLong] = useState("");

  const [promoPrice, setPromoPrice] = useState("");
  const [promoFrom, setPromoFrom] = useState("");
  const [promoTo, setPromoTo] = useState("");
  const [promoLabel, setPromoLabel] = useState("");

  const [active, setActive] = useState(true);
  const [onlineBookable, setOnlineBookable] = useState(true);
  const [isCombo, setIsCombo] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  /* ---------- Betöltések ---------- */
  useEffect(() => {
    if (!isOpen) return;

    const run = async () => {
      try {
        const headers = authHeaders();

        const [typesRes, srvRes] = await Promise.all([
          fetch(withBase("service-types"), {
            headers,
          }),
          fetch(
            withBase("services?include_inactive=1"),
            { headers }
          ),
        ]);

        if (typesRes.ok) {
          const types =
            await parseJson<ServiceTypeItem[]>(
              typesRes,
              []
            );
          setServiceTypes(types || []);
        }

        if (srvRes.ok) {
          const allSrv =
            await parseJson<ServiceOption[]>(
              srvRes,
              []
            );
          setServicesForParent(
            (allSrv || []).map((s) => ({
              id: s.id,
              name: (s as any).name || "",
            }))
          );
        }
      } catch (e) {
        // nem kritikus, csak üres listákkal indul
      }
    };

    run();
  }, [isOpen]);

  const resetForm = () => {
    setName("");
    setCode("");
    setShortName("");
    setServiceTypeId("");
    setParentServiceId("");
    setBasePrice("");
    setListPrice("");
    setCurrency("HUF");
    setDurationMin("");
    setWaitDurationMin("");
    setDescShort("");
    setDescLong("");
    setPromoPrice("");
    setPromoFrom("");
    setPromoTo("");
    setPromoLabel("");
    setActive(true);
    setOnlineBookable(true);
    setIsCombo(false);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSave = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim()) {
      setErrorMsg("A szolgáltatás neve kötelező.");
      return;
    }
    if (!durationMin.trim()) {
      setErrorMsg("Az időtartam (perc) kötelező.");
      return;
    }

    try {
      setSaving(true);

      const payload: any = {
        name: name.trim(),
        code: code.trim() || null,
        short_name: shortName.trim() || null,
        service_type_id: serviceTypeId || null,
        parent_service_id: parentServiceId || null,
        base_price: basePrice
          ? Number(basePrice)
          : null,
        list_price: listPrice
          ? Number(listPrice)
          : basePrice
          ? Number(basePrice)
          : null,
        currency: currency || "HUF",
        duration_minutes: Number(durationMin),
        wait_duration_min: waitDurationMin
          ? Number(waitDurationMin)
          : null,
        description_short: descShort.trim() || null,
        description_long: descLong.trim() || null,
        promo_price: promoPrice
          ? Number(promoPrice)
          : null,
        promo_valid_from: promoFrom || null,
        promo_valid_to: promoTo || null,
        promo_label: promoLabel.trim() || null,
        is_active: active,
        online_bookable: onlineBookable,
        is_combo: isCombo,
      };

      const res = await fetch(withBase("services"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await parseJson<Service | any>(
        res,
        {} as any
      );

      if (!res.ok) {
        throw new Error(
          data?.error ||
            "Nem sikerült létrehozni az új szolgáltatást."
        );
      }

      setSuccessMsg("Új szolgáltatás elmentve.");
      onServiceCreated?.(data as Service);
      resetForm();
    } catch (e: any) {
      setErrorMsg(
        e?.message ||
          "Hiba történt a mentés közben."
      );
      onServiceCreated?.(null);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Új szolgáltatás felvétele"
      style={{
        overlay: {
          backgroundColor: "rgba(18,12,8,0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
        },
        content: {
          inset: "40px auto auto",
          maxWidth: "1200px",
          width: "calc(100% - 80px)",
          margin: "0 auto",
          border: "none",
          background: "transparent",
          padding: 0,
          overflow: "visible",
        },
      }}
    >
      <div className="bg-white/98 text-[#120c08] border border-[#d5c4a4] rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.35)] overflow-visible">
        {/* Felső gombsor */}
        <div className="flex items-center justify-end gap-2 p-3 border-b border-[#e3d8c3] bg-gradient-to-r from-[#fffaf5] via-[#f9f0e4] to-[#fffaf5]">
          <button
            onClick={() => {
              resetForm();
              onRequestClose();
            }}
            className="px-3 py-2 text-xs font-medium rounded-full border border-[#d5c4a4] text-[#5d5a55] bg-white/80 hover:bg-white"
          >
            Bezár
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-3 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-[#b69861] to-[#ec008c] text-white shadow-md hover:shadow-lg hover:brightness-105 ${
              saving
                ? "opacity-60 cursor-not-allowed"
                : ""
            }`}
          >
            {saving ? "Mentés…" : "Mentés"}
          </button>
        </div>

        {/* Fejléc */}
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-300 grid place-items-center overflow-hidden">
              <span className="text-gray-400 text-xs leading-tight text-center">
                Új
                <br />
                Szolgáltatás
              </span>
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold">
                Új szolgáltatás felvétele
              </div>
              <div className="text-xs text-gray-500">
                Alapadatok, árazás, akció, hierarchia és
                foglalhatóság beállítása.
              </div>
            </div>
          </div>
        </div>

        {/* Tartalom */}
        <div className="px-4 pb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alapadatok */}
            <section className="bg-[#faf7f0] border border-[#e3d8c3] rounded-lg p-3 space-y-2">
              <div className="text-sm font-semibold">
                Alapadatok
              </div>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">
                  Név *
                </span>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="pl. Géllakk kézre"
                />
              </label>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">
                  Kód
                </span>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value)
                  }
                  placeholder="pl. GLK-KEZ-01"
                />
              </label>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">
                  Rövid név (opcionális)
                </span>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={shortName}
                  onChange={(e) =>
                    setShortName(e.target.value)
                  }
                  placeholder="pl. Géllakk kéz"
                />
              </label>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">
                  Szolgáltatás típus
                </span>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={serviceTypeId}
                  onChange={(e) =>
                    setServiceTypeId(e.target.value)
                  }
                >
                  <option value="">
                    — Nincs típus hozzárendelve —
                  </option>
                  {serviceTypes.map((t) => (
                    <option
                      key={String(t.id)}
                      value={String(t.id)}
                    >
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">
                  Főszolgáltatás
                </span>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={parentServiceId}
                  onChange={(e) =>
                    setParentServiceId(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    — Ez egy főszolgáltatás —
                  </option>
                  {servicesForParent.map((s) => (
                    <option
                      key={String(s.id)}
                      value={String(s.id)}
                    >
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            {/* Árazás, idő, flags */}
            <section className="bg-[#faf7f0] border border-[#e3d8c3] rounded-lg p-3 space-y-2">
              <div className="text-sm font-semibold">
                Árazás és idő
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Alap ár (Ft)
                  </span>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={basePrice}
                    onChange={(e) =>
                      setBasePrice(e.target.value)
                    }
                  />
                </label>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Listaár (Ft)
                  </span>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={listPrice}
                    onChange={(e) =>
                      setListPrice(
                        e.target.value
                      )
                    }
                    placeholder="ha üres, az alap ár kerül listaárként"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Pénznem
                  </span>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={currency}
                    onChange={(e) =>
                      setCurrency(e.target.value)
                    }
                  />
                </label>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Időtartam (perc) *
                  </span>
                  <input
                    type="number"
                    min={1}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={durationMin}
                    onChange={(e) =>
                      setDurationMin(
                        e.target.value
                      )
                    }
                  />
                </label>
              </div>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">
                  Hatóidő / várakozás (perc)
                </span>
                <input
                  type="number"
                  min={0}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={waitDurationMin}
                  onChange={(e) =>
                    setWaitDurationMin(
                      e.target.value
                    )
                  }
                />
              </label>

              <div className="text-sm font-semibold mt-3">
                Akció (opcionális)
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Akciós ár (Ft)
                  </span>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={promoPrice}
                    onChange={(e) =>
                      setPromoPrice(
                        e.target.value
                      )
                    }
                  />
                </label>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Akció neve
                  </span>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={promoLabel}
                    onChange={(e) =>
                      setPromoLabel(
                        e.target.value
                      )
                    }
                    placeholder="pl. Tavaszi akció"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Akció kezdete
                    (YYYY-MM-DD)
                  </span>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={promoFrom}
                    onChange={(e) =>
                      setPromoFrom(
                        e.target.value
                      )
                    }
                  />
                </label>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Akció vége
                    (YYYY-MM-DD)
                  </span>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={promoTo}
                    onChange={(e) =>
                      setPromoTo(
                        e.target.value
                      )
                    }
                  />
                </label>
              </div>

              <div className="text-sm font-semibold mt-3">
                Egyéb beállítások
              </div>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) =>
                    setActive(e.target.checked)
                  }
                />
                Aktív
              </label>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={onlineBookable}
                  onChange={(e) =>
                    setOnlineBookable(
                      e.target.checked
                    )
                  }
                />
                Foglalható online
              </label>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={isCombo}
                  onChange={(e) =>
                    setIsCombo(e.target.checked)
                  }
                />
                Kombinált (összetett)
                szolgáltatás
              </label>
            </section>
          </div>

          {/* Leírások */}
          <section className="bg-[#faf7f0] border border-[#e3d8c3] rounded-lg p-3 space-y-2 mt-4">
            <div className="text-sm font-semibold">
              Leírások
            </div>

            <label className="text-xs block">
              <span className="text-gray-500 block mb-1">
                Rövid leírás
              </span>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={descShort}
                onChange={(e) =>
                  setDescShort(e.target.value)
                }
                placeholder="pl. 1 színnel, erős fényű géllakk."
              />
            </label>

            <label className="text-xs block">
              <span className="text-gray-500 block mb-1">
                Részletes leírás
              </span>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                rows={3}
                value={descLong}
                onChange={(e) =>
                  setDescLong(e.target.value)
                }
              />
            </label>
          </section>

          {/* Üzenetek */}
          {errorMsg && (
            <div className="mt-3 text-xs text-red-600">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mt-3 text-xs text-emerald-600">
              {successMsg}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ServiceNewModal;
