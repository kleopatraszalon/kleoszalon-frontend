import fs from'node:fs';import path from'node:path';
const read=(p:string)=>fs.readFileSync(path.join(__dirname,p),'utf8');
describe('Gyongyos Fitness dual-screen locker system',()=>{
 const panel=read('pages/FitnessLockerPanel.tsx');const kiosk=read('pages/FitnessLockerKiosk.tsx');const finance=read('pages/Penzugy.tsx');
 test('finance exposes separate receptionist and guest display routes',()=>{expect(finance).toContain('/finance/fitness/lockers/kiosk');expect(finance).toContain('/finance/fitness/lockers');expect(finance).toContain('FitnessLockerPanel');expect(finance).toContain('FitnessLockerKiosk');expect(finance).toContain('Öltözőszekrények')});
 test('reception display controls 20-locker API and opens the second display',()=>{expect(panel).toContain("api.get('/vir/fitness/lockers')");expect(panel).toContain('/vir/fitness/lockers/scan');expect(panel).toContain('/open`');expect(panel).toContain('/release`');expect(panel).toContain('window.open');expect(panel).toContain('Vendég kijelző');expect(panel).toContain('Vezérlő');});
 test('guest display supports keyboard-wedge RFID and does not display raw UID',()=>{expect(kiosk).toContain('/vir/fitness/lockers/scan');expect(kiosk).toContain("e.key==='Enter'");expect(kiosk).toContain('requestFullscreen');expect(kiosk).toContain('Érintsd a Fitness kártyád');expect(kiosk).not.toContain('card_uid_hash');expect(kiosk).not.toContain('card_last4');});
 test('controller state and admin bridge token are visible only on operations display',()=>{expect(panel).toContain('/vir/fitness/lockers/controller/token');expect(panel).toContain('bridge_token_configured');expect(panel).toContain('controller_channel');expect(kiosk).not.toContain('/controller/token');});
});
