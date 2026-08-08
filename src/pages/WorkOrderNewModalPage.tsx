import React from "react";
import { CalendarCheck2, CheckCircle2, CreditCard, PackagePlus, UserRound, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WorkOrderNew from "./WorkOrderNew";
import "./WorkOrderNewModalPage.css";

const FLOW = [
  { icon: <UserRound size={18} />, title: "Vendég és időpont", text: "Vendég, szalon, munkatárs és érkezés" },
  { icon: <PackagePlus size={18} />, title: "Szolgáltatás / termék", text: "Szolgáltatások, termékek és anyaghasználat" },
  { icon: <CheckCircle2 size={18} />, title: "Ellenőrzés", text: "Készlet, kedvezmény, bérlet és összesítés" },
  { icon: <CreditCard size={18} />, title: "Fizetés és lezárás", text: "Fizetési módok, mentés vagy lezárás" },
];

type Props = { onClose?: () => void };

export default function WorkOrderNewModalPage({ onClose }: Props) {
  const navigate = useNavigate();
  const close = () => onClose ? onClose() : navigate("/workorders");

  return (
    <div className="wo-modal-backdrop" role="presentation">
      <section className="wo-modal-window" role="dialog" aria-modal="true" aria-labelledby="wo-modal-title">
        <header className="wo-modal-header">
          <div className="wo-modal-heading">
            <span className="wo-modal-kicker"><CalendarCheck2 size={16} /> DIGITÁLIS MUNKALAP</span>
            <h1 id="wo-modal-title">Munkalap rögzítése</h1>
            <p>A munkalap teljes folyamata egy ablakban, a vendég érkezésétől a fizetésig.</p>
          </div>
          <button className="wo-modal-close" type="button" onClick={close} aria-label="Munkalap ablak bezárása" title="Bezárás">
            <X size={22} />
          </button>
        </header>

        <div className="wo-modal-flow" aria-label="Munkalap rögzítési folyamat">
          {FLOW.map((step, index) => (
            <React.Fragment key={step.title}>
              <div className="wo-modal-flow-step">
                <span className="wo-modal-flow-index">{index + 1}</span>
                <i>{step.icon}</i>
                <span><b>{step.title}</b><small>{step.text}</small></span>
              </div>
              {index < FLOW.length - 1 && <div className="wo-modal-flow-line" aria-hidden="true" />}
            </React.Fragment>
          ))}
        </div>

        <div className="wo-modal-scroll">
          <WorkOrderNew />
        </div>
      </section>
    </div>
  );
}
