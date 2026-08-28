import type { RouteObject } from "react-router-dom";
import { adminRoutes } from "./adminRoutes";
import { bookingRoutes } from "./bookingRoutes";
import { financeRoutes } from "./financeRoutes";
import { hrRoutes } from "./hrRoutes";
import { inventoryRoutes } from "./inventoryRoutes";
import { publicRoutes } from "./publicRoutes";

export const applicationRoutes: RouteObject[] = [
  ...publicRoutes,
  ...bookingRoutes,
  ...hrRoutes,
  ...financeRoutes,
  ...inventoryRoutes,
  ...adminRoutes,
];
