import fs from 'fs';
import path from 'path';

const source=fs.readFileSync(path.join(process.cwd(),'src/api/api.ts'),'utf8');

describe('API unauthorized session handling',()=>{
  it('clears stale authenticated browser state on protected 401 responses',()=>{
    expect(source).toContain('clearLocalAuthenticatedSession');
    expect(source).toContain('hasStoredAuthToken()');
    expect(source).toContain('error?.response?.status === 401');
    expect(source).toContain('window.location.replace("/login?reason=session-expired")');
  });

  it('does not turn login or public booking 401 responses into forced session redirects',()=>{
    expect(source).toContain('isLoginRequest=/\\/login(?:\\?|$)/i.test(requestUrl)');
    expect(source).toContain('!isLoginRequest&&!isPublicBookingPage()&&hasStoredAuthToken()');
  });

  it('keeps authorization failures distinct from authentication expiry',()=>{
    const unauthorizedBlock=source.slice(source.indexOf('if (error?.response?.status === 401)'),source.indexOf('redirectInventoryLotWorkflow(error)'));
    expect(unauthorizedBlock).not.toContain('403');
  });
});
