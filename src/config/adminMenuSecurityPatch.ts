import { ADMIN_MENU } from "./adminMenu";

const settings = ADMIN_MENU.find((item) => item.code === "settings");
if (settings && !settings.children.some((item) => item.route === "/admin/security-settings")) {
  const securityItem = {
    id: 912121,
    name: "Biztonsági és DDoS beállítások",
    route: "/admin/security-settings",
    children: [],
  };
  const systemSettingsIndex = settings.children.findIndex((item) => item.route === "/settings");
  settings.children.splice(systemSettingsIndex >= 0 ? systemSettingsIndex + 1 : 0, 0, securityItem);
}
