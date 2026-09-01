const path = require('node:path');
const { createRequire } = require('node:module');

const backendDir = path.resolve(process.env.KLEO_BACKEND_DIR || path.join(process.cwd(), 'backend'));
const backendRequire = createRequire(path.join(backendDir, 'package.json'));
const express = backendRequire('express');
const cookieParser = backendRequire('cookie-parser');
const cors = backendRequire('cors');
const jwt = backendRequire('jsonwebtoken');
const { pool } = backendRequire('./dist/db');
const { ensureWorkOrderWorkflow } = backendRequire('./dist/workorders/ensureWorkOrderWorkflow');
const bookingWorkOrderBridge = backendRequire('./dist/routes/bookingWorkOrderBridge').default;
const workOrderEditorFast = backendRequire('./dist/routes/workOrderEditorFast').default;
const workOrderEditor = backendRequire('./dist/routes/workOrderEditor').default;
const workOrderMaterials = backendRequire('./dist/routes/workOrderMaterials').default;
const cashier = backendRequire('./dist/routes/cashier').default;
const finalizationFast = backendRequire('./dist/routes/workOrderFinalizationFast').default;
const finalization = backendRequire('./dist/routes/workOrderFinalization').default;
const workordersScoped = backendRequire('./dist/routes/workordersScoped').default;
const receiptCompliance = backendRequire('./dist/routes/receiptCompliance').default;
const me = backendRequire('./dist/routes/me').default;
const accessControl = backendRequire('./dist/routes/accessControl').default;

const PORT = Number(process.env.PORT || 4010);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:4173';
const JWT_SECRET = process.env.JWT_SECRET || 'workorder-browser-e2e-secret';

async function q(sql, params = []) { return pool.query(sql, params); }

async function seedFixture() {
  await ensureWorkOrderWorkflow(pool);
  await q(`
    CREATE TABLE IF NOT EXISTS service_material_requirements(
      id bigserial PRIMARY KEY,
      service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      default_quantity numeric(14,3) NOT NULL DEFAULT 1,
      unit text NOT NULL DEFAULT 'db',
      required boolean NOT NULL DEFAULT true,
      active boolean NOT NULL DEFAULT true,
      note text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(service_id,product_id)
    )
  `);
  const seeded = await q(`
    WITH l AS (
      INSERT INTO locations(name,city,address)
      VALUES('E2E Recepció Szalon','Budapest','E2E teszt utca 1')
      RETURNING id
    ), e AS (
      INSERT INTO employees(full_name,email,location_id,active)
      SELECT 'E2E Recepciós','e2e.reception@test.local',id,true FROM l
      RETURNING id,location_id
    ), c AS (
      INSERT INTO clients(name,full_name,email,phone,location_id)
      SELECT 'E2E Vendég','E2E Vendég','e2e.customer@test.local','+3612345678',id FROM l
      RETURNING id,location_id
    ), s AS (
      INSERT INTO services(name,base_price,list_price,duration_minutes)
      VALUES('E2E hajkezelés',10000,10000,45)
      RETURNING id
    ), p AS (
      INSERT INTO products(name,retail_price_gross)
      VALUES('E2E fogyóanyag',1500)
      RETURNING id
    ), sl AS (
      INSERT INTO service_locations(service_id,location_id)
      SELECT s.id,l.id FROM s,l
    ), eo AS (
      INSERT INTO employee_service_overrides(employee_id,service_id,custom_price,custom_duration_minutes)
      SELECT e.id,s.id,10000,45 FROM e,s
    ), ps AS (
      INSERT INTO product_stock_balances(product_id,location_id,quantity)
      SELECT p.id,l.id,10 FROM p,l
    ), a AS (
      INSERT INTO appointments(location_id,employee_id,client_id,title,start_time,end_time,status)
      SELECT l.id,e.id,c.id,'E2E munkalap kiadás',now()+interval '10 minute',now()+interval '55 minute','booked'
      FROM l,e,c
      RETURNING id
    )
    SELECT l.id AS location_id,e.id AS employee_id,c.id AS client_id,s.id AS service_id,
           p.id AS product_id,a.id AS appointment_id
      FROM l,e,c,s,p,a
  `);
  const f = seeded.rows[0];

  await q(`
    INSERT INTO cash_register_shifts(
      location_id,location_name,business_date,status,opening_cash,opened_by,current_cashier
    )
    VALUES($1,'E2E Recepció Szalon',CURRENT_DATE,'open',0,'workorder-e2e','e2e.reception@test.local')
    ON CONFLICT DO NOTHING
  `, [String(f.location_id)]);

  await q(`
    INSERT INTO appointment_services(appointment_id,service_id,duration_minutes,price,discount_percent,sort_order)
    VALUES($1,$2,45,10000,0,0)
  `, [f.appointment_id, f.service_id]);

  await q(`
    INSERT INTO service_material_requirements(service_id,product_id,default_quantity,unit,required,active,note)
    VALUES($1,$2,1,'db',false,true,'Browser E2E anyagnorma')
    ON CONFLICT(service_id,product_id)
    DO UPDATE SET default_quantity=EXCLUDED.default_quantity,required=false,active=true,note=EXCLUDED.note
  `, [f.service_id, f.product_id]);

  const token = jwt.sign({
    id: String(f.employee_id),
    userId: String(f.employee_id),
    employee_id: String(f.employee_id),
    email: 'e2e.reception@test.local',
    login_name: 'e2e-reception',
    role: ['admin'],
    location_id: String(f.location_id),
  }, JWT_SECRET, { expiresIn: '1h' });

  return {
    ...f,
    location_id: String(f.location_id),
    employee_id: String(f.employee_id),
    client_id: String(f.client_id),
    service_id: String(f.service_id),
    product_id: String(f.product_id),
    appointment_id: String(f.appointment_id),
    token,
    initial_stock: 10,
    expected_stock: 9,
  };
}

async function main() {
  const fixture = await seedFixture();
  const app = express();
  app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '8mb' }));
  app.use(cookieParser());

  app.use('/api/me', me);
  app.use('/api/access-control', accessControl);
  app.use('/api/transactions/booking-workorder', bookingWorkOrderBridge);
  app.use('/api/transactions/workorder-editor', workOrderEditorFast);
  app.use('/api/transactions/workorder-editor', workOrderEditor);
  app.use('/api/transactions/workorder-materials', workOrderMaterials);
  app.use('/api/transactions/cashier', cashier);
  app.use('/api/transactions/workorder-finalization', finalizationFast);
  app.use('/api/transactions/workorder-finalization', finalization);
  app.use('/api/workorders', workordersScoped);
  app.use('/api/vir/receipt-compliance', receiptCompliance);

  app.get('/__e2e/fixture', (_req, res) => res.json(fixture));
  app.get('/__e2e/state/:workOrderId', async (req, res, next) => {
    try {
      const workOrderId = String(req.params.workOrderId);
      const workOrder = (await q(`
        SELECT id::text,work_order_number,status,document_status,payment_status,
               financial_closed_at,stock_consumed_at,locked_at,archived_at
          FROM work_orders WHERE id::text=$1 LIMIT 1
      `, [workOrderId])).rows[0] || null;
      const appointment = (await q(`SELECT status,work_order_id::text FROM appointments WHERE id=$1`, [fixture.appointment_id])).rows[0] || null;
      const stock = (await q(`SELECT quantity FROM product_stock_balances WHERE product_id=$1 AND location_id=$2`, [fixture.product_id, fixture.location_id])).rows[0] || null;
      const movementCount = Number((await q(`SELECT count(*) n FROM inventory_movements WHERE work_order_id::text=$1 AND movement_type='work_order_consumption'`, [workOrderId])).rows[0]?.n || 0);
      const archive = (await q(`SELECT work_order_number,snapshot_hash,pdf_generated_at FROM work_order_archive WHERE work_order_id::text=$1 ORDER BY archived_at DESC LIMIT 1`, [workOrderId])).rows[0] || null;
      res.json({ workOrder, appointment, stock: Number(stock?.quantity ?? 0), movementCount, archive });
    } catch (error) { next(error); }
  });

  app.use((err, _req, res, _next) => {
    console.error('[workorder-browser-e2e] route error', err);
    res.status(500).json({ message: err?.message || String(err), code: err?.code || null });
  });

  const server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`WORKORDER BROWSER E2E SERVER READY http://127.0.0.1:${PORT}`);
    console.log(`E2E APPOINTMENT ${fixture.appointment_id}`);
  });

  const shutdown = async () => {
    await new Promise(resolve => server.close(resolve));
    await pool.end();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch(async error => {
  console.error('WORKORDER BROWSER E2E SERVER FAIL', error);
  try { await pool.end(); } catch {}
  process.exit(1);
});