import React from "react";
import { ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminProductSaleQuickAction(){
  const navigate=useNavigate();
  return <section style={{margin:"18px 24px 8px",display:"flex",justifyContent:"flex-end"}}>
    <button
      type="button"
      onClick={()=>navigate("/finance/product-sale")}
      style={{display:"inline-flex",alignItems:"center",gap:9,padding:"12px 16px",border:"1px solid #e7bfd2",borderRadius:13,background:"linear-gradient(135deg,#fff 0%,#fff4f8 100%)",color:"#96295f",fontWeight:850,cursor:"pointer",boxShadow:"0 8px 20px rgba(120,35,79,.08)"}}
      title="Termék értékesítése szolgáltatási munkalap nélkül"
    >
      <ShoppingBag size={18}/>
      Termékeladás
    </button>
  </section>;
}
