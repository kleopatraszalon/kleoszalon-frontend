// src/components/SidebarCalendar.tsx
import React, { useState } from "react";
type SidebarCalendarProps = {
  /** Ha meg van adva, kattintáskor meghívjuk ezzel a dátummal */
  onSelectDate?: (date: Date) => void;
  /** Kezdő dátum (alap: ma) */
  initialDate?: Date;
};

const HUN_MONTHS = [
  "január",
  "február",
  "március",
  "április",
  "május",
  "június",
  "július",
  "augusztus",
  "szeptember",
  "október",
  "november",
  "december",
];

const HUN_DAYS_SHORT = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

/** Készít egy új Date-et (az eredeti módosítása nélkül) */
function makeDate(y: number, m: number, d: number) {
  return new Date(y, m, d, 0, 0, 0, 0);
}

/** Az adott hónaphoz visszaad 6×7 = 42 napot, hétfővel kezdve */
function buildMonthGrid(monthStart: Date): Date[] {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();

  const firstOfMonth = makeDate(year, month, 1);
  // JS-ben: 0 = vasárnap, 1 = hétfő, stb.
  const jsDay = firstOfMonth.getDay();
  const mondayIndex = (jsDay + 6) % 7; // hétfő = 0
  const gridStart = makeDate(
    year,
    month,
    1 - mondayIndex // visszalépünk az előző hétfőig
  );

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const SidebarCalendar: React.FC<SidebarCalendarProps> = ({
  onSelectDate,
  initialDate,
}) => {
  const today = new Date();
  const startDate = initialDate ?? today;

  const [currentMonth, setCurrentMonth] = useState<Date>(
    () => makeDate(startDate.getFullYear(), startDate.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date>(startDate);

  const days = buildMonthGrid(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) =>
      makeDate(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) =>
      makeDate(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    onSelectDate?.(day);
  };

  const monthLabel = `${HUN_MONTHS[currentMonth.getMonth()]} ${
    currentMonth.getFullYear()
  }`;

  return (
    <div className="sidebar-calendar">
      <div className="sidebar-calendar-header">
        <button
          type="button"
          className="sidebar-calendar-nav-btn"
          onClick={handlePrevMonth}
        >
          ‹
        </button>
        <div className="sidebar-calendar-month">{monthLabel}</div>
        <button
          type="button"
          className="sidebar-calendar-nav-btn"
          onClick={handleNextMonth}
        >
          ›
        </button>
      </div>

      <div className="sidebar-calendar-grid">
        {HUN_DAYS_SHORT.map((label) => (
          <div
            key={label}
            className="sidebar-calendar-weekday"
            aria-hidden="true"
          >
            {label}
          </div>
        ))}

        {days.map((day) => {
          const inCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);

          const classNames = [
            "sidebar-calendar-day",
            !inCurrentMonth && "sidebar-calendar-day--other-month",
            isToday && "sidebar-calendar-day--today",
            isSelected && "sidebar-calendar-day--selected",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={day.toISOString()}
              type="button"
              className={classNames}
              onClick={() => handleDayClick(day)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SidebarCalendar;
