import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const apiBase = process.env.E2E_API_URL || 'http://localhost:5000';

// This flow intentionally mutates a single deterministic appointment through
// finalization and archiving. Retrying against the same fixture would exercise
// a different already-finalized state, so keep this test single-attempt.
test.describe.configure({ retries: 0 });

test('recepciós munkalap kiadás: időpont → fizetés → készlet → archiválás → PDF', async ({ page, context, request }) => {
  const fixtureResponse = await request.get(`${apiBase}/__e2e/fixture`);
  expect(fixtureResponse.ok()).toBeTruthy();
  const fixture = await fixtureResponse.json();

  await context.addCookies([{
    name: 'token',
    value: fixture.token,
    url: 'http://localhost:5000',
    httpOnly: true,
    sameSite: 'Lax',
    secure: false,
  }]);

  await page.addInitScript(({ locationId, employeeId }) => {
    localStorage.setItem('kleo_cookie_session', 'active');
    localStorage.setItem('kleo_role', 'admin');
    localStorage.setItem('kleo_location_id', locationId);
    localStorage.setItem('kleo_location_name', 'E2E Szalon');
    localStorage.setItem('kleo_full_name', 'E2E Recepciós');
    localStorage.setItem('kleo_account_type', 'employee');
    localStorage.setItem('email', 'e2e.reception@test.local');
    localStorage.setItem('userId', employeeId);
    localStorage.setItem('kleo_last_activity_at', String(Date.now()));
    localStorage.setItem('kleo_selected_location_id', locationId);
    localStorage.setItem('kleo_user', JSON.stringify({
      id: employeeId,
      employee_id: employeeId,
      email: 'e2e.reception@test.local',
      full_name: 'E2E Recepciós',
      role: ['admin'],
      location_id: locationId,
    }));
  }, { locationId: fixture.location_id, employeeId: fixture.employee_id });

  const failedCoreResponses: string[] = [];
  const failedRequests: string[] = [];
  const responseDiagnostics: Promise<void>[] = [];
  page.on('requestfailed', requestItem => failedRequests.push(`${requestItem.method()} ${requestItem.url()} ${requestItem.failure()?.errorText || ''}`));
  page.on('response', response => {
    if (response.url().includes('/api/') && response.status() >= 400 && (
      response.url().includes('/booking-workorder/') ||
      response.url().includes('/workorders/') ||
      response.url().includes('/workorder-finalization/') ||
      response.url().includes('/cashier/')
    )) {
      const diagnostic = response.text()
        .then(body => {
          const compactBody = body.replace(/\s+/g, ' ').trim().slice(0, 1200);
          failedCoreResponses.push(`${response.status()} ${response.url()}${compactBody ? ` :: ${compactBody}` : ''}`);
        })
        .catch(() => {
          failedCoreResponses.push(`${response.status()} ${response.url()}`);
        });
      responseDiagnostics.push(diagnostic);
    }
  });

  await page.goto(`/workorders/new?appointment_id=${encodeURIComponent(fixture.appointment_id)}`);
  await expect(page).toHaveURL(/\/workorders\/[0-9a-f-]+(?:\?|$)/i, { timeout: 30_000 });
  const workOrderId = new URL(page.url()).pathname.split('/').filter(Boolean).pop()!;
  expect(workOrderId).toMatch(/^[0-9a-f-]{36}$/i);

  await expect(page.getByRole('heading', { name: /munkalap/i }).first()).toBeVisible();
  await expect(page.getByText('Fizetésre kész')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('E2E Vendég', { exact: true })).toBeVisible();
  await expect(page.getByText('E2E hajkezelés', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Hátralék kitöltése' }).click();
  const finalizeButton = page.getByRole('button', { name: 'Fizetés és munkalap végleges lezárása' });
  await expect(finalizeButton).toBeEnabled();

  page.once('dialog', dialog => dialog.accept());
  await finalizeButton.click();

  await expect(page.getByText('Lezárt és archivált', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('heading', { name: /^KLEO-ML-2026-\d{6}$/ })).toBeVisible();

  let stateResponse = await request.get(`${apiBase}/__e2e/state/${workOrderId}`);
  expect(stateResponse.ok()).toBeTruthy();
  let state = await stateResponse.json();
  expect(state.workOrder.status).toBe('completed');
  expect(state.workOrder.document_status).toBe('completed');
  expect(state.workOrder.payment_status).toBe('paid');
  expect(state.workOrder.financial_closed_at).toBeTruthy();
  expect(state.workOrder.stock_consumed_at).toBeTruthy();
  expect(state.workOrder.locked_at).toBeTruthy();
  expect(state.workOrder.archived_at).toBeTruthy();
  expect(state.appointment.status).toBe('completed');
  expect(state.appointment.work_order_id).toBe(workOrderId);
  expect(state.stock).toBe(fixture.expected_stock);
  expect(state.movementCount).toBe(1);
  expect(state.archive?.snapshot_hash).toBeTruthy();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDF letöltése' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^KLEO-ML-2026-\d{6}\.pdf$/);
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const pdf = await fs.readFile(downloadPath!);
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(1000);
  await expect(page.getByText('A lezárt munkalap PDF elkészült és letöltésre került.')).toBeVisible();

  stateResponse = await request.get(`${apiBase}/__e2e/state/${workOrderId}`);
  state = await stateResponse.json();
  expect(state.stock).toBe(fixture.expected_stock);
  expect(state.movementCount).toBe(1);
  expect(state.archive?.pdf_generated_at).toBeTruthy();

  await Promise.allSettled(responseDiagnostics);
  expect(failedRequests, `Hálózati hibák: ${failedRequests.join(', ')}`).toEqual([]);
  expect(failedCoreResponses, `Core API hibák: ${failedCoreResponses.join(', ')}`).toEqual([]);
});
