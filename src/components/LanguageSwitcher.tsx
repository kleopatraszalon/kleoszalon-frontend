import React from"react";
import{Languages}from"lucide-react";
import{useLanguage,type Language}from"../i18n/LanguageProvider";
import FontScaleControl from"./FontScaleControl";
import"./LanguageSwitcher.css";
export default function LanguageSwitcher({compact=false}:{compact?:boolean}){const{language,setLanguage,t}=useLanguage();const change=(value:string)=>setLanguage(value==="en"?"en":"hu" as Language);return <><label className={`language-switcher ${compact?"compact":""}`} title={t("shell.language")}><Languages size={15}/><span>{compact?language.toUpperCase():t("shell.language")}</span><select value={language} onChange={e=>change(e.target.value)} aria-label={t("shell.language")}><option value="hu">HU · {t("language.hu")}</option><option value="en">EN · {t("language.en")}</option></select></label><FontScaleControl/></>}
