import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ClientFormsVersionPage from "./ClientFormsVersionPage";

jest.mock("../utils/apiBase",()=>({__esModule:true,default:(path:string)=>`/${path}`}));

const ok=(payload:unknown)=>Promise.resolve({ok:true,status:200,json:async()=>payload} as Response);

describe("ClientFormsVersionPage",()=>{
  beforeEach(()=>{
    localStorage.setItem("token","test-token");
    jest.restoreAllMocks();
  });

  test("shows published version history and read-only document fields",async()=>{
    const fetchMock=jest.spyOn(global,"fetch").mockImplementation((input:RequestInfo|URL)=>{
      const url=String(input);
      if(url==="/clients/form-versions") return ok({can_edit:false,forms:[{
        id:"form-1",title:"Adatkezelési nyilatkozat",description:"Teszt nyilatkozat",form_type:"consent",is_active:true,
        current_version:2,current_version_id:"version-2",current_status:"published",privacy_notice_version:"GDPR-v3",version_count:2,draft_count:0,
      }]});
      return ok({can_edit:false,form:{id:"form-1",title:"Adatkezelési nyilatkozat",description:"Teszt nyilatkozat",form_type:"consent"},versions:[{
        id:"version-2",form_id:"form-1",version_no:2,title:"Adatkezelési nyilatkozat",description:"Teszt nyilatkozat",form_type:"consent",
        content_schema:{fields:[{key:"photo",label:"Hozzájárul a fotódokumentációhoz?",type:"yes_no",required:true,options:[]}]},
        privacy_notice_version:"GDPR-v3",status:"published",effective_from:"2026-08-12T10:00:00Z",created_at:"2026-08-12T09:00:00Z",updated_at:"2026-08-12T10:00:00Z",
      },{
        id:"version-1",form_id:"form-1",version_no:1,title:"Adatkezelési nyilatkozat",description:"Régi",form_type:"consent",content_schema:{fields:[]},status:"retired",created_at:"2026-08-01T09:00:00Z",updated_at:"2026-08-12T10:00:00Z",
      }]});
    });

    render(<MemoryRouter><ClientFormsVersionPage/></MemoryRouter>);
    expect(await screen.findByText("Hozzájárul a fotódokumentációhoz?")).toBeInTheDocument();
    expect(screen.getAllByText("v2").length).toBeGreaterThan(0);
    expect(screen.getByText("GDPR-v3")).toBeInTheDocument();
    expect(screen.queryByRole("button",{name:/Új verzió/i})).not.toBeInTheDocument();
    await waitFor(()=>expect(fetchMock).toHaveBeenCalledWith("/clients/form-versions",expect.any(Object)));
    await waitFor(()=>expect(fetchMock).toHaveBeenCalledWith("/clients/form-versions/form-1",expect.any(Object)));
  });
});
