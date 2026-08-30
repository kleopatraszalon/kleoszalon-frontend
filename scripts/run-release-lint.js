const { ESLint } = require('eslint');
const WARNING_BASELINE = Number(process.env.ESLINT_WARNING_BASELINE || 5);
const LOCALIZED_T_DEP_FILES = new Set([
  'src/pages/VirManagerCockpitPage.tsx',
  'src/pages/VirP1Page.tsx',
  'src/pages/VirP9Page.tsx',
]);
function isLocalizedTranslationDependencyWarning(filePath,message){
  const normalized=String(filePath||'').replace(/\\/g,'/');
  const relative=[...LOCALIZED_T_DEP_FILES].find(file=>normalized.endsWith('/'+file));
  return Boolean(relative&&message?.severity===1&&message?.ruleId==='react-hooks/exhaustive-deps'&&String(message?.message||'').includes("dependency: 't'"));
}
(async()=>{const eslint=new ESLint();const rawResults=await eslint.lintFiles(['src/**/*.{js,jsx,ts,tsx}']);const results=rawResults.map(r=>{const messages=r.messages.filter(m=>!isLocalizedTranslationDependencyWarning(r.filePath,m));return{...r,messages,warningCount:messages.filter(m=>m.severity===1).length}});const formatter=await eslint.loadFormatter('stylish');const output=formatter.format(results);if(output)process.stdout.write(`${output}\n`);const errorCount=results.reduce((s,r)=>s+r.errorCount+r.fatalErrorCount,0);const warningCount=results.reduce((s,r)=>s+r.warningCount,0);if(errorCount>0){console.error(`ESLint release gate: ${errorCount} error(s), ${warningCount} warning(s).`);process.exit(1)}if(warningCount>WARNING_BASELINE){console.error(`ESLint release gate: warning regression (${warningCount} > ${WARNING_BASELINE}).`);process.exit(1)}console.log(`ESLint release gate OK: 0 errors; ${warningCount}/${WARNING_BASELINE} legacy-warning budget used.`)})().catch(e=>{console.error('ESLint release gate failed to execute.',e);process.exit(1)});
