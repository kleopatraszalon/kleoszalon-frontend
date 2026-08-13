import fs from"fs";import path from"path";
const component=fs.readFileSync(path.join(__dirname,"BrandLoadingScreen.tsx"),"utf8"),css=fs.readFileSync(path.join(__dirname,"BrandLoadingScreen.css"),"utf8");
test("branded loader has logo slogan progress and generated model image",()=>{expect(component).toContain("kleopatra-logo.png");expect(component).toContain("Minden ami szépség, csak Neked!");expect(component).toContain("Az élmény betöltése");expect(css).toContain("kleopatra-brand-model-loader-v1.webp")});
