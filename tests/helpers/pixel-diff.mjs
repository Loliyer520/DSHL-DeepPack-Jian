import {execFileSync} from 'node:child_process';
export const VISUAL_THRESHOLD={channelDelta:16,maxChangedRatio:.003,maxMeanDelta:.3};
export function comparePixels(expected,actual,threshold=VISUAL_THRESHOLD){
 if(expected.length!==actual.length||expected.length%3)throw new Error('图像尺寸或 RGB 数据不一致');
 const diff=Buffer.alloc(actual.length);let changed=0,sum=0;
 for(let i=0;i<actual.length;i+=3){let max=0;for(let c=0;c<3;c++){const delta=Math.abs(actual[i+c]-expected[i+c]);max=Math.max(max,delta);sum+=delta;}if(max>threshold.channelDelta){changed++;diff[i]=255;diff[i+1]=40;diff[i+2]=120;}else for(let c=0;c<3;c++)diff[i+c]=Math.round(actual[i+c]*.2);}
 const changedRatio=changed/(actual.length/3),meanDelta=sum/actual.length;
 return {changedRatio,meanDelta,passed:changedRatio<=threshold.maxChangedRatio&&meanDelta<=threshold.maxMeanDelta,diff};
}
export function decodePNG(buffer){return execFileSync('ffmpeg',['-v','error','-threads','1','-i','pipe:0','-f','rawvideo','-pix_fmt','rgb24','-threads','1','pipe:1'],{input:buffer,maxBuffer:64*1024*1024});}
export function encodePNG(buffer,width,height){return execFileSync('ffmpeg',['-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',`${width}x${height}`,'-i','pipe:0','-frames:v','1','-f','image2pipe','-vcodec','png','-threads','1','pipe:1'],{input:buffer,maxBuffer:64*1024*1024});}
