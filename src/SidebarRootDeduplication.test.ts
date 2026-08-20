import fs from 'fs';
import path from 'path';

const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

describe('admin sidebar root deduplication',()=>{
  const sidebar=read('src/components/Sidebar.tsx');
  const adminMenu=read('src/config/adminMenu.ts');

  it('keeps one canonical SaaS, franchise and management root',()=>{
    expect((adminMenu.match(/code:'saas\.admin'/g)||[]).length).toBe(1);
    expect((adminMenu.match(/code:'franchise\.admin'/g)||[]).length).toBe(1);
    expect((adminMenu.match(/code:'management\.tools'/g)||[]).length).toBe(1);
  });

  it('does not append fallback root groups when the canonical group already exists',()=>{
    expect(sidebar).toContain("code:'management.tools'");
    expect(sidebar).toContain('function hasRootGroup');
    expect(sidebar).toContain('!hasRootGroup(combined,MANAGEMENT_TOOLS)');
    expect(sidebar).toContain('!hasRootGroup(combined,FRANCHISE_ADMIN_TOOLS)');
    expect(sidebar).toContain('!hasRootGroup(combined,SAAS_ADMIN_TOOLS)');
    expect(sidebar).not.toContain('combined=stripRoutes');
  });
});
