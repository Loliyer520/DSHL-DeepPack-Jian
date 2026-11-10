import { type Pt, type SubPath } from './paths.js';
export type PathPoint = {sub:number;node:number;part:'anchor'|'c1'|'c2'};
const lerp=(a:Pt,b:Pt,t=.5):Pt=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
export function movePathPoint(paths:SubPath[],point:PathPoint,to:Pt,mirror=false):SubPath[]{
  const out=structuredClone(paths),s=out[point.sub];if(!s)return out;
  if(point.part==='anchor'){
    const old=point.node===0?s.start:s.segs[point.node-1]?.p;if(!old)return out;
    const dx=to[0]-old[0],dy=to[1]-old[1],shift=(p:Pt):Pt=>[p[0]+dx,p[1]+dy];
    if(point.node===0)s.start=to;else {s.segs[point.node-1].p=to;s.segs[point.node-1].c2=shift(s.segs[point.node-1].c2);}
    if(s.segs[point.node])s.segs[point.node].c1=shift(s.segs[point.node].c1);
  }else{
    const seg=s.segs[point.node];if(!seg)return out;seg[point.part]=to;
    if(mirror){
      const anchor=point.part==='c1'?(point.node===0?s.start:s.segs[point.node-1].p):seg.p;
      const opposite:Pt=[2*anchor[0]-to[0],2*anchor[1]-to[1]];
      if(point.part==='c1'&&point.node>0)s.segs[point.node-1].c2=opposite;
      if(point.part==='c2'&&s.segs[point.node+1])s.segs[point.node+1].c1=opposite;
    }
  }return out;
}
export function splitPathSegment(paths:SubPath[],sub:number,index:number):SubPath[]{
 const out=structuredClone(paths),s=out[sub],seg=s?.segs[index];if(!seg)return out;
 const p0=index===0?s.start:s.segs[index-1].p,a=lerp(p0,seg.c1),b=lerp(seg.c1,seg.c2),c=lerp(seg.c2,seg.p),d=lerp(a,b),e=lerp(b,c),p=lerp(d,e);
 s.segs.splice(index,1,{c1:a,c2:d,p},{c1:e,c2:c,p:seg.p});return out;
}
export function removePathNode(paths:SubPath[],sub:number,node:number):SubPath[]{
 const out=structuredClone(paths),s=out[sub];if(!s||s.segs.length<2)return out;
 if(node===0){s.start=s.segs.shift()!.p;return out;}
 if(node>s.segs.length)return out;s.segs.splice(node-1,1);
 const next=s.segs[node-1];if(next){const start=node===1?s.start:s.segs[node-2].p;next.c1=lerp(start,next.p,1/3);}return out;
}
export function appendPathNode(paths:SubPath[],to:Pt):SubPath[]{
 const out=structuredClone(paths);if(!out.length)return [{start:to,segs:[],closed:false}];
 const s=out[out.length-1],prev=s.segs.at(-1)?.p??s.start;s.segs.push({c1:lerp(prev,to,1/3),c2:lerp(prev,to,2/3),p:to});return out;
}
export function pathBounds(paths:SubPath[]):{x:number;y:number;w:number;h:number}{
 const pts=paths.flatMap(s=>[s.start,...s.segs.flatMap(seg=>[seg.c1,seg.c2,seg.p])]);
 if(!pts.length)return {x:-10,y:-10,w:120,h:120};
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(20,Math.max(...xs)-x),h=Math.max(20,Math.max(...ys)-y),pad=Math.max(w,h)*.12;
 return {x:x-pad,y:y-pad,w:w+pad*2,h:h+pad*2};
}
