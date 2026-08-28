import type { RouteObject } from "react-router-dom";
import { PublicOnly } from "./routeAccess";
import {
  EmployeeMobileApp,
  GuestReviewTabletPage,
  KleopatraMobileApp,
  Login,
  PublicBookingManagePage,
  PublicBookingPage,
  Register,
} from "./routePages";

export const publicRoutes: RouteObject[] = [
  {
    path: "/login",
    element: (
      <PublicOnly>
        <Login />
      </PublicOnly>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicOnly>
        <Register />
      </PublicOnly>
    ),
  },
  { path: "/vendeg-ertekeles", element: <GuestReviewTabletPage /> },
  { path: "/employee-app", element: <EmployeeMobileApp /> },
  { path: "/booking/manage/:token", element: <PublicBookingManagePage /> },
  { path: "/foglalas/kezeles/:token", element: <PublicBookingManagePage /> },
  { path: "/booking", element: <PublicBookingPage /> },
  { path: "/foglalas", element: <PublicBookingPage /> },
  { path: "/idopontfoglalas", element: <PublicBookingPage /> },
  { path: "/kleopatra-app", element: <KleopatraMobileApp /> },
];
