import fs from 'fs';
import path from 'path';

const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('frontend deploy publishes authenticated Release Control Center evidence',()=>{
 const yml=read('.github/workflows/render-deploy.yml');
 expect(yml).toContain('id-token: write');
 expect(yml).toContain('Publish frontend evidence to Release Control Center');
 expect(yml).toContain('audience=kleoszalon-release-control');
 expect(yml).toContain('version.frontend');
 expect(yml).toContain('tests.frontend');
 expect(yml).toContain('build.frontend');
 expect(yml).toContain('/api/uat/release-control/evidence');
 expect(yml).toContain('/api/transactions/release-control');
 expect(yml).toContain('RENDER_FRONTEND_DEPLOY_HOOK_URL secret is not configured');
});
