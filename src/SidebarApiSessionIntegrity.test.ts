import fs from 'fs';
import path from 'path';

const source=fs.readFileSync(path.join(process.cwd(),'src/components/Sidebar.tsx'),'utf8');

describe('Sidebar API session integrity',()=>{
  it('uses the canonical API client for menu and fitness access',()=>{
    expect(source).toContain("import api from'../api'");
    expect(source).toContain("api.get('/vir/fitness/access')");
    expect(source).toContain("api.get('/menus')");
  });

  it('does not build authorization from legacy localStorage tokens',()=>{
    expect(source).not.toContain("localStorage.getItem('token')");
    expect(source).not.toContain("localStorage.getItem('kleo_token')");
    expect(source).not.toContain("import axios from'axios'");
  });

  it('does not hard-code a second API origin inside the sidebar',()=>{
    expect(source).not.toContain('const API_BASE=');
    expect(source).not.toContain('kleoszalon-api-1.onrender.com/api');
  });
});
