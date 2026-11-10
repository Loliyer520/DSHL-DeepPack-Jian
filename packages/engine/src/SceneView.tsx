import React from 'react';
import type {Overlay} from './schema';
import {RenderQuality} from './AmbientEffects';
import {projectScene} from './scene3d';
export function SceneView({scene,seconds,width,height}:{scene:NonNullable<Overlay['scene3d']>;seconds:number;width:number;height:number}){
 const quality=React.useContext(RenderQuality);
 return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position:'absolute',inset:0,overflow:'hidden'}}>{projectScene(scene,seconds+(scene.timeOffset??0),width,height,quality).map((f,i)=><polygon key={i} points={f.points.map(p=>p.join(',')).join(' ')} fill={f.wireframe?'none':f.color} stroke={f.color} strokeWidth={f.wireframe?1:.4} opacity={f.opacity} strokeLinejoin="round"/>)}</svg>;
}
