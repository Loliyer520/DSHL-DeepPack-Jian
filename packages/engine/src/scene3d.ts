import type { Overlay } from './schema.js';
import type { Quality } from './ambient.js';
type V=[number,number,number];
type Scene=NonNullable<Overlay['scene3d']>;
const add=(a:V,b:V):V=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a:V,b:V):V=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a:V,b:V)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:V,b:V):V=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=(v:V):V=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n) as V;};
function rotate(v:V,r:V):V{let [x,y,z]=v;for(let axis=0;axis<3;axis++){const a=r[axis]*Math.PI/180,c=Math.cos(a),s=Math.sin(a);if(axis===0)[y,z]=[y*c-z*s,y*s+z*c];else if(axis===1)[x,z]=[x*c+z*s,-x*s+z*c];else [x,y]=[x*c-y*s,x*s+y*c];}return [x,y,z];}
function mesh(kind:'cube'|'sphere'|'plane',quality:Quality):V[][]{
 if(kind==='plane')return [[[-2,0,-2],[-2,0,2],[2,0,2]],[[-2,0,-2],[2,0,2],[2,0,-2]]];
 if(kind==='cube'){const v:V[]=[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]];return [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]].flatMap(([a,b,c,d])=>[[v[a],v[b],v[c]],[v[a],v[c],v[d]]]);}
 const rows=quality==='draft'?6:quality==='standard'?10:16,cols=rows*2,out:V[][]=[];
 const point=(i:number,j:number):V=>{const p=i/rows*Math.PI,a=j/cols*Math.PI*2;return [.5*Math.sin(p)*Math.cos(a),.5*Math.cos(p),.5*Math.sin(p)*Math.sin(a)];};
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=point(i,j),b=point(i+1,j),c=point(i+1,j+1),d=point(i,j+1);out.push([a,d,b],[d,c,b]);}return out;
}
export interface ProjectedTriangle {points:[number,number][];depth:number;color:string;opacity:number;wireframe:boolean;object:string;}
/** CPU projection of actual triangle meshes. No accumulated state or WebGL dependency. */
export function projectScene(scene:Scene,seconds:number,width:number,height:number,quality:Quality='full'):ProjectedTriangle[]{
 const cam=scene.camera??{},yaw=((cam.yaw??35)+(cam.orbit??0)*seconds)*Math.PI/180,pitch=(cam.pitch??25)*Math.PI/180,d=cam.distance??6,target:V=cam.target??[0,0,0];
 const eye=add(target,[Math.sin(yaw)*Math.cos(pitch)*d,Math.sin(pitch)*d,Math.cos(yaw)*Math.cos(pitch)*d]),forward=unit(sub(target,eye)),right=unit(cross(forward,[0,1,0])),up=cross(right,forward);
 const focal=Math.min(width,height)/2/Math.tan((cam.fov??45)*Math.PI/360),light=unit(scene.light?.direction??[-1,2,3]),ambient=scene.light?.ambient??.25,intensity=scene.light?.intensity??.8;
 const out:ProjectedTriangle[]=[];
 for(const object of scene.objects){const r:V=(object.rotation??[0,0,0]).map((x,i)=>x+(object.spin?.[i]??0)*seconds) as V,scale=object.scale??1,pos:V=object.position??[0,0,0];
  for(const face of mesh(object.geometry,quality)){const world=face.map(v=>add(rotate(v.map(x=>x*scale) as V,r),pos)),normal=unit(cross(sub(world[1],world[0]),sub(world[2],world[0])));
   if(object.geometry!=='plane'&&dot(normal,sub(eye,world[0]))<=0)continue;
   const view=world.map(v=>{const p=sub(v,eye);return [dot(p,right),dot(p,up),dot(p,forward)] as V;});if(view.some(v=>v[2]<.05))continue;
   const shade=Math.max(0,Math.min(1,ambient+intensity*Math.max(0,dot(normal,light))));
   const color='#'+[1,3,5].map(i=>Math.round(parseInt(object.color.slice(i,i+2),16)*shade).toString(16).padStart(2,'0')).join('');
   out.push({points:view.map(v=>[width/2+v[0]/v[2]*focal,height/2-v[1]/v[2]*focal]),depth:view.reduce((n,v)=>n+v[2],0)/3,color,opacity:object.opacity??1,wireframe:!!object.wireframe,object:object.id});
  }
 }return out.sort((a,b)=>b.depth-a.depth);
}
