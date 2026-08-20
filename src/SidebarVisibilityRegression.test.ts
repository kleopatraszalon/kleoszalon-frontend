import fs from 'fs';
import path from 'path';

describe('VIR sidebar visibility regression', () => {
  const layout = fs.readFileSync(path.join(process.cwd(), 'src/layouts/AppLayout.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(process.cwd(), 'src/layouts/AppLayout.css'), 'utf8');
  const mobileCss = fs.readFileSync(path.join(process.cwd(), 'src/layouts/MobileSidebarFix.css'), 'utf8');

  it('uses one persisted visibility source on desktop and mobile', () => {
    expect(layout).toContain('const [collapsed, setCollapsed]');
    expect(layout).not.toContain('const [mobileOpen, setMobileOpen]');
    expect(layout).not.toContain('setMobileOpen(!collapsed)');
    expect(layout).toContain('const toggleSidebar = () => setCollapsed(v=>!v);');
    expect(layout).not.toContain('window.matchMedia("(max-width: 900px)").matches ? setMobileOpen');
    expect(layout).not.toContain('is-mobile-sidebar-open');
  });

  it('does not auto-close the menu when navigation or resolution changes', () => {
    expect(layout).not.toContain('useEffect(() => { setMobileOpen(false); }, [location.pathname, location.search]);');
    expect(layout).not.toContain('addEventListener("resize"');
  });

  it('keeps the full menu vertically reachable at every supported viewport', () => {
    expect(css).toContain('overflow-y: auto;');
    expect(css).toContain('height: 100dvh !important;');
    expect(mobileCss).toContain('overflow-y: auto !important;');
    expect(mobileCss).toContain('max-height: 100dvh !important;');
  });
});
