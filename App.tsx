import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import EmployeesList from "./pages/EmployeesList";
import EmployeeDetails from "./pages/EmployeeDetails";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/employees" element={<EmployeesList />} />
        <Route path="/employees/:id" element={<EmployeeDetails />} />
        <Route path="/employees/new" element={<div>Új munkatárs felvétele (admin felület jön ide)</div>} />
      </Routes>
    </Router>
  );
}

export default App;