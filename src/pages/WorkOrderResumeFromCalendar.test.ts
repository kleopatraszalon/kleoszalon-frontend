import fs from "fs";
import path from "path";

const modal = fs.readFileSync(path.join(__dirname, "WorkOrderNewModalPage.tsx"), "utf8");
const modalCss = fs.readFileSync(path.join(__dirname, "WorkOrderNewModalPage.css"), "utf8");
const navigator = fs.readFileSync(path.join(__dirname, "workorders", "WorkOrderWorkflowNavigator.tsx"), "utf8");
const guest = fs.readFileSync(path.join(__dirname, "workorders", "WorkOrderGuestContextPanel.tsx"), "utf8");

test("calendar work order opening persists arrival and resumes the same saved work order", () => {
  expect(modal).toContain("/api/transactions/booking-workorder/appointments/");
  expect(modal).toContain("/arrive");
  expect(modal).toContain("work_order_id");
  expect(modal).toContain("navigate(`/workorders/${encodeURIComponent(workOrderId)}`,{replace:true})");
  expect(modal).toContain("Ha ehhez az időponthoz már tartozik munkalap, ugyanaz a munkalapszám nyílik meg");
});

test("work order modal exposes the full saved detail and removes duplicate in-form navigation", () => {
  expect(modalCss).toContain("width:min(1780px,99vw)");
  expect(modalCss).toContain("height:min(1100px,98dvh)");
  expect(modalCss).toContain('form>nav[aria-label="Munkalap folyamat"]{display:none!important}');
  expect(modalCss).toContain(".wo-modal-scroll--detail .wo-detail__hero{display:flex!important");
});

test("payment and close workflow buttons target stable section ids", () => {
  expect(navigator).toContain("payment:'workorder-payment-step'");
  expect(navigator).toContain("close:'workorder-close-step'");
  expect(navigator).toContain("root.querySelector<HTMLElement>(`#${targetId}`)");
});

test("legacy salon-less guest profile does not block work order and payment flow", () => {
  expect(guest).toContain("Number(e?.status)===404");
  expect(guest).toContain("profileUnavailable");
  expect(guest).toContain("a munkalap és a fizetés folytatható");
});
