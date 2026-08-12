import React from "react";
import { render, waitFor } from "@testing-library/react";
import { useCurrentUser } from "./useCurrentUser";

function Consumer(){const{loading}=useCurrentUser();return <span>{loading?"loading":"ready"}</span>}

test("parallel consumers share one current-user request",async()=>{
  localStorage.setItem("kleo_token","test-token");
  const fetchMock=jest.spyOn(global,"fetch").mockResolvedValue({ok:true,json:async()=>({id:"u1",role:"admin"})} as Response);
  render(<><Consumer/><Consumer/><Consumer/></>);
  await waitFor(()=>expect(fetchMock).toHaveBeenCalledTimes(1));
  fetchMock.mockRestore();
  localStorage.clear();
});
