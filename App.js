"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_router_dom_1 = require("react-router-dom");
var Login_1 = require("./pages/Login");
var Register_1 = require("./pages/Register");
var Home_1 = require("./pages/Home");
var EmployeesList_1 = require("./pages/EmployeesList");
var EmployeeDetails_1 = require("./pages/EmployeeDetails");
function App() {
    return (<react_router_dom_1.BrowserRouter>
      <react_router_dom_1.Routes>
        <react_router_dom_1.Route path="/" element={<Login_1.default />}/>
        <react_router_dom_1.Route path="/register" element={<Register_1.default />}/>
        <react_router_dom_1.Route path="/home" element={<Home_1.default />}/>
        <react_router_dom_1.Route path="/employees" element={<EmployeesList_1.default />}/>
        <react_router_dom_1.Route path="/employees/:id" element={<EmployeeDetails_1.default />}/>
        <react_router_dom_1.Route path="/employees/new" element={<div>Új munkatárs felvétele (admin felület jön ide)</div>}/>
      </react_router_dom_1.Routes>
    </react_router_dom_1.BrowserRouter>);
}
exports.default = App;
