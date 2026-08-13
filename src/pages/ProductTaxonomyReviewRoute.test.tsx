import fs from"fs";import path from"path";
const app=fs.readFileSync(path.join(process.cwd(),"src/App.tsx"),"utf8");
test("taxonomy review has a dedicated management route before product wildcard",()=>{const route=app.indexOf('/masterdata/products/taxonomy-review');const wildcard=app.indexOf('/masterdata/products/*');expect(route).toBeGreaterThanOrEqual(0);expect(wildcard).toBeGreaterThan(route);expect(app).toMatch(/R\(MANAGEMENT,\s*<ProductTaxonomyReviewPage\s*\/>\)/);expect(app).toContain('import("./pages/ProductTaxonomyReviewPage")')});
