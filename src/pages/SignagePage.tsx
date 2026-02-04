import React, { useEffect, useMemo, useRef, useState } from "react";
import "./signage.css";
import "./signageDeals.css";
import "./signagePros.css";
import "./signageLayout.css";

type ServiceItem = { id: string; name: string; category: string; durationMin: number | null; price_text: string; priority: number; };
type Deal = { id: string; title: string; subtitle: string; price_text: string; valid_from: string | null; valid_to: string | null; active?: boolean; priority?: number; };
type Professional = { id: string; name: string; title: string; note: string; priority: number; is_free?: boolean; available?: boolean; };
type VideoItem = { id: string; youtube_id: string; title: string; duration_sec: number; priority: number; };

function huDate(d: Date) {
  return d.toLocaleDateString("hu-HU", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}
function huTime(d: Date) {
  return d.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function makeEmbedUrl(id: string) {
  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1`;
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function isFree(p: Professional): boolean {
  // Új logika: ha van is_free, azt használjuk; különben fallback az available-re; ha az sincs, szabad
  return (p.is_free ?? p.available ?? true) === true;
}

export const SignagePage: React.FC = () => {
  const [clock, setClock] = useState(() => new Date());

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [servicesMeta, setServicesMeta] = useState<string>("");

  const [deals, setDeals] = useState<Deal[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [playlist, setPlaylist] = useState<VideoItem[]>([]);
  const [videoIdx, setVideoIdx] = useState(0);

  const [daily, setDaily] = useState<any>(null);
  const [err, setErr] = useState<string>("");

  const svcPerPage = 10;
  const [svcPage, setSvcPage] = useState(0);

  const rootRef = useRef<HTMLDivElement | null>(null);

  // API hívások:
  // - Dev módban a React külön porton fut (pl. :3000/:3001), a backend pedig :5000-on.
  // - Ha relatív /api/* URL-t hívsz proxy nélkül, a React dev szerver index.html-t (<!doctype ...>) ad vissza,
  //   és ettől kapsz: "Unexpected token '<' ... not valid JSON".
  //
  // Megoldás: állíts be REACT_APP_API_ORIGIN-t (pl. http://localhost:5000),
  // és minden API hívás ehhez az originhez menjen. Productionben hagyhatod üresen.
  // 1) Build-time beállítás (Render / local): REACT_APP_API_ORIGIN=https://kleoszalon-api-jon.onrender.com
  // 2) Fallback: ha a kijelző oldal a frontend domainen fut (onrender), automatikusan a backend onrender domainre megy.
  const ENV_API_ORIGIN = (process.env.REACT_APP_API_ORIGIN ?? "").replace(/\/$/, "");
  const AUTO_API_ORIGIN = (() => {
    try {
      const host = window.location.hostname;
      // Frontend static site → backend service
      if (host === "kleoszalon-frontend.onrender.com") return "https://kleoszalon-api-jon.onrender.com";
      // Local dev: ha a frontend nem a :5000-on fut, de nincs env beállítva, próbáljuk a :5000-at
      if ((host === "localhost" || host === "127.0.0.1") && window.location.port !== "5000") {
        return "http://localhost:5000";
      }
    } catch {
      // ignore
    }
    return "";
  })();

  const API_ORIGIN = ENV_API_ORIGIN || AUTO_API_ORIGIN;
  const apiUrl = (path: string) => (API_ORIGIN ? `${API_ORIGIN}${path}` : path);

  async function fetchJson(path: string) {
    const url = apiUrl(path);
    const res = await fetch(url, { cache: "no-store", credentials: "include" });
    const text = await res.text();

    if (!res.ok) {
      throw new Error(`API ${res.status} @ ${url}: ${text.slice(0, 200)}`);
    }
    try {
      return JSON.parse(text);
    } catch {
      // tipikusan itt látszik: "<!doctype html>..."
      throw new Error(`API nem JSON @ ${url}. Első 200 karakter: ${text.slice(0, 200)}`);
    }
  }

  useEffect(() => {
    const applyScale = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const sx = w / 3840;
      const sy = h / 1080;
      const s = Math.min(sx, sy);
      rootRef.current?.style.setProperty("--scale", String(s));
    };
    applyScale();
    window.addEventListener("resize", applyScale);
    return () => window.removeEventListener("resize", applyScale);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const svcPages = useMemo(() => {
    const out: ServiceItem[][] = [];
    for (let i = 0; i < services.length; i += svcPerPage) out.push(services.slice(i, i + svcPerPage));
    return out.length ? out : [[]];
  }, [services]);

  const currentServices = svcPages[svcPage] || [];

  const shownDeals = useMemo(() => {
    const slots = 4;
    const arr: (Deal | null)[] = [];
    for (let i = 0; i < slots; i++) arr.push(deals[i] || null);
    return arr;
  }, [deals]);

  const freeCount = useMemo(() => professionals.filter(isFree).length, [professionals]);

  const currentVideo = useMemo(() => {
    const list = playlist.length ? playlist : videos;
    if (!list.length) return null;
    const idx = Math.max(0, Math.min(videoIdx, list.length - 1));
    return list[idx];
  }, [playlist, videos, videoIdx]);

  async function loadAll() {
    try {
      setErr("");
      const [s, d, p, da, v] = await Promise.all([
        fetchJson("/api/signage/services"),
        fetchJson("/api/signage/deals"),
        fetchJson("/api/signage/professionals"),
        fetchJson("/api/signage/daily"),
        fetchJson("/api/signage/videos"),
      ]);

      setServices(Array.isArray(s?.services) ? s.services : []);
      const fetchedAt = s?.fetchedAt ? new Date(s.fetchedAt).toLocaleString("hu-HU") : "";
      setServicesMeta(fetchedAt ? `Frissítve: ${fetchedAt}` : "");
      setDeals(Array.isArray(d?.deals) ? d.deals : []);
      setProfessionals(Array.isArray(p?.professionals) ? p.professionals : []);
      setDaily(da);
      setVideos(Array.isArray(v?.videos) ? v.videos : []);
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const tRefresh = setInterval(loadAll, 60_000);
    const tSvc = setInterval(() => setSvcPage(p => (p + 1) % svcPages.length), 12_000);
    return () => { clearInterval(tRefresh); clearInterval(tSvc); };
  }, [svcPages.length]);

  useEffect(() => {
    const enabled = (videos || []).filter(v => v.youtube_id);
    if (!enabled.length) { setPlaylist([]); setVideoIdx(0); return; }
    setPlaylist(shuffle(enabled));
    setVideoIdx(0);
  }, [videos]);

  useEffect(() => {
    if (!currentVideo) return;
    const ms = Math.max(10, Number(currentVideo.duration_sec || 60)) * 1000;
    const t = setTimeout(() => {
      const list = playlist.length ? playlist : videos;
      if (!list.length) return;
      if (videoIdx + 1 >= list.length) {
        setPlaylist(shuffle(list));
        setVideoIdx(0);
      } else {
        setVideoIdx(videoIdx + 1);
      }
    }, ms);
    return () => clearTimeout(t);
  }, [currentVideo, playlist, videos, videoIdx]);

  return (
    <div className="sgViewport">
      <div className="sgCanvas" ref={rootRef}>
        <header className="sgTopbar">
          <div className="sgBrand">
            <img className="sgLogo" src="/images/kleo_logo@2x.png" alt="KLEO" />
            <div className="sgSubtitle">Szolgáltatások • Napi akciók • Szakemberek</div>
          </div>
          <div className="sgClock">
            <div className="sgDate">{huDate(clock)}</div>
            <div className="sgTime">{huTime(clock)}</div>
          </div>
        </header>

        <main className="sgGrid">
          <section className="sgPanel sgServices">
            <div className="sgPanelHeader">
              <h2>Szolgáltatások</h2>
              <div className="sgMeta">{servicesMeta}</div>
            </div>

            <div className="sgSvcList">
              {currentServices.map((s) => (
                <div className="sgSvcRow" key={s.id}>
                  <div className="sgSvcName">{s.name}</div>
                  <div className="sgSvcMeta">
                    <span className="sgChip">{s.category || ""}</span>
                    {s.durationMin ? <span className="sgChipLite">{s.durationMin} perc</span> : null}
                  </div>
                  <div className="sgSvcPrice">{s.price_text || ""}</div>
                </div>
              ))}
              {!services.length && <div className="sgEmpty">Nincs megjeleníthető szolgáltatás.</div>}
            </div>

            <div className="sgFooter">
              <div className="sgHint">Oldal: {svcPage + 1}/{svcPages.length}</div>
              <div className="sgSite">kleoszalonok.hu</div>
            </div>
          </section>

          <section className="sgPanel sgVideo">
            <div className="sgPanelHeader">
              <h2>Kleo Fitness</h2>
              <div className="sgMeta">{currentVideo ? (currentVideo.title || currentVideo.youtube_id) : "Nincs videó"}</div>
            </div>
            <div className="sgVideoWrap">
              {currentVideo ? (
                <iframe
                  className="sgVideoFrame"
                  src={makeEmbedUrl(currentVideo.youtube_id)}
                  title="Kleo video"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <div className="sgEmpty">Adj hozzá videót az admin felületen.</div>
              )}
            </div>
            <div className="sgVideoFooter">
              <div className="sgPill">Mai akciók: <b>{deals.length || 0}</b></div>
              <div className="sgPill">Szabad szakember: <b>{freeCount}</b></div>
            </div>
          </section>

          <aside className="sgRightGrid">
            <section className="sgPanel sgDeals">
              <div className="sgPanelHeader">
                <h2 className="sgDealsTitleBig">Napi akciók</h2>
                <div className="sgMeta">4 kiemelt ajánlat</div>
              </div>

              <div className="sgDealList">
                {shownDeals.map((p, idx) => (
                  <div className="sgDealRow" key={idx}>
                    <div className="sgStripe" />
                    <div className="sgDealRowMain">
                      <div className="sgDealTitle sgDealTitleBig">{p ? p.title : "Hamarosan"}</div>
                      <div className="sgDealSub">{p ? (p.subtitle || "") : "Új napi akció"}</div>
                    </div>
                    <div className="sgDealRowPrice sgDealRowPriceBig">{p ? (p.price_text || "") : "—"}</div>
                  </div>
                ))}
              </div>
            </section>

            <div className="sgRightCol">
              <section className="sgPanel sgPros">
                <div className="sgPanelHeader">
                  <h2>Elérhető szakemberek</h2>
                  <div className="sgMeta">Ma</div>
                </div>

                <div className="sgProList sgProBig">
                  {professionals.slice(0, 6).map((p) => {
                    const free = isFree(p);
                    return (
                      <div className="sgProRow sgProRowBig" key={p.id}>
                        <span className={`sgDot ${free ? "sgDotGreen" : "sgDotRed"}`} />
                        <div className="sgProMain">
                          <div className="sgProName sgProNameBig">{p.name}</div>
                          <div className="sgProMeta">
                            <span className="sgChip">{p.title || "Szakember"}</span>
                            {p.note ? <span className="sgChipLite">{p.note}</span> : null}
                            <span className={`sgStatus ${free ? "sgStatusFree" : "sgStatusBusy"}`}>
                              {free ? "Szabad" : "Foglalt"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {!professionals.length && <div className="sgEmpty">Nincs rögzített szakember.</div>}
                </div>
              </section>

              <div className="sgRightSpacer" />
            </div>
          </aside>
        </main>

        <footer className="sgTicker">
          <div className="sgMarquee">
            Minden ami szépség, csak Neked! • Foglalás: online vagy a pultnál •
            Testépítés: {daily?.fitness?.text || "A fegyelem akkor is dolgozik, amikor a motiváció eltűnik."}
            • Szépségipar: {daily?.beauty?.text || "A konzisztens rutin többet ér, mint a ritka csodamegoldás."}
          </div>
        </footer>

        {err ? <div className="sgError">Hiba: {err}</div> : null}
      </div>
    </div>
  );
};

export default SignagePage;
