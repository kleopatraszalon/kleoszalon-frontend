import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "./i18n/LanguageProvider";

function Probe(){
  const {language,setLanguage,t}=useLanguage();
  return <div>
    <span data-testid="language">{language}</span>
    <span data-testid="search">{t("common.search")}</span>
    <button onClick={()=>setLanguage("en")}>English</button>
  </div>;
}

describe("KLEO-GEN-I18N-001 – HU/EN UI and persisted language",()=>{
  beforeEach(()=>localStorage.clear());

  test("switching language updates active UI text without a page reload",()=>{
    localStorage.setItem("kleo_language","hu");
    render(<LanguageProvider><Probe/></LanguageProvider>);
    expect(screen.getByTestId("search")).toHaveTextContent("Keresés");
    fireEvent.click(screen.getByText("English"));
    expect(screen.getByTestId("language")).toHaveTextContent("en");
    expect(screen.getByTestId("search")).toHaveTextContent("Search");
    expect(document.documentElement.lang).toBe("en");
  });

  test("a new provider session restores the previously selected English language",()=>{
    localStorage.setItem("kleo_language","en");
    const view=render(<LanguageProvider><Probe/></LanguageProvider>);
    expect(screen.getByTestId("language")).toHaveTextContent("en");
    expect(screen.getByTestId("search")).toHaveTextContent("Search");
    view.unmount();
    render(<LanguageProvider><Probe/></LanguageProvider>);
    expect(screen.getByTestId("language")).toHaveTextContent("en");
    expect(screen.getByTestId("search")).toHaveTextContent("Search");
  });
});
