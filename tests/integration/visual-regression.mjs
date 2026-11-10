import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {renderFrames,closeRenderer} from '../../packages/engine/dist/render.js';
import {startEngine} from '../helpers/engine.mjs';
import {visualFixtures} from '../helpers/visual-fixtures.mjs';
import {comparePixels,decodePNG,encodePNG,VISUAL_THRESHOLD} from '../helpers/pixel-diff.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),dir=path.join(root,'tests/visual-baselines'),output=path.join(root,'dist/visual-regression'),update=process.argv.includes('--update');
const manifestPath=path.join(dir,'manifest.json');
if(!update&&!fs.existsSync(manifestPath))throw Error('缺少视觉基准。首次建立请显式执行 npm run visual:update 并审阅 PNG。');
const manifest=update?{threshold:VISUAL_THRESHOLD,platform:process.platform,arch:process.arch,renderer:JSON.parse(fs.readFileSync(path.join(root,'node_modules/remotion/package.json'),'utf8')).version,fonts:Object.fromEntries(fs.readdirSync(path.join(root,'packages/engine/fonts')).filter(n=>n.endsWith('.woff2')).map(n=>[n,createHash('sha256').update(fs.readFileSync(path.join(root,'packages/engine/fonts',n))).digest('hex')])),frames:{}}:JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const engine=await startEngine(),report=[];fs.mkdirSync(output,{recursive:true});
try{
 const pending=[];
 for(const fixture of visualFixtures()){
  const frame=await renderFrames({timeline:fixture.timeline,seconds:[fixture.time],format:'png',maxSize:960,fontsBase:engine.base+'/fonts',mathBase:engine.base,assetBase:engine.base+'/assets/'}),file=path.join(dir,fixture.id+'.png');
  if(update){pending.push({fixture,frame,file});continue;}
  const expected=manifest.frames[fixture.id];if(!expected||!fs.existsSync(file))throw Error('缺少基准 '+fixture.id);
  const hash=createHash('sha256').update(fs.readFileSync(file)).digest('hex');if(hash!==expected.sha256)throw Error('基准 PNG 被修改但 manifest 未更新：'+fixture.id);
  let result;if(frame.width!==expected.width||frame.height!==expected.height)result={passed:false,reason:'图像尺寸变化'};
  else{const {diff,...metrics}=comparePixels(decodePNG(fs.readFileSync(file)),decodePNG(frame.buffer),manifest.threshold);result=metrics;if(!metrics.passed)fs.writeFileSync(path.join(output,fixture.id+'-diff.png'),encodePNG(diff,frame.width,frame.height));}
  report.push({id:fixture.id,...result});if(!result.passed)fs.writeFileSync(path.join(output,fixture.id+'-actual.png'),frame.buffer);console.log(`${result.passed?'PASS':'FAIL'} ${fixture.id}`,result);
 }
 if(update){fs.mkdirSync(dir,{recursive:true});for(const {fixture,frame,file} of pending){fs.writeFileSync(file,frame.buffer);manifest.frames[fixture.id]={width:frame.width,height:frame.height,time:fixture.time,sha256:createHash('sha256').update(frame.buffer).digest('hex')};}fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');console.log('已显式更新 '+pending.length+' 张基准，请审阅 tests/visual-baselines/*.png。');}
 else{fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');if(report.some(r=>!r.passed))process.exitCode=1;}
}finally{await closeRenderer();await engine.stop();}
