import React, { Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./styles/kleo-theme.css";
import "./styles/vir-font-scale.css";
import BrandLoadingScreen from "./components/BrandLoadingScreen";
import { applicationRoutes } from "./routing/routes";

const router = createBrowserRouter(applicationRoutes);

export default function App() {
  return (
    <Suspense fallback={<BrandLoadingScreen />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
