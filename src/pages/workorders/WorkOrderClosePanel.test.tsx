import React from'react';
import{render,screen}from'@testing-library/react';
import'@testing-library/jest-dom';
import WorkOrderClosePanel from'./WorkOrderClosePanel';

test('PDF and email actions remain visible before finalization but are disabled',()=>{
  render(<WorkOrderClosePanel ready={false} financiallyClosed={false} locked={false} onFinalize={()=>undefined}/>);
  expect(screen.getByRole('button',{name:/PDF letöltése/i})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:/PDF letöltése/i})).toBeDisabled();
  expect(screen.getByRole('button',{name:/PDF újraküldése e-mailben/i})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:/PDF újraküldése e-mailben/i})).toBeDisabled();
  expect(screen.getByText(/a két dokumentumgomb már látható/i)).toBeInTheDocument();
});

test('PDF and email actions become enabled after archive lock',()=>{
  render(<WorkOrderClosePanel ready={true} financiallyClosed={true} locked={true} workOrderNumber="KLEO-ML-2026-000001" onFinalize={()=>undefined}/>);
  expect(screen.getByRole('button',{name:/PDF letöltése/i})).toBeEnabled();
  expect(screen.getByRole('button',{name:/PDF újraküldése e-mailben/i})).toBeEnabled();
});

test('a lezárásra kész munkalap PDF gombja automatikus lezárással használható',()=>{
  render(<WorkOrderClosePanel ready={true} onFinalize={()=>undefined}/>);
  expect(screen.getByRole('button',{name:/PDF letöltése/i})).toBeEnabled();
  expect(screen.getByRole('button',{name:/PDF újraküldése e-mailben/i})).toBeDisabled();
});

test('document actions self-heal the archive through idempotent finalization',()=>{
  const source=require('fs').readFileSync(require('path').join(__dirname,'WorkOrderClosePanel.tsx'),'utf8');
  expect(source).toMatch(/await ensureArchive\(id\);[\s\S]*\/pdf/);
  expect(source).toMatch(/await ensureArchive\(id\);[\s\S]*\/email/);
});
