import fs from 'fs';
import path from 'path';

const source=fs.readFileSync(path.join(process.cwd(),'src/utils/fetch.ts'),'utf8');

describe('legacy fetch client parity',()=>{
  it('uses the same Render API origin fallback as the canonical client',()=>{
    expect(source).toContain('kleoszalon-frontend.onrender.com');
    expect(source).toContain('https://kleoszalon-api-1.onrender.com');
    expect(source).toContain('REACT_APP_API_ORIGIN');
  });

  it('supports the current-tab bearer fallback without reintroducing localStorage authorization headers',()=>{
    expect(source).toContain('getSessionBearerToken');
    expect(source).toContain('headers.set("Authorization",`Bearer ${bearer}`)');
    expect(source).toContain('export function authHeaders(): Record<string, string>');
    expect(source).toContain('return {};');
  });

  it('clears stale local auth and redirects protected 401 responses to login',()=>{
    expect(source).toContain('clearLocalAuthenticatedSession');
    expect(source).toContain('hasStoredAuthToken()');
    expect(source).toContain('window.location.replace("/login?reason=session-expired")');
  });

  it('keeps login and public booking 401 responses outside forced session recovery',()=>{
    expect(source).toContain('isLoginRequest(requestUrl)');
    expect(source).toContain('isPublicBookingPage()');
  });
});
