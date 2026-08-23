import fs from 'node:fs';
import path from 'node:path';

describe('SaaS / Franchise admin wiring', () => {
  const app = fs.readFileSync(path.join(__dirname, 'App.tsx'), 'utf8');
  const sidebar = fs.readFileSync(path.join(__dirname, 'components/Sidebar.tsx'), 'utf8');
  const page = fs.readFileSync(path.join(__dirname, 'pages/SaasFranchiseAdminPage.tsx'), 'utf8');
  const core = fs.readFileSync(path.join(__dirname, 'pages/SaasFranchiseAdminCorePage.tsx'), 'utf8');
  const settlements = fs.readFileSync(path.join(__dirname, 'pages/FranchiseSettlementPanel.tsx'), 'utf8');

  test('admin-only route is registered', () => {
    expect(app).toContain('const SaasFranchiseAdminPage = lazy');
    expect(app).toContain('path: "/admin/saas"');
    expect(app).toContain('R(ADMIN, <SaasFranchiseAdminPage />)');
  });

  test('privileged menu entries are backend-driven while location-scoped extras stay restricted', () => {
    expect(sidebar).toContain('axios.get(');
    expect(sidebar).toContain('/menus');
    expect(sidebar).toContain('tree=buildTree');
    expect(sidebar).toContain('if(isCustomer||isAccounting||isLocationScoped||isStaff||isHr||isManager)return');
    expect(sidebar).toContain('const RECEIPT_COMPLIANCE');
    expect(sidebar).toContain('const FITNESS_GYONGYOS');
    expect(sidebar).toContain('...(fitnessAllowed?[FITNESS_GYONGYOS]:[])');
    expect(sidebar).toContain('/vir/fitness/access');
    const locationMenu=sidebar.split('const LOCATION')[1]?.split('const ACCOUNTING')[0]||'';
    expect(locationMenu).not.toContain('/admin/saas');
  });

  test('page composes stable core configuration with settlement finance panel', () => {
    expect(page).toContain('SaasFranchiseAdminCorePage');
    expect(page).toContain('FranchiseSettlementPanel');
  });

  test('core consumes tenant, location, franchise and subscription APIs', () => {
    expect(core).toContain('/saas/context');
    expect(core).toContain('/saas/locations');
    expect(core).toContain('/saas/franchise-networks');
    expect(core).toContain('/saas/subscription');
    expect(core).toContain('/saas/subscription/change-plan');
    expect(core).toContain('/saas/subscription/cancel');
    expect(core).toContain('/saas/subscription/reactivate');
  });

  test('subscription controls preserve provider and tenant-role safety', () => {
    expect(core).toContain('external_subscription_id');
    expect(core).toContain("['owner','admin'].includes");
    expect(core).toContain('at_period_end:true');
    expect(core).not.toContain('at_period_end:false');
  });

  test('franchise finance summary does not invent booked revenue before ledger integration', () => {
    expect(core).toContain('Franchise pénzügyi összesítő');
    expect(core).toContain('Súlyozott royalty');
    expect(core).toContain('nem könyvel tényleges royalty-bevételt');
  });

  test('monthly settlements use audited backend state transitions and currency-safe summary', () => {
    expect(settlements).toContain('/saas/franchise-finance/summary');
    expect(settlements).toContain('/saas/franchise-finance/settlements/generate');
    expect(settlements).toContain('/approve');
    expect(settlements).toContain('/mark-paid');
    expect(settlements).toContain('summary_by_currency');
    expect(settlements).toContain('payment_reference');
    expect(settlements).toContain("['owner','admin'].includes");
  });

  test('approved settlements support receivable posting with an explicit due date', () => {
    expect(settlements).toContain('/saas/franchise-accounting/receivables?period=');
    expect(settlements).toContain('/post-receivable');
    expect(settlements).toContain('due_date');
    expect(settlements).toContain('Fizetési határidő');
    expect(settlements).toContain('Követelés könyvelése');
  });

  test('partner billing and VAT can be edited before invoice draft creation', () => {
    expect(settlements).toContain(['/members/','$','{billingReceivable.franchise_member_id}/billing'].join(''));
    expect(settlements).toContain('Partneradatok / ÁFA');
    expect(settlements).toContain('Franchise partner számlázási adatai');
    expect(settlements).toContain('billing_vat_rate:vat');
    expect(settlements).toContain('ÁFA %');
    expect(settlements).toContain('Partneradatok mentése');
  });

  test('invoice draft is explicit, guarded and never presented as an automatically issued invoice', () => {
    expect(settlements).toContain('/create-invoice-draft');
    expect(settlements).toContain('FRANCHISE_VAT_RATE_REQUIRED');
    expect(settlements).toContain('FRANCHISE_BILLING_INCOMPLETE');
    expect(settlements).toContain('pénzügyi ellenőrzés szükséges');
    expect(settlements).toContain('nem kerül automatikusan NAV-beküldésre vagy kiállításra');
  });

  test('service royalty wording uses official invoice net basis and excludes tips', () => {
    expect(settlements).toContain('hivatalosan kiállított munkalap-számla nettó összege');
    expect(settlements).toContain('borravaló nem része az alapnak');
  });
});