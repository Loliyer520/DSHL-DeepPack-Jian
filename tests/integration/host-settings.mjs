import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
// Usage: node tests/integration/host-settings.mjs <installed-profile> <launcher-dsh-package>
// A separate CLI installation is essential: a same-directory boot misses the regression.
const [profileSource, cliSource] = process.argv.slice(2).map(value => path.resolve(value));
assert(profileSource && cliSource, 'Pass the installed profile and separate launcher DSH package');
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'djian-settings-check-'));
const profile = path.join(home, 'profiles', 'djian');
fs.mkdirSync(profile, {recursive: true});
for (const file of ['package.json','cordis.patch.yml']) fs.copyFileSync(path.join(profileSource,file),path.join(profile,file));
fs.symlinkSync(path.join(profileSource,'node_modules'),path.join(profile,'node_modules'),process.platform==='win32'?'junction':'dir');
const previousCwd=process.cwd(); process.chdir(profile);
process.env.DSH_HOME=home; process.env.DJIAN_LLM_KEY='local-regression-test';
const entry=fs.readdirSync(path.join(cliSource,'lib')).find(name=>name.startsWith('profile-boot-')&&name.endsWith('.js'));
assert(entry, 'Expected DSH 0.2 profile boot entry');
const savedLog=console.log; console.log=()=>{}; // Startup prints a private access URL.
const {o:runProfile}=await import(pathToFileURL(path.join(cliSource,'lib',entry)));
const environment={get:n=>process.env[n]===undefined?undefined:{value:process.env[n]},getFrom:n=>process.env[n]===undefined?undefined:{value:process.env[n]}};
let app;
try {
 app=await runProfile({profile:'djian',patchFiles:[],args:['--no-open','--port','0'],environment});
 const settings=app.ctx.get('settings'); assert(settings,'Settings service unavailable');
 await settings.update('ui-settings-general',{welcomeNoticeVersion:'2026-09-28.1'});
 for(const preference of ['light','dark']) await settings.update('ui-theme',{preference});
 const document=fs.readFileSync(path.join(profile,'cordis.patch.yml'),'utf8');
 assert(document.includes('2026-09-28.1'),'Welcome acknowledgement not persisted');
 assert(/preference:\s*dark/.test(document),'Dark palette not persisted');
 const connection=app.ctx.get('connection');const server=app.ctx.get('webServer');
 assert(connection&&server,'Web host not ready');
 const url=connection.authenticatedUrl(`http://127.0.0.1:${server.port}/`);
 let response=await fetch(url,{redirect:'manual'});
 const cookie=response.headers.get('set-cookie')?.split(';')[0];assert(cookie,'Access token not exchanged');
 response=await fetch(new URL('/',url),{headers:{Cookie:cookie}});assert.equal(response.status,200);
 const html=await response.text();assert(html.includes("const preference = \"dark\"")||html.includes("const preference = 'dark'"),'HTML boot palette is not dark');
 savedLog('PASS separate launcher/profile: welcome save, light/dark save, durable patch, dark HTML bootstrap');
} finally {
 if(app)await app.ctx.fiber.dispose();console.log=savedLog;process.chdir(previousCwd);
 assert(home.startsWith(path.join(os.tmpdir(),'djian-settings-check-')));
 fs.rmSync(home,{recursive:true,force:true});
}
