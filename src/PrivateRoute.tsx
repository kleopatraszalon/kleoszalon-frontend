// src/PrivateRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";

type PrivateRouteProps = {
  children: React.ReactElement; // csak egy React elementet fogad el
};

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
 const token = localStorage.getItem("kleo_token");
if (!token) return <Navigate to="/" replace />;
return children;
};

// **Ez a sor legyen az export**
export default PrivateRoute;
