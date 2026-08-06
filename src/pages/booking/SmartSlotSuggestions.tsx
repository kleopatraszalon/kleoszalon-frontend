import React, { useMemo, useState } from "react";
import { Clock3, Sparkles, UserRound } from "lucide-react";
import "./SmartSlotSuggestions.css";

type Employee = { id: string; name: string };
type Appointment = { start_time: string; end_time: string; employee_id: string | null; status?: string | null };
type SuggestedSlot = { employeeId: string; employeeName: string; date: string; startMinutes: number; startLabel: string; endLabel: string };

type Props = {
  employees: Employee[];
  appointments: Appointment[];
  selectedDate: string;
  onSelect: (slot: SuggestedSlot, duration: number) => void;
};

const cancelled = new Set(["cancelled", "canceled", "no_show", "noshow"]);
const pad = (value: number) => String(value).padStart(2, "0");
const timeLabel = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
const dateKey = (value: string) => value.slice(0, 10);

export default function SmartSlotSuggestions({ employees, appointments, selectedDate, onSelect }: Props) {
  const [duration, setDuration] = useState(30);

  const suggestions = useMemo(() => {
    const openMinute = 8 * 60;
    const closeMinute = 20 * 60;
    const step = 15;
    const result: SuggestedSlot[] = [];

    for (const employee of employees) {
      const busy = appointments
        .filter((item) => item.employee_id === employee.id && dateKey(item.start_time) === selectedDate)
        .filter((item) => !cancelled.has(String(item.status || "").toLowerCase()))
        .map((item) => ({
          start: new Date(item.start_time).getHours() * 60 + new Date(item.start_time).getMinutes(),
          end: new Date(item.end_time).getHours() * 60 + new Date(item.end_time).getMinutes(),
        }))
        .sort((a, b) => a.start - b.start);

      for (let start = openMinute; start + duration <= closeMinute; start += step) {
        const end = start + duration;
        const overlaps = busy.some((item) => start < item.end && end > item.start);
        if (!overlaps) {
          result.push({
            employeeId: employee.id,
            employeeName: employee.name,
            date: selectedDate,
            startMinutes: start,
            startLabel: timeLabel(start),
            endLabel: timeLabel(end),
          });
          break;
        }
      }
    }

    return result.slice(0, 6);
  }, [appointments, duration, employees, selectedDate]);

  return (
    <section className="smart-slots">
      <header>
        <div><span><Sparkles size={14}/> INTELLIGENS IDŐPONT-AJÁNLÓ</span><h2>Legkorábbi szabad idősávok</h2><p>A javaslat a megjelenített napi foglalások és a választott időtartam alapján készül.</p></div>
        <label>Időtartam<select value={duration} onChange={(event) => setDuration(Number(event.target.value))}><option value={30}>30 perc</option><option value={45}>45 perc</option><option value={60}>60 perc</option><option value={90}>90 perc</option></select></label>
      </header>
      <div className="smart-slots__grid">
        {suggestions.length ? suggestions.map((slot) => (
          <button key={`${slot.employeeId}-${slot.startMinutes}`} type="button" onClick={() => onSelect(slot, duration)}>
            <UserRound/><span><b>{slot.employeeName}</b><small>{slot.date}</small></span><i><Clock3/>{slot.startLabel}–{slot.endLabel}</i>
          </button>
        )) : <p>Nincs szabad idősáv a kiválasztott napon és időtartammal.</p>}
      </div>
    </section>
  );
}
