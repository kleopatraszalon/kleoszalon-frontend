import { inventoryLotRedirectTarget } from "./api";

describe("inventory LOT workflow redirect", () => {
  test("generic LOT receipt error opens the sarzs page with warehouse and product context", () => {
    const target=inventoryLotRedirectTarget({
      response:{data:{code:"INVENTORY_EXPIRY_REQUIRED"}},
      config:{
        url:"/transactions/inventory/ops/operations",
        data:JSON.stringify({warehouse_id:"12",items:[{product_id:"11111111-1111-4111-8111-111111111111"}]})
      }
    });
    expect(target).toBe("/warehouse/lots?warehouse_id=12&product_id=11111111-1111-4111-8111-111111111111&from=operations");
  });

  test("LOT stocktake reconciliation opens the sarzs workflow", () => {
    const target=inventoryLotRedirectTarget({
      response:{data:{code:"INVENTORY_LOT_STOCKTAKE_RECONCILIATION_REQUIRED"}},
      config:{url:"/transactions/inventory/ops/stocktakes/42/approve"}
    });
    expect(target).toBe("/warehouse/lots?stocktake_id=42&from=stocktake");
  });

  test("ordinary inventory errors do not redirect", () => {
    const target=inventoryLotRedirectTarget({
      response:{data:{code:"INVENTORY_INSUFFICIENT_STOCK"}},
      config:{url:"/transactions/inventory/ops/operations"}
    });
    expect(target).toBeNull();
  });
});
