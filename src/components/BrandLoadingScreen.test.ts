import fs from"fs";import path from"path";
const component=fs.readFileSync(path.join(__dirname,"BrandLoadingScreen.tsx"),"utf8"),css=fs.readFileSync(path.join(__dirname,"BrandLoadingScreen.css"),"utf8");
test("branded loader keeps the logo and model on separate responsive panels",()=>{expect(component).toContain("kleopatra-logo.png");expect(component).toContain("Minden ami szépség, csak Neked!");expect(component).toContain("Az élmény betöltése");expect(css).toContain("kleopatra-brand-model-loader-v1.webp");expect(css).toContain("grid-column:2");expect(css).toContain("grid-row:2")});
