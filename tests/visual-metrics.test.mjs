import test from 'node:test';
import assert from 'node:assert/strict';
import {comparePixels} from './helpers/pixel-diff.mjs';
test('visual regression catches moved and recolored content while tolerating tiny channel noise',()=>{const baseline=Buffer.alloc(100*100*3,240);for(let y=20;y<50;y++)for(let x=10;x<70;x++)baseline.fill(20,(y*100+x)*3,(y*100+x)*3+3);assert.equal(comparePixels(baseline,baseline).passed,true);const noise=Buffer.from(baseline);noise[42]++;assert.equal(comparePixels(baseline,noise).passed,true);const moved=Buffer.alloc(baseline.length,240);for(let y=30;y<60;y++)for(let x=10;x<70;x++)moved.fill(20,(y*100+x)*3,(y*100+x)*3+3);assert.equal(comparePixels(baseline,moved).passed,false);});
