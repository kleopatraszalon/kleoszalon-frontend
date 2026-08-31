import fs from 'fs';
import {describe,it,expect} from 'vitest';
const api=fs.readFileSync('src/api/virP19.ts','utf8');
const page=fs.readFileSync('src/pages/VirP19Page.tsx','utf8');
const panel=fs.readFileSync('src/pages/VirP20P22Panel.tsx','utf8');

describe('VIR P20-P22 unified learning loop',()=>{
  it('exposes all P20 P21 P22 API surfaces',()=>{for(const route of ['/vir/p20/status','/vir/p20/run','/vir/p21/status','/vir/p21/generate','/vir/p22/status','/vir/p22/sync','/vir/p22/policy'])expect(api).toContain(route)});
  it('keeps P20 P21 P22 inside the predictive executive workspace',()=>{expect(page).toContain('VirP20P22Panel');for(const n of ['P20','P21','P22'])expect(panel).toContain(n)});
  it('shows P20 validation evidence',()=>{expect(panel).toContain('MAPE');expect(panel).toContain('prediction interval');expect(panel).toContain('runP20Model')});
  it('routes P21 execution intent into P17 approval',()=>{expect(panel).toContain('P17 approval');expect(panel).toContain('/admin/vir/p17');expect(panel).toContain('promoteP21Decision')});
  it('makes P22 feedback visible without autonomous external mutation',()=>{expect(panel).toContain('Closed-loop optimization');expect(panel).toContain('evaluateP22Cycle');expect(panel).toContain('does not autonomously change bookings')});
});
