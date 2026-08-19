const fs=require('fs');
const {ESLint}=require('eslint');

function lineOffset(text,line,column){
  const lines=text.split(/\n/);
  let offset=0;
  for(let i=0;i<line-1;i++) offset+=lines[i].length+1;
  return offset+Math.max(0,column-1);
}
function removeUnusedImport(line,name){
  const importMatch=line.match(/^\s*import\s*\{([\s\S]*?)\}\s*from/);
  if(!importMatch||!new RegExp(`\\b${name}\\b`).test(importMatch[1])) return line;
  const parts=importMatch[1].split(',').map(x=>x.trim()).filter(Boolean);
  const kept=parts.filter(x=>x!==name&&!x.startsWith(`${name} as `));
  if(kept.length===parts.length) return line;
  return line.replace(importMatch[1],kept.join(','));
}
function addNoopenerRel(text){
  return text.replace(/<a\b([^>]*?)target=(['"])_blank\2([^>]*?)>/g,(full,before,q,after)=>{
    const attrs=`${before}target=${q}_blank${q}${after}`;
    if(/\brel\s*=/.test(attrs)) return full;
    return `<a${before}target=${q}_blank${q} rel=${q}noreferrer${q}${after}>`;
  });
}
(async()=>{
  const eslintFix=new ESLint({fix:true});
  const fixed=await eslintFix.lintFiles(['src/**/*.{js,jsx,ts,tsx}']);
  await ESLint.outputFixes(fixed);

  const eslint=new ESLint();
  const results=await eslint.lintFiles(['src/**/*.{js,jsx,ts,tsx}']);
  for(const result of results){
    if(!result.filePath||!fs.existsSync(result.filePath)) continue;
    let text=fs.readFileSync(result.filePath,'utf8');
    let changed=false;

    // Remove only named imports that ESLint proves unused. No local variables are touched.
    const lines=text.split(/\n/);
    for(const msg of result.messages){
      if(msg.ruleId!=='@typescript-eslint/no-unused-vars'||!msg.line||msg.line>6) continue;
      const m=String(msg.message||'').match(/^'([^']+)' is defined but never used/);
      if(!m) continue;
      const index=msg.line-1;
      const next=removeUnusedImport(lines[index]||'',m[1]);
      if(next!==lines[index]){lines[index]=next;changed=true;}
    }
    if(changed) text=lines.join('\n');

    // react/jsx-no-target-blank: adding noreferrer/noopener is behavior-preserving and security-hardening.
    if(result.messages.some(m=>m.ruleId==='react/jsx-no-target-blank')){
      const next=addNoopenerRel(text);
      if(next!==text){text=next;changed=true;}
    }

    // no-useless-escape guarantees the backslash is semantically unnecessary. Remove exactly that character.
    const escapeMessages=result.messages.filter(m=>m.ruleId==='no-useless-escape'&&m.line&&m.column).sort((a,b)=>lineOffset(text,b.line,b.column)-lineOffset(text,a.line,a.column));
    for(const msg of escapeMessages){
      const pos=lineOffset(text,msg.line,msg.column);
      if(text[pos]==='\\'){text=text.slice(0,pos)+text.slice(pos+1);changed=true;}
    }

    if(changed) fs.writeFileSync(result.filePath,text);
  }

  const verify=new ESLint();
  const after=await verify.lintFiles(['src/**/*.{js,jsx,ts,tsx}']);
  const errors=after.reduce((n,r)=>n+r.errorCount+r.fatalErrorCount,0);
  const warnings=after.reduce((n,r)=>n+r.warningCount,0);
  console.log(`Conservative lint debt autofix result: ${errors} errors, ${warnings} warnings.`);
  if(errors) process.exit(1);
})().catch(err=>{console.error(err);process.exit(1)});
