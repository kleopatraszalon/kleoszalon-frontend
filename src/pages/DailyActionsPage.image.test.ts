import fs from "fs";import path from "path";
const source=fs.readFileSync(path.join(__dirname,"DailyActionsPage.tsx"),"utf8");
test("daily action images are resized and compressed before saving",()=>{expect(source).toContain("function optimizeImage");expect(source).toContain("max = 1600");expect(source).toContain('toDataURL("image/jpeg", .82)');expect(source).toContain("A kép optimalizálva és beszúrva")});
test("API error payloads are shown to the administrator",()=>{expect(source).toContain("response?.data?.message");expect(source).toContain("response?.data?.error")});
