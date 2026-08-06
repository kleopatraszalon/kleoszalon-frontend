import React, { useMemo } from "react";
import { AlertTriangle, Minus, PackageOpen, Plus, Trash2 } from "lucide-react";
import "./WorkOrderMaterialsPanel.css";

export type WorkOrderMaterial = {
  productId: string | number;
  name: string;
  quantity: number;
  unit?: string | null;
  unitPrice?: number | null;
  availableStock?: number | null;
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
          <span>ANYAGFELHASZNÁLÁS</span>
          <h2>Felhasznált termékek</h2>
          <p>A tényleges mennyiségek alapján készíthető elő a későbbi automatikus készletcsökkentés.</p>
        </div>
        <strong>{materials.length} tétel</strong>
      </header>

      {materials.length === 0 ? (
        <div className="workorder-materials__empty">
          <PackageOpen />
          <b>Nincs kiválasztott anyag</b>
          <span>A munkalap terméklistájából adj hozzá felhasznált anyagot.</span>
        </div>
      ) : (
        <div className="workorder-materials__list">
          {materials.map((item) => {
            const stock = item.availableStock == null ? null : Number(item.availableStock);
            const insufficient = stock != null && item.quantity > stock;
            const lineTotal = Number(item.unitPrice ?? 0) * item.quantity;

            return (
              <article key={String(item.productId)} className={insufficient ? "is-warning" : ""}>
                <div className="workorder-materials__identity">
                  <PackageOpen />
                  <span>
                    <b>{item.name}</b>
                    <small>
                      {stock == null ? "Készletadat nem érhető el" : `Elérhető: ${stock.toLocaleString("hu-HU")} ${item.unit || "db"}`}
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

                {insufficient && (
                  <div className="workorder-materials__warning">
                    <AlertTriangle /> A megadott mennyiség meghaladja a nyilvántartott készletet.
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
