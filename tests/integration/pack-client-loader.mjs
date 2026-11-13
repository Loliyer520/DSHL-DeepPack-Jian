// Validate the client payload that users actually install, after both ZIP and tgz packaging.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const pack=path.resolve(process.argv[2]);
const read=name=>execFileSync('unzip',['-p',pack,name],{maxBuffer:64*1024*1024});
const manifest=JSON.parse(read('manifest.json'));
const index=JSON.parse(read('vendor/vendor.json'));
const descriptor=index.packages.find(p=>p.name==='@djian/client-ui-timeline');
const payload=read('vendor/'+descriptor.file);
assert.equal(createHash('sha256').update(payload).digest('hex'),descriptor.sha256);
const bundle=execFileSync('tar',['-xzO','package/lib/client.js'],{input:payload,maxBuffer:8*1024*1024});
const pkg=JSON.parse(execFileSync('tar',['-xzO','package/package.json'],{input:payload}));
assert.equal(pkg.version,descriptor.version);
assert.equal(manifest.dependencies[pkg.name],'vendor:'+descriptor.file);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dj-pack-client-'));
try {
  const filename=path.join(tmp,'client.js');fs.writeFileSync(filename,bundle);
  execFileSync(process.execPath,['--test','tests/client-host-loader.test.mjs'],{env:{...process.env,DJIAN_TIMELINE_BUNDLE:filename},stdio:'inherit'});
  console.log(`PASS installed payload: ${manifest.version}, ${pkg.name}@${pkg.version}, verified vendor checksum`);
} finally {fs.rmSync(tmp,{recursive:true,force:true});}
