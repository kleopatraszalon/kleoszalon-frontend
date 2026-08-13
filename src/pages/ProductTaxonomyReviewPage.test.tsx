import fs from"fs";import path from"path";
const page=fs.readFileSync(path.join(process.cwd(),"src/pages/ProductTaxonomyReviewPage.tsx"),"utf8");
test("taxonomy review page exposes review queues and KPIs",()=>{expect(page).toContain("Termékbesorolás ellenőrzése");expect(page).toContain("Alacsony bizonyosság");expect(page).toContain("„Egyéb” fallback");expect(page).toContain("Nincs besorolva");expect(page).toContain("Kézzel ellenőrzött")});
test("taxonomy review supports manual audited approval",()=>{expect(page).toContain("products/taxonomy/review/");expect(page).toContain("Jóváhagyás");expect(page).toContain("Miért módosult?");expect(page).toContain("product_group_id");expect(page).toContain("product_category_id")});
test("taxonomy review supports rebuild and source context",()=>{expect(page).toContain("products/taxonomy/rebuild");expect(page).toContain("Automatikus újrabesorolás");expect(page).toContain("Eredeti:");expect(page).toContain("source_category_name")});
