import fs from"fs";
import path from"path";

const srcRoot=path.join(__dirname,"..");
function walk(dir:string):string[]{return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=path.join(dir,e.name);return e.isDirectory()?walk(p):[p]})}

describe("HU/EN completeness audit",()=>{
 test("central HU and EN dictionaries expose exactly the same translation keys",()=>{
  const source=fs.readFileSync(path.join(__dirname,"LanguageProvider.tsx"),"utf8");
  const hu=source.match(/const HU:Dictionary=\{([\s\S]*?)\n\};\n\nconst EN:Dictionary=/)?.[1]||"";
  const en=source.match(/const EN:Dictionary=\{([\s\S]*?)\n\};/)?.[1]||"";
  const keys=(s:string)=>Array.from(s.matchAll(/"([a-z0-9_.-]+)"\s*:/gi)).map(m=>m[1]).sort();
  expect(keys(hu)).toEqual(keys(en));
 });

 test("application JSX has no raw hardcoded Hungarian text nodes",()=>{
  const roots=[path.join(srcRoot,"pages"),path.join(srcRoot,"components"),path.join(srcRoot,"layouts")];
  const allowedFiles=new Set(["KleopatraMobileI18n.tsx","LanguageSwitcher.tsx"]);
  const violations:string[]=[];
  for(const file of roots.flatMap(walk).filter(f=>f.endsWith(".tsx")&&!f.endsWith(".test.tsx")&&!f.endsWith(".test.ts"))){
   if(allowedFiles.has(path.basename(file)))continue;
   const source=fs.readFileSync(file,"utf8");
   const directText=/>\s*([^<{][^<]*?[áéíóöőúüűÁÉÍÓÖŐÚÜŰ][^<]*?)\s*</g;
   for(const match of source.matchAll(directText)){
    const text=String(match[1]||"").replace(/\s+/g," ").trim();
    if(!text||text.includes("=>")||text.includes("&&"))continue;
    const line=source.slice(0,match.index||0).split("\n").length;
    violations.push(`${path.relative(srcRoot,file)}:${line} ${text.slice(0,100)}`);
   }
  }
  expect(violations).toEqual([]);
 });
});
