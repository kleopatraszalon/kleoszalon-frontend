// src/PrivateRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { hasStoredAuthToken } from "./utils/authSession";

type PrivateRouteProps = {
  children: React.ReactElement;
};

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  if (!hasStoredAuthToken()) return <Navigate to="/" replace />;
  return children;
};

export default PrivateRoute;
