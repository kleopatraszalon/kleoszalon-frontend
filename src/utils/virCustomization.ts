export type VirTheme="light"|"dark"|"system";
export type VirDensity="comfortable"|"compact";
export type VirSidebarMode="expanded"|"compact";
export type VirCustomization={
 brand?:{name?:string;short_name?:string;logo_url?:string;accent?:string;radius?:number};
 appearance?:{theme?:VirTheme;density?:VirDensity;sidebar?:VirSidebarMode;dashboard_welcome?:string};
 features?:Record<string,boolean>;
 labels?:Record<string,string>;
 menu_visibility?:Record<string,boolean>;
 login?:{headline?:string;subheadline?:string};
};

export const VIR_CUSTOMIZATION_KEY="kleo.vir.customization";
export const VIR_CUSTOMIZATION_EVENT="kleo:vir-customization";

export function readStoredVirCustomization():VirCustomization|null{
 if(typeof window==="undefined")return null;
 try{const raw=localStorage.getItem(VIR_CUSTOMIZATION_KEY);return raw?JSON.parse(raw):null}catch{return null}
}

function resolvedTheme(theme:VirTheme){
 if(theme!=="system")return theme;
 return typeof window!=="undefined"&&window.matchMedia?.("(prefers-color-scheme: dark)").matches?"dark":"light";
}

export function applyVirCustomization(config:VirCustomization|null|undefined,{broadcast=true}:{broadcast?:boolean}={}){
 if(typeof document==="undefined"||!config)return;
 try{localStorage.setItem(VIR_CUSTOMIZATION_KEY,JSON.stringify(config))}catch{}
 const root=document.documentElement;
 const accent=String(config.brand?.accent||"#ec008c");
 if(/^#[0-9a-f]{6}$/i.test(accent)){
  root.style.setProperty("--color-magenta",accent);
  root.style.setProperty("--color-magenta-2",`color-mix(in srgb, ${accent} 65%, white)`);
  root.style.setProperty("--color-magenta-3",`color-mix(in srgb, ${accent} 45%, white)`);
  root.style.setProperty("--color-magenta-4",`color-mix(in srgb, ${accent} 22%, white)`);
 }
 const radius=Math.max(4,Math.min(32,Number(config.brand?.radius||14)));
 root.style.setProperty("--radius-md",`${Math.max(4,radius-2)}px`);
 root.style.setProperty("--radius-lg",`${radius+4}px`);
 const density=config.appearance?.density||"comfortable";
 root.dataset.virDensity=density;
 if(density==="compact"){
  root.style.setProperty("--space-md","12px");root.style.setProperty("--space-lg","18px");root.style.setProperty("--space-xl","24px");
 }else{
  root.style.setProperty("--space-md","16px");root.style.setProperty("--space-lg","24px");root.style.setProperty("--space-xl","32px");
 }
 const theme=resolvedTheme(config.appearance?.theme||"light");
 root.dataset.virTheme=theme;
 if(theme==="dark"){
  root.style.setProperty("--color-bg","#171517");root.style.setProperty("--color-surface","#211d21");root.style.setProperty("--color-text","#f7f3f5");root.style.setProperty("--color-muted","#b9adb3");root.style.setProperty("--color-border-subtle","#40363d");
 }else{
  root.style.setProperty("--color-bg","#f5f5f5");root.style.setProperty("--color-surface","#ffffff");root.style.setProperty("--color-text","#120c08");root.style.setProperty("--color-muted","#5d5a55");root.style.setProperty("--color-border-subtle","#e2e2e2");
 }
 root.dataset.virSidebar=config.appearance?.sidebar||"expanded";
 if(config.brand?.name)document.title=String(config.brand.name);
 if(broadcast&&typeof window!=="undefined")window.dispatchEvent(new CustomEvent(VIR_CUSTOMIZATION_EVENT,{detail:config}));
}

export function featureEnabled(config:VirCustomization|null|undefined,key:string,defaultValue=true){const v=config?.features?.[key];return typeof v==="boolean"?v:defaultValue}
export function menuEnabled(config:VirCustomization|null|undefined,key:string,defaultValue=true){const v=config?.menu_visibility?.[key];return typeof v==="boolean"?v:defaultValue}
