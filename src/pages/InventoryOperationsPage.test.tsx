import fs from"fs";import path from"path";

describe("Inventory operations v4 workspace",()=>{const page=fs.readFileSync(path.join(process.cwd(),"src/pages/InventoryOperationsPage.tsx"),"utf8");const app=fs.readFileSync(path.join(process.cwd(),"src/App.tsx"),"utf8");
 test("exposes the complete warehouse workflow",()=>{for(const text of["Készletműveletek","Leltár","Áthelyezések","Raktárak","Utánrendelés","Anyagjegyzék","Beállítások","Riportok"])expect(page).toContain(text)});
 test("supports Altegio-style stock operations and barcode stocktake",()=>{expect(page).toContain('operation_type:operationType');expect(page).toContain('value="receipt"');expect(page).toContain('value="sale"');expect(page).toContain('value="writeoff"');expect(page).toContain('/scan');expect(page).toContain('Vonalkód / cikkszám beolvasása')});
 test("supports critical and optimal inventory plus costing settings",()=>{expect(page).toContain("optimal_quantity");expect(page).toContain("prevent_negative_stock");expect(page).toContain("weighted_average");expect(page).toContain("latest_receipt");expect(page).toContain("product_cost")});
 test("supports service bill of materials",()=>{expect(page).toContain('/api/transactions/inventory/ops/bom');expect(page).toContain("default_quantity");expect(page).toContain("Mértékegység")});
 test("route is wired into application",()=>{expect(app).toContain("InventoryOperationsPage");expect(app).toContain('/warehouse/operations')});
});
