import React from'react';
import{Settings2,ShieldCheck,UsersRound}from'lucide-react';
import EmployeeAccessDesigner from'./access/EmployeeAccessDesigner';
import'./AccessControlPage.css';

export default function AccessControlPage(){
 return <main className="access-page">
  <section className="access-hero"><div><span>BEÁLLÍTÁSOK ÉS ADMINISZTRÁCIÓ</span><h1>Ki mit lásson és használhasson?</h1><p>Egyszerű, munkatársankénti beállítás. Válasszon nevet, kapcsolja be a szükséges funkciókat, állítsa össze a főoldalt, majd nyomja meg a Mentés gombot.</p></div><div style={{display:'flex',gap:9,alignItems:'center',padding:'10px 13px',border:'1px solid #e6dae1',borderRadius:12,background:'#fff'}}><ShieldCheck size={20}/><div><b>Adminisztrátori felület</b><small style={{display:'block',opacity:.65}}>Technikai ismeret nélkül használható</small></div></div></section>
  <section className="access-stats"><article><UsersRound/><div><small>Beállítás módja</small><strong style={{fontSize:17}}>Munkatársanként</strong></div></article><article><Settings2/><div><small>Főoldal</small><strong style={{fontSize:17}}>Kapcsolókkal</strong></div></article><article><ShieldCheck/><div><small>Jogosultság</small><strong style={{fontSize:17}}>Egyedi</strong></div></article></section>
  <EmployeeAccessDesigner/>
  <section style={{padding:16,border:'1px solid #e8e0e5',borderRadius:14,background:'#fff'}}><b>Alapértelmezés</b><p style={{margin:'6px 0 0',fontSize:13,color:'#76676e'}}>A recepciósok automatikusan megkapják az Időpontnaptár, Munkalapok, Termékeladás, Vendégek / CRM, Pénztár, Munkatársi chat és Checklisták hozzáférést. Az admin ezt munkatársanként felülírhatja.</p></section>
 </main>
}
