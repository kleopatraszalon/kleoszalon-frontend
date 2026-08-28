import fs from"fs";import path from"path";
const routes=fs.readFileSync(path.join(process.cwd(),"src/routing/inventoryRoutes.tsx"),"utf8");
const pages=fs.readFileSync(path.join(process.cwd(),"src/routing/routePages.ts"),"utf8");
test("taxonomy review has a dedicated management route before product wildcard",()=>{const route=routes.indexOf('/masterdata/products/taxonomy-review');const wildcard=routes.indexOf('/masterdata/products/*');expect(route).toBeGreaterThanOrEqual(0);expect(wildcard).toBeGreaterThan(route);expect(routes).toMatch(/R\(MANAGEMENT,\s*<ProductTaxonomyReviewPage\s*\/>\)/);expect(pages).toContain('import("../pages/ProductTaxonomyReviewPage")')});
