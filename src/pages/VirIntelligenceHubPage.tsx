import React from 'react';
import {useLanguage} from '../i18n/LanguageProvider';
import VirIntelligenceFlowNav from './VirIntelligenceFlowNav';
import VirIntelligencePage from './VirIntelligencePage';
import './VirWorkspace.css';

export default function VirIntelligenceHubPage(){const{language}=useLanguage();const en=language==='en';return <div className="vir-workspace"><VirIntelligenceFlowNav current="core" en={en}/><header className="vir-workspace-hero"><h1>{en?'VIR Intelligence · business health':'VIR Intelligence · üzleti állapot'}</h1><p>{en?'Live profitability, capacity and no-show intelligence is the operational starting point of the governed decision workflow.':'Az élő jövedelmezőség, kapacitás és no-show elemzés a kontrollált vezetői döntési folyamat operatív kiindulópontja.'}</p></header><div className="vir-embedded-intelligence"><VirIntelligencePage/></div></div>;}