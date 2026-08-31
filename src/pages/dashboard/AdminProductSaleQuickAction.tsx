import React from "react";
import { CalendarPlus, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./AdminQuickActions.css";

export default function AdminProductSaleQuickAction(){
  const navigate=useNavigate();
  return <section className="admin-quick-actions" aria-label="Gyors műveletek">
    <button
      type="button"
      className="admin-quick-action admin-quick-action--appointment"
      onClick={()=>navigate("/appointments/new")}
      title="Új időpont rögzítése"
    >
      <span className="admin-quick-action__icon"><CalendarPlus size={19}/></span>
      <span className="admin-quick-action__copy">
        <span className="admin-quick-action__title">Új időpont</span>
        <span className="admin-quick-action__meta">Foglalás létrehozása</span>
      </span>
    </button>
    <button
      type="button"
      className="admin-quick-action admin-quick-action--sale"
      onClick={()=>navigate("/finance/product-sale")}
      title="Termék értékesítése szolgáltatási munkalap nélkül"
    >
      <span className="admin-quick-action__icon"><ShoppingBag size={19}/></span>
      <span className="admin-quick-action__copy">
        <span className="admin-quick-action__title">Termékeladás</span>
        <span className="admin-quick-action__meta">Gyors értékesítés</span>
      </span>
    </button>
  </section>;
}
