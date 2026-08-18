import fs from 'fs';
import path from 'path';

describe('Sidebar VIR label overrides', () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'src/components/Sidebar.tsx'), 'utf8');

  it('does not rename every employee/HR submenu to the same custom label', () => {
    expect(src).not.toContain("if(key==='employees'&&labels.employees)return labels.employees");
    expect(src).toContain("if(r==='/employees'&&labels.employees)return labels.employees");
  });

  it('does not rename every CRM submenu to the same custom label', () => {
    expect(src).not.toContain("if(key==='clients'&&labels.clients)return labels.clients");
    expect(src).toContain("(r==='/modules/customers/clients'||r==='/clients')&&labels.clients");
  });

  it('supports top-level module overrides by menu code', () => {
    expect(src).toContain("item.code==='team'?labels.employees");
    expect(src).toContain("item.code==='customers'?labels.clients");
  });
});
