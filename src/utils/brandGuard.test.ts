import{APPROVED_BRAND_COLORS,DEFAULT_BRAND_ACCENT,DEFAULT_LOGO_ASSET,approvedBrandColor,approvedLogoAsset,enforceBrandGuard}from"./brandGuard";

describe("VIR brand guard",()=>{
 test("contains the approved handbook palette",()=>{
  expect(APPROVED_BRAND_COLORS).toEqual(expect.arrayContaining(["#b69861","#120c08","#ec008c"]));
 });
 test("rejects arbitrary colors and logo URLs by normalizing to approved defaults",()=>{
  expect(approvedBrandColor("#123456")).toBe(DEFAULT_BRAND_ACCENT);
  expect(approvedLogoAsset("https://example.com/logo.png")).toBe(DEFAULT_LOGO_ASSET);
  const safe=enforceBrandGuard({brand:{accent:"#123456",logo_url:"https://example.com/logo.png"}});
  expect(safe.brand?.accent).toBe(DEFAULT_BRAND_ACCENT);
  expect(safe.brand?.logo_url).toBe(DEFAULT_LOGO_ASSET);
 });
});
