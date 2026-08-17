import type{VirCustomization}from"./virCustomization";

export const APPROVED_BRAND_COLORS=[
 "#b69861","#c8b187","#d5c4a4","#e3d8c3",
 "#120c08","#5d5a55","#84837e","#b0afad",
 "#ec008c","#f173ac","#f59ac2","#f9c1d9",
] as const;
export const DEFAULT_BRAND_ACCENT="#ec008c";
export const APPROVED_LOGO_ASSETS=[
 {value:"/kleopatra-logo.png",labelHu:"Kleopátra – hivatalos logó",labelEn:"Kleopátra – official logo"},
] as const;
export const DEFAULT_LOGO_ASSET="/kleopatra-logo.png";

const colors=new Set<string>(APPROVED_BRAND_COLORS);
const logos=new Set<string>(APPROVED_LOGO_ASSETS.map(x=>x.value));
export function approvedBrandColor(value:unknown){const color=String(value||"").trim().toLowerCase();return colors.has(color)?color:DEFAULT_BRAND_ACCENT;}
export function approvedLogoAsset(value:unknown){const logo=String(value||"").trim();return logos.has(logo)?logo:DEFAULT_LOGO_ASSET;}
export function enforceBrandGuard(config:VirCustomization):VirCustomization{
 return{
  ...config,
  brand:{
   ...(config.brand||{}),
   accent:approvedBrandColor(config.brand?.accent),
   logo_url:approvedLogoAsset(config.brand?.logo_url),
  },
 };
}
export function brandGuardValid(config:VirCustomization){
 return approvedBrandColor(config.brand?.accent)===String(config.brand?.accent||"").trim().toLowerCase()
  &&approvedLogoAsset(config.brand?.logo_url)===String(config.brand?.logo_url||"").trim();
}
