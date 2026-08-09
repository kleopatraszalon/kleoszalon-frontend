import React, { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Minus, PackageOpen, Plus, Trash2 } from "lucide-react";
import "./WorkOrderMaterialsPanel.css";

export type WorkOrderMaterial = {
  productId: string | number;
  name: string;
  quantity: number;
  unit?: string | null;
  unitPrice?: number | null;
  availableStock?: number | null;
  required?: boolean;
  recommendedQuantity?: number | null;
};

type Props = {
  materials: WorkOrderMaterial[];
  onChange: (materials: WorkOrderMaterial[]) => void;
  disabled?: boolean;
};

const normalizeQuantity = (value: number) => Math.max(0.01, Math.round(value * 100) / 100);

export default function WorkOrderMaterialsPanel({ materials, onChange, disabled }: Props) {
  const total = useMemo(
    () => materials.reduce((sum, item) => sum + Number(item.unitPrice ?? 0) * item.quantity, 0),
    [materials]
  );

  const updateQuantity = (productId: WorkOrderMaterial["productId"], quantity: number) => {
    onChange(
      materials.map((item) =>
        String(item.productId) === String(productId)
          ? { ...item, quantity: normalizeQuantity(quantity) }
          : item
      )
    );
  };

  const remove = (productId: WorkOrderMaterial["productId"]) => {
    onChange(materials.filter((item) => String(item.productId) !== String(productId)));
  };

  return (
    <section className="workorder-materials" aria-label="Anyagfelhasználás">
      <header className="workorder-materials__header">
        <div>
          <span>ANYAG / KÉSZLET</span>
          <h2>Tényleges anyagfelhasználás</h2>
          <p>A rögzített mennyiség kerül levonásra a szalon készletéből a munkalap végleges lezárásakor.</p>
        </div>
        <strong>{materials.length} tétel</strong>
      </header>

      {materials.length === 0 ? (
        <div className="workorder-materials__empty">
          <PackageOpen />
          <b>Nincs kiválasztott anyag</b>
          <span>A „Tételek kiválasztása” ablak Termékhasználat fülén adj hozzá felhasznált anyagot.</span>
        </div>
      ) : (
        <div className="workorder-materials__list">
          {materials.map((item) => {
            const stock = item.availableStock == null ? null : Number(item.availableStock);
            const insufficient = stock != null && item.quantity > stock;
            const remaining = stock == null ? null : stock - item.quantity;
            const low = remaining != null && !insufficient && remaining <= Math.max(item.quantity, 1);
            const lineTotal = Number(item.unitPrice ?? 0) * item.quantity;

            return (
              <article key={String(item.productId)} className={insufficient ? "is-warning" : ""}>
                <div className="workorder-materials__identity">
                  <PackageOpen />
                  <span>
                    <b>{item.name}{item.required ? " · kötelező" : ""}</b>
                    <small>
                      {stock == null ? "Készletadat nem érhető el" : `Jelenlegi készlet: ${stock.toLocaleString("hu-HU")} ${item.unit || "db"}`}
                    </small>
                  </span>
                </div>

                <div className="workorder-materials__quantity">
                  <button type="button" disabled={disabled} onClick={() => updateQuantity(item.productId, item.quantity - 1)} aria-label="Mennyiség csökkentése">
                    <Minus />
                  </button>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    disabled={disabled}
                    value={item.quantity}
                    onChange={(event) => updateQuantity(item.productId, Number(event.target.value) || 0.01)}
                  />
                  <span>{item.unit || "db"}</span>
                  <button type="button" disabled={disabled} onClick={() => updateQuantity(item.productId, item.quantity + 1)} aria-label="Mennyiség növelése">
                    <Plus />
                  </button>
                </div>

                <div className="workorder-materials__value">
                  <b>{lineTotal.toLocaleString("hu-HU")} Ft</b>
                  <small>{Number(item.unitPrice ?? 0).toLocaleString("hu-HU")} Ft / {item.unit || "db"}</small>
                </div>

                <button className="workorder-materials__remove" type="button" disabled={disabled} onClick={() => remove(item.productId)} aria-label={`${item.name} eltávolítása`}>
                  <Trash2 />
                </button>

                {stock != null && (
                  <div className={insufficient ? "workorder-materials__warning" : "workorder-materials__stock-ok"}>
                    {insufficient ? <AlertTriangle /> : <CheckCircle2 />}
                    {insufficient
                      ? `Készlethiány: még ${(item.quantity-stock).toLocaleString("hu-HU")} ${item.unit || "db"} szükséges.`
                      : `Felhasználás után marad: ${Math.max(0,remaining || 0).toLocaleString("hu-HU")} ${item.unit || "db"}${low ? " · alacsony készlet" : ""}.`}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <footer>
        <span>Becsült anyagérték</span>
        <strong>{total.toLocaleString("hu-HU")} Ft</strong>
      </footer>
    </section>
  );
}
