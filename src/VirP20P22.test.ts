import fs from 'fs';
import {describe,it,expect} from 'vitest';
const api=fs.readFileSync('src/api/virP19.ts','utf8');
const page=fs.readFileSync('src/pages/VirP19Page.tsx','utf8');
const panel=fs.readFileSync('src/pages/VirP20P22Panel.tsx','utf8');

describe('VIR predictive learning loop',()=>{
  it('exposes the validation recommendation and feedback API surfaces',()=>{for(const route of ['/vir/p20/status','/vir/p20/run','/vir/p21/status','/vir/p21/generate','/vir/p22/status','/vir/p22/sync','/vir/p22/policy'])expect(api).toContain(route)});
  it('keeps the validated model recommendation and feedback layers inside the predictive workspace',()=>{expect(page).toContain('VirP20P22Panel');expect(panel).toContain('Validált prediktív modell');expect(panel).toContain('AI vezetői döntéstámogatás');expect(panel).toContain('Zárt visszacsatolású tanulás')});
  it('shows validation evidence',()=>{expect(panel).toContain('MAPE');expect(panel).toContain('prediction interval');expect(panel).toContain('runP20Model')});
  it('routes recommendation execution intent into governed approval',()=>{expect(panel).toContain('/admin/vir/p17');expect(panel).toContain('promoteP21Decision');expect(panel).toContain('Jóváhagyásra küldés');expect(panel).toContain('Approval center')});
  it('makes feedback learning visible without autonomous production mutation',()=>{expect(panel).toContain('Closed-loop learning');expect(panel).toContain('evaluateP22Cycle');expect(panel).toContain('éles üzleti adatot nem ír át');expect(panel).toContain('does not mutate production business data')});
});