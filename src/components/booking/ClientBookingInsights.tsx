import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Crown, HeartHandshake, Sparkles, Star } from "lucide-react";
import { fetchJSON } from "../../utils/fetch";
import "./ClientBookingInsights.css";

export type ClientInsightSource = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  vip?: boolean | null;
  is_vip?: boolean | null;
  vip_status?: string | null;
  loyalty_points?: number | string | null;
  points?: number | string | null;
  visit_count?: number | string | null;
  appointments_count?: number | string | null;
  last_visit_at?: string | null;
  last_appointment_at?: string | null;
  favorite_service_name?: string | null;
  favourite_service_name?: string | null;
  allergies?: string | string[] | null;
  allergy_notes?: string | null;
  notes?: string | null;
  internal_notes?: string | null;
  marketing_consent?: boolean | null;
};

type Props = {
  client?: ClientInsightSource | null;
};

const textValue = (value: unknown) => String(value ?? "").trim();
const numberValue = (value: unknown) => Number(value || 0);
const dateText = (value?: string | null) => {
  if (!value) return "Nincs korábbi látogatás";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Nincs korábbi látogatás" : date.toLocaleDateString("hu-HU");
};

export default function ClientBookingInsights({ client }: Props) {
  const [detail, setDetail] = useState<ClientInsightSource | null>(null);

  useEffect(() => {
    let active = true;
    setDetail(null);
    if (!client?.id) return () => { active = false; };

    fetchJSON<any>(`/api/clients/${client.id}`, undefined, null)
      .then((raw) => {
        if (!active || !raw) return;
        const resolved = raw?.data || raw?.item || raw;
        if (resolved && typeof resolved === "object") setDetail(resolved);
      })
      .catch(() => undefined);

    return () => { active = false; };
  }, [client?.id]);

  const model = useMemo(() => {
    if (!client) return null;
    const source = { ...client, ...(detail || {}) };
    const vip = Boolean(source.vip || source.is_vip || textValue(source.vip_status).toLowerCase() === "vip");
    const allergies = Array.isArray(source.allergies) ? source.allergies.join(", ") : textValue(source.allergies || source.allergy_notes);
    return {
      name: source.full_name || source.name || "Vendég",
      vip,
      points: numberValue(source.loyalty_points ?? source.points),
      visits: numberValue(source.visit_count ?? source.appointments_count),
      lastVisit: dateText(source.last_visit_at || source.last_appointment_at),
      favoriteService: textValue(source.favorite_service_name || source.favourite_service_name) || "Még nincs meghatározva",
      allergies,
      notes: textValue(source.internal_notes || source.notes),
      marketingConsent: source.marketing_consent,
    };
  }, [client, detail]);

  if (!model) return null;

  return (
    <section className="client-booking-insights" aria-label="Vendég CRM összefoglaló">
      <header>
        <div>
          <span><Sparkles size={14}/> VENDÉG CRM</span>
          <h4>{model.name}</h4>
        </div>
        {model.vip && <b className="client-booking-insights__vip"><Crown size={14}/> VIP</b>}
      </header>

      <div className="client-booking-insights__metrics">
        <article><HeartHandshake/><span><strong>{model.visits}</strong><small>korábbi látogatás</small></span></article>
        <article><Star/><span><strong>{model.points}</strong><small>hűségpont</small></span></article>
        <article><CalendarClock/><span><strong>{model.lastVisit}</strong><small>utolsó látogatás</small></span></article>
      </div>

      <dl>
        <div><dt>Kedvelt szolgáltatás</dt><dd>{model.favoriteService}</dd></div>
        <div><dt>Marketing hozzájárulás</dt><dd>{model.marketingConsent === true ? "Megadva" : model.marketingConsent === false ? "Nincs megadva" : "Nincs adat"}</dd></div>
      </dl>

      {model.allergies && <p className="client-booking-insights__warning"><AlertTriangle size={16}/><span><b>Allergia / érzékenység</b>{model.allergies}</span></p>}
      {model.notes && <p className="client-booking-insights__note"><b>Belső megjegyzés:</b> {model.notes}</p>}
    </section>
  );
}
