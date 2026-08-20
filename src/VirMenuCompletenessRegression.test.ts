import fs from 'fs';
import path from 'path';

describe('VIR complete menu regression', () => {
  const customization = fs.readFileSync(path.join(process.cwd(), 'src/utils/virCustomization.ts'), 'utf8');
  const layout = fs.readFileSync(path.join(process.cwd(), 'src/layouts/AppLayout.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(process.cwd(), 'src/layouts/AppLayout.css'), 'utf8');
  const mobileCss = fs.readFileSync(path.join(process.cwd(), 'src/layouts/MobileSidebarFix.css'), 'utf8');

  it('does not let stale client customization hide backend-authorized menu items', () => {
    expect(customization).toContain('export function menuEnabled(_config:VirCustomization|null|undefined,_key:string,_defaultValue=true){return true}');
  });

  it('keeps sidebar visibility controlled only by the explicit toggle', () => {
    expect(layout).toContain('const toggleSidebar = () => setCollapsed(v=>!v);');
    expect(layout).not.toContain('setMobileOpen(!collapsed)');
    expect(layout).not.toContain('is-mobile-sidebar-open');
  });

  it('keeps all menu items reachable with vertical scrolling on desktop and mobile', () => {
    expect(css).toContain('overflow-y: auto;');
    expect(mobileCss).toContain('overflow-y: auto !important;');
  });
});
