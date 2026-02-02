import React from "react";
import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactElement;
}

const PrivateRoute: React.FC<Props> = ({ children }) => {
  const token = localStorage.getItem("kleo_token");
  return token ? children : <Navigate to="/" />;
};

export default PrivateRoute;