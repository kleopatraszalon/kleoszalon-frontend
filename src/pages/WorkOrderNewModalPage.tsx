import React,{useRef}from"react";
import{CalendarCheck2,X}from"lucide-react";
import{useNavigate,useParams}from"react-router-dom";
import WorkOrderNew from"./WorkOrderNew";
import WorkOrderDetail from"./WorkOrderDetail";
import WorkOrderWorkflowNavigator from"./workorders/WorkOrderWorkflowNavigator";
import"./WorkOrderNewModalPage.css";

type Props={onClose?:()=>void};
export default function WorkOrderNewModalPage({onClose}:Props){
 const navigate=useNavigate();const{id}=useParams();const existing=Boolean(id);const scrollRef=useRef<HTMLDivElement|null>(null);const close=()=>onClose?onClose():navigate('/workorders');
 return <div className="wo-modal-backdrop" role="presentation"><section className="wo-modal-window" role="dialog" aria-modal="true" aria-labelledby="wo-modal-title"><header className="wo-modal-header"><div className="wo-modal-heading"><span className="wo-modal-kicker"><CalendarCheck2 size={16}/> DIGITÁLIS MUNKALAP</span><h1 id="wo-modal-title">{existing?'Munkalap kezelése':'Munkalap rögzítése'}</h1><p>Vezetett folyamat a vendég azonosításától a fizetésen át a lezárásig.</p></div><button className="wo-modal-close" type="button" onClick={close} aria-label="Munkalap ablak bezárása" title="Bezárás"><X size={22}/></button></header><WorkOrderWorkflowNavigator scrollRoot={scrollRef}/><div className={`wo-modal-scroll${existing?' wo-modal-scroll--detail':''}`} ref={scrollRef}>{existing?<WorkOrderDetail/>:<WorkOrderNew/>}</div></section></div>
}
