import fs from'fs';import path from'path';
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('transaction trace route and finance shortcut are exposed',()=>{const p=read('src/pages/Penzugy.tsx');expect(p).toContain('TransactionTracePage');expect(p).toContain('/finance/transaction-trace');expect(p).toContain('Tranzakció-életút')});

test('transaction trace UI exposes lifecycle proof timeline and backfill',()=>{const p=read('src/pages/TransactionTracePage.tsx');for(const marker of ['TRANSACTION LIFECYCLE & FORENSICS','Append-only · SHA-256','Bizonyítható üzleti lánc','Proof of integrity','Eseménytimeline','Kapcsolt entitások','30 nap backfill','Hash + HMAC újraellenőrzése'])expect(p).toContain(marker)});

test('transaction trace UI covers all primary root types and API operations',()=>{const p=read('src/pages/TransactionTracePage.tsx');for(const marker of ['work_order','purchase_order','booking','invoice','/recent','/search','/backfill','/verify'])expect(p).toContain(marker)});