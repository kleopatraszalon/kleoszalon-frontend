import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Plus, Save, Search, ShieldCheck, SlidersHorizontal, UsersRound, X } from "lucide-react";
import withBase from "../utils/apiBase";
import "./AccessControlPage.css";

type Role = { id: string; role_key: string; name: string; description?: string; level: number; is_system?: boolean };
type Menu = { id: number; code?: string; name: string; parent_id?: number; route?: string; order_index: number };
type Feature = { feature_key: string; name: string; description?: string };
type FeaturePermission = { role_key: string; feature_key: string; can_use: boolean; scope_type: string };

const fields = [
  { key: "can_view", label: "Látható" },
  { key: "can_create", label: "Létrehozás" },
  { key: "can_edit", label: "Módosítás" },
  { key: "can_delete", label: "Törlés" },
  { key: "can_approve", label: "Jóváhagyás" },
  { key: "can_export", label: "Export" },
  { key: "can_view_financial", label: "Pénzügyi adatok" },
  { key: "can_manage_permissions", label: "Jogosultságkezelés" },
];

export default function AccessControlPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [featurePermissions, setFeaturePermissions] = useState<FeaturePermission[]>([]);
  const [selected, setSelected] = useState("manager");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [roleModal, setRoleModal] = useState(false);
  const [roleForm, setRoleForm] = useState<any>({ role_key: "", name: "", description: "", level: 10, is_active: true });

  const token = localStorage.getItem("kleo_token") || localStorage.getItem("token") || "";
  const api = useCallback(async (path: string, init?: RequestInit) => {
    const response = await fetch(withBase(path), {
      ...init,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : null;
    if (!response.ok) throw new Error(data?.error || data?.message || "A művelet nem sikerült.");
    return data;
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("access-control/matrix");
      setRoles(data.roles || []);
      setMenus(data.menus || []);
      setPermissions(data.permissions || []);
      setFeatures(data.features || []);
      setFeaturePermissions(data.feature_permissions || []);
      if (!data.roles?.some((role: Role) => role.role_key === selected) && data.roles?.length) setSelected(data.roles[0].role_key);
    } catch (reason: any) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [api, selected]);

  useEffect(() => { load(); }, [load]);

  const current = useMemo(() => {
    const map = new Map<number, any>();
    menus.forEach((menu) => {
      const permission = permissions.find((item) => item.role_key === selected && Number(item.menu_id) === Number(menu.id));
      map.set(Number(menu.id), {
        menu_id: Number(menu.id), can_view: false, can_create: false, can_edit: false, can_delete: false,
        can_approve: false, can_export: false, can_view_financial: false, can_manage_permissions: false,
        scope_type: "own_location", ...permission,
      });
    });
    return map;
  }, [menus, permissions, selected]);

  const currentFeatures = useMemo(() => {
    const map = new Map<string, FeaturePermission>();
    features.forEach((feature) => {
      const permission = featurePermissions.find((item) => item.role_key === selected && item.feature_key === feature.feature_key);
      map.set(feature.feature_key, {
        role_key: selected,
        feature_key: feature.feature_key,
        can_use: selected === "admin" ? true : Boolean(permission?.can_use),
        scope_type: selected === "admin" ? "all_locations" : (permission?.scope_type || "own_location"),
      });
    });
    return map;
  }, [features, featurePermissions, selected]);

  const roots = useMemo(() => {
    const query = search.toLowerCase();
    return menus.filter((menu) => !menu.parent_id && (!query || menu.name.toLowerCase().includes(query) || menus.some((child) => Number(child.parent_id) === Number(menu.id) && child.name.toLowerCase().includes(query))));
  }, [menus, search]);

  const children = (id: number) => menus.filter((menu) => Number(menu.parent_id) === Number(id) && (!search || menu.name.toLowerCase().includes(search.toLowerCase())));

  const setPermission = (menuId: number, key: string, value: boolean) => {
    setPermissions((previous) => {
      const index = previous.findIndex((item) => item.role_key === selected && Number(item.menu_id) === menuId);
      const base = { role_key: selected, ...current.get(menuId), menu_id: menuId };
      const next: any = { ...base, [key]: value };
      if (key === "can_view" && !value) fields.filter((field) => field.key !== "can_view").forEach((field) => next[field.key] = false);
      if (key !== "can_view" && value) next.can_view = true;
      if (index < 0) return [...previous, next];
      const copy = [...previous]; copy[index] = next; return copy;
    });
  };

  const setScope = (menuId: number, scope: string) => {
    setPermissions((previous) => {
      const index = previous.findIndex((item) => item.role_key === selected && Number(item.menu_id) === menuId);
      const next = { role_key: selected, ...current.get(menuId), menu_id: menuId, scope_type: scope };
      if (index < 0) return [...previous, next];
      const copy = [...previous]; copy[index] = next; return copy;
    });
  };

  const toggleRow = (menuId: number, value: boolean) => {
    setPermissions((previous) => {
      const index = previous.findIndex((item) => item.role_key === selected && Number(item.menu_id) === menuId);
      const next: any = { role_key: selected, menu_id: menuId, scope_type: current.get(menuId)?.scope_type || "own_location" };
      fields.forEach((field) => next[field.key] = value);
      if (index < 0) return [...previous, next];
      const copy = [...previous]; copy[index] = next; return copy;
    });
  };

  const setFeature = (featureKey: string, patch: Partial<FeaturePermission>) => {
    setFeaturePermissions((previous) => {
      const index = previous.findIndex((item) => item.role_key === selected && item.feature_key === featureKey);
      const next: FeaturePermission = { ...(currentFeatures.get(featureKey) as FeaturePermission), ...patch, role_key: selected, feature_key: featureKey };
      if (index < 0) return [...previous, next];
      const copy = [...previous]; copy[index] = next; return copy;
    });
  };

  const save = async () => {
    setSaving(true); setError("");
    try {
      await Promise.all([
        api(`access-control/roles/${selected}/permissions`, { method: "PUT", body: JSON.stringify([...current.values()]) }),
        api(`access-control/roles/${selected}/features`, { method: "PUT", body: JSON.stringify([...currentFeatures.values()]) }),
      ]);
      setNotice("A menü- és funkciójogosultságok mentése sikerült.");
      setTimeout(() => setNotice(""), 3000);
      await load();
    } catch (reason: any) {
      setError(reason.message);
    } finally {
      setSaving(false);
    }
  };

  const createRole = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const role = await api("access-control/roles", { method: "POST", body: JSON.stringify(roleForm) });
      setRoleModal(false); setSelected(role.role_key); setNotice("Az új szerepkör létrejött."); await load();
    } catch (reason: any) { setError(reason.message); }
    finally { setSaving(false); }
  };

  const selectedRole = roles.find((role) => role.role_key === selected);
  const granted = [...current.values()].filter((item) => item.can_view).length;
  const enabledFeatures = [...currentFeatures.values()].filter((item) => item.can_use).length;

  return <main className="access-page">
    {notice && <div className="access-toast"><Check/>{notice}</div>}
    <section className="access-hero"><div><span>BEÁLLÍTÁSOK ÉS ADMINISZTRÁCIÓ</span><h1>Jogosultságok és hozzáférések</h1><p>Menüpont- és funkciószinten szabályozható, hogy az egyes szerepkörök mit láthatnak és használhatnak.</p></div><button className="access-primary" onClick={save} disabled={saving || selected === "admin"}><Save/>{saving ? "Mentés…" : "Jogosultságok mentése"}</button></section>
    <section className="access-stats"><article><UsersRound/><div><small>Aktív szerepkör</small><strong>{roles.length}</strong></div></article><article><ShieldCheck/><div><small>Engedélyezett menüpont</small><strong>{selected === "admin" ? menus.length : granted}</strong></div></article><article><SlidersHorizontal/><div><small>Engedélyezett funkció</small><strong>{selected === "admin" ? features.length : enabledFeatures}</strong></div></article></section>
    {error && <div className="access-alert">{error}<button onClick={() => setError("")}><X/></button></div>}

    <section className="access-layout"><aside className="access-roles"><header><div><h2>Szerepkörök</h2><p>Válasszon szerkesztendő szerepkört.</p></div><button onClick={() => setRoleModal(true)}><Plus/></button></header>{roles.map((role) => <button key={role.id} className={selected === role.role_key ? "active" : ""} onClick={() => setSelected(role.role_key)}><span>{role.name.slice(0, 2).toUpperCase()}</span><div><strong>{role.name}</strong><small>{role.description || role.role_key}</small></div><em>{role.level}</em></button>)}</aside>
      <div className="access-matrix">
        <header><div><h2>{selectedRole?.name || "Szerepkör"}</h2><p>{selected === "admin" ? "A rendszergazdai teljes hozzáférés nem korlátozható." : "A funkció- és menüjogosultságok együtt határozzák meg a tényleges hozzáférést."}</p></div><label><Search/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Menüpont keresése…"/></label></header>

        <section style={{ padding: "18px 20px 6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><SlidersHorizontal size={19}/><div><h3 style={{ margin: 0 }}>Funkció-hozzáférések</h3><p style={{ margin: "3px 0 0", opacity: .68, fontSize: 13 }}>Érzékeny modulok külön engedélyezése szerepkörönként.</p></div></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>
            {features.map((feature) => {
              const permission = currentFeatures.get(feature.feature_key)!;
              return <article key={feature.feature_key} style={{ border: "1px solid #e8e8ee", borderRadius: 14, padding: 13, background: permission.can_use ? "#faf7ff" : "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}><div><strong>{feature.name}</strong><p style={{ margin: "4px 0 0", fontSize: 12, opacity: .66, lineHeight: 1.45 }}>{feature.description}</p></div><label className="matrix-check"><input type="checkbox" disabled={selected === "admin"} checked={selected === "admin" || permission.can_use} onChange={(event) => setFeature(feature.feature_key, { can_use: event.target.checked })}/><span><Check/></span></label></div>
                <select disabled={selected === "admin" || !permission.can_use} value={selected === "admin" ? "all_locations" : permission.scope_type} onChange={(event) => setFeature(feature.feature_key, { scope_type: event.target.value })} style={{ width: "100%", marginTop: 10, minHeight: 34, border: "1px solid #dedee7", borderRadius: 8 }}><option value="own">Csak saját</option><option value="own_location">Saját telephely</option><option value="selected_locations">Kijelölt telephelyek</option><option value="all_locations">Minden telephely</option></select>
              </article>;
            })}
          </div>
        </section>

        <div className="matrix-scroll"><table><thead><tr><th>Modul / menüpont</th>{fields.map((field) => <th key={field.key}>{field.label}</th>)}<th>Hatókör</th></tr></thead><tbody>{loading ? <tr><td colSpan={10} className="matrix-empty">Betöltés…</td></tr> : roots.map((root) => <React.Fragment key={root.id}><MatrixRow menu={root} permission={current.get(root.id)} admin={selected === "admin"} parent expanded={expanded.includes(root.id)} onExpand={() => setExpanded((items) => items.includes(root.id) ? items.filter((id) => id !== root.id) : [...items, root.id])} onChange={setPermission} onScope={setScope} onAll={toggleRow}/>{expanded.includes(root.id) && children(root.id).map((child) => <MatrixRow key={child.id} menu={child} permission={current.get(child.id)} admin={selected === "admin"} onChange={setPermission} onScope={setScope} onAll={toggleRow}/>)}</React.Fragment>)}</tbody></table></div>
      </div>
    </section>

    {roleModal && <div className="access-modal-bg"><form className="access-modal" onSubmit={createRole}><header><div><span>ADMINISZTRÁCIÓ</span><h2>Új szerepkör</h2></div><button type="button" onClick={() => setRoleModal(false)}><X/></button></header><div><label><span>Megnevezés *</span><input required value={roleForm.name} onChange={(event) => setRoleForm({ ...roleForm, name: event.target.value })}/></label><label><span>Technikai kulcs *</span><input required pattern="[a-z0-9_-]+" value={roleForm.role_key} onChange={(event) => setRoleForm({ ...roleForm, role_key: event.target.value.toLowerCase().replace(/\s+/g, "_") })}/></label><label><span>Szint</span><input type="number" min="1" max="99" value={roleForm.level} onChange={(event) => setRoleForm({ ...roleForm, level: event.target.value })}/></label><label className="wide"><span>Leírás</span><textarea value={roleForm.description} onChange={(event) => setRoleForm({ ...roleForm, description: event.target.value })}/></label></div><footer><button type="button" onClick={() => setRoleModal(false)}>Mégse</button><button className="access-primary" disabled={saving}>Létrehozás</button></footer></form></div>}
  </main>;
}

function MatrixRow({ menu, permission, admin, parent, expanded, onExpand, onChange, onScope, onAll }: { menu: Menu; permission: any; admin: boolean; parent?: boolean; expanded?: boolean; onExpand?: () => void; onChange: (id: number, key: string, value: boolean) => void; onScope: (id: number, scope: string) => void; onAll: (id: number, value: boolean) => void }) {
  const p = permission || {};
  return <tr className={parent ? "parent-row" : "child-row"}><td><div className="menu-cell">{parent ? <button onClick={onExpand}>{expanded ? <ChevronDown/> : <ChevronRight/>}</button> : <i/>}<span><strong>{menu.name}</strong><small>{menu.code || menu.route || "—"}</small></span><button className="row-all" disabled={admin} onClick={() => onAll(menu.id, !p.can_view)}>{p.can_view ? "Mind tilt" : "Mind enged"}</button></div></td>{fields.map((field) => <td key={field.key}><label className="matrix-check"><input type="checkbox" disabled={admin} checked={admin || Boolean(p[field.key])} onChange={(event) => onChange(menu.id, field.key, event.target.checked)}/><span><Check/></span></label></td>)}<td><select disabled={admin} value={admin ? "all_locations" : p.scope_type || "own_location"} onChange={(event) => onScope(menu.id, event.target.value)}><option value="own">Csak saját</option><option value="own_location">Saját telephely</option><option value="selected_locations">Kijelölt telephelyek</option><option value="all_locations">Minden telephely</option></select></td></tr>;
}
