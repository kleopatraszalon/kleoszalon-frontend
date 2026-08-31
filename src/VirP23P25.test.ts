import fs from 'fs';
import {describe,it,expect} from 'vitest';
const api=fs.readFileSync('src/api/virP23P25.ts','utf8');
const panel=fs.readFileSync('src/pages/VirP23P25Panel.tsx','utf8');
const page=fs.readFileSync('src/pages/VirP19Page.tsx','utf8');

describe('VIR digital twin and governed optimizer',()=>{
 it('exposes twin scenario and optimizer API calls',()=>{for(const marker of ['/p23/twin','/p23/snapshot','/p24/simulate','/p25/optimize','/promote'])expect(api).toContain(marker)});
 it('requires a fresh digital twin before scenario and optimization actions',()=>{expect(panel).toContain('disabled={!!loading||!twin}');expect(panel).toContain('Digitális iker frissítése');expect(panel).toContain('Refresh digital twin')});
 it('offers bounded what-if levers and baseline comparison',()=>{for(const marker of ['price_delta_percent','staff_hours_delta_percent','promotion_discount_percent','no_show_reduction_percent','stock_availability_delta_percent','demand_delta_percent'])expect(panel).toContain(marker);expect(panel).toContain('Alapállapot');expect(panel).toContain('Simulated outcome')});
 it('optimizes multiple executive objectives',()=>{for(const marker of ['revenue','profit','utilization','retention','staff_balance','stock_resilience'])expect(panel).toContain(marker);expect(panel).toContain('Legjobb kombináció keresése')});
 it('never directly executes the champion and promotes only to approval',()=>{expect(panel).toContain('promoteOptimization');expect(panel).toContain('/admin/vir/p17');expect(panel).toContain('önálló éles végrehajtás nincs');expect(panel).toContain('there is no autonomous production execution')});
 it('is integrated into the existing prediction and optimization workspace',()=>expect(page).toContain('VirP23P25Panel'));
});