import fs from'fs';import path from'path';
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('transaction trace UI exposes modern forensic controls',()=>{const p=read('src/pages/TransactionTracePage.tsx');for(const marker of ['TRACE HEALTH','HMAC PROOF','TRACE WATCHDOG','FORENSIC RISK SCORE','Proof package export','Függőségi gráf','Automatikusan észlelt anomáliák'])expect(p).toContain(marker)});

test('transaction trace UI calls forensic backend tools',()=>{const p=read('src/pages/TransactionTracePage.tsx');for(const marker of ['/health?','/watchdog','/graph','/proof-package'])expect(p).toContain(marker)});

test('forensic styles are loaded by finance route adapter',()=>{const p=read('src/pages/Penzugy.tsx');expect(p).toContain('TransactionTraceForensics.css');expect(p).toContain('/finance/transaction-trace')});

test('system status includes transaction trace health panel',()=>{const panel=read('src/pages/TransactionTraceHealthPanel.tsx');const page=read('src/pages/SystemHealthPage.tsx');for(const marker of ['Transaction Trace Health','HMAC CHECKPOINT','WATCHDOG','/trace/health'])expect(panel).toContain(marker);expect(page).toContain('TransactionTraceHealthPanel')});
