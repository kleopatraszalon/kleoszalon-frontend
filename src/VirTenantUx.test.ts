import fs from 'fs';
import {describe,it,expect} from 'vitest';
const picker=fs.readFileSync('src/components/VirSearchSelect.tsx','utf8');
const api=fs.readFileSync('src/api/virLookups.ts','utf8');
const p8=fs.readFileSync('src/pages/VirP8Page.tsx','utf8');
const p9=fs.readFileSync('src/pages/VirP9Page.tsx','utf8');
const p10=fs.readFileSync('src/pages/VirP10Page.tsx','utf8');
const p11=fs.readFileSync('src/pages/VirP11Page.tsx','utf8');
const p12=fs.readFileSync('src/pages/VirP12Page.tsx','utf8');
const p13=fs.readFileSync('src/pages/VirP13Page.tsx','utf8');
const p15=fs.readFileSync('src/pages/VirP15Page.tsx','utf8');

describe('VIR searchable data selection and understandable UX',()=>{
 it('provides tenant scoped lookup clients',()=>{for(const x of ['/vir/lookups/clients','/vir/lookups/locations','/vir/lookups/work-orders'])expect(api).toContain(x)});
 it('has reusable searchable dropdown behavior',()=>{expect(picker).toContain('searchVirLookup');expect(picker).toContain('Kezdj el gépelni');expect(picker).toContain('vir-search-menu')});
 it('replaces raw location inputs with searchable location selectors',()=>{for(const page of [p8,p9,p10,p11,p15])expect(page).toContain('kind="locations"')});
 it('replaces raw client UUID inputs with searchable client selectors',()=>{for(const page of [p11,p12,p13])expect(page).toContain('kind="clients"');expect(p11).toContain('kind="work-orders"')});
 it('does not ask users to type UUIDs on redesigned pages',()=>{for(const page of [p10,p11,p12,p13,p15])expect(page).not.toContain('placeholder="Vendég UUID');expect(p11).not.toContain('Telephely UUID')});
});
