export function cjkSpace(s:string):string{return s.replace(/([\p{Script=Han}])([A-Za-z0-9])/gu,'$1\u2009$2').replace(/([A-Za-z0-9])([\p{Script=Han}])/gu,'$1\u2009$2');}
export function keepNumbers(s:string):string{return s.replace(/\d+(?:[.,:/-]\d+)*(?:\s*(?:%|％|km\/h|km|px|ms|kg|MB|GB|cm|mm|°C|秒|分钟|元|万|亿))?/g,s=>s.replace(/ /g,'\u00a0').split('').join('\u2060'));}
export function balancedTitle(text:string):string{if(text.includes('\n')||/[<>{}*\[\]=]/.test(text)||text.length<10)return text;const chars=Array.from(text),mid=chars.length/2,candidates=[];for(let i=1;i<chars.length;i++){if(/[（《【“‘(\dA-Za-z]/.test(chars[i-1])||/[，。！？、；：）》】”’)%\dA-Za-z]/.test(chars[i]))continue;candidates.push(i);}const n=candidates.sort((a,b)=>Math.abs(a-mid)-Math.abs(b-mid))[0];return n?chars.slice(0,n).join('').trimEnd()+'\n'+chars.slice(n).join('').trimStart():text;}

/** Conservative line measurement; never truncates authored text. */
export function measureText(text:string,fontSize:number,width:number,lineHeight=1.4,letterSpacing=0):{lines:number;height:number;overflowWidth:boolean}{
 const plain=text.replace(/\*\*|==|\[#[^\]]*\]|\[\/\]/g,'');
 const tokens=plain.match(/\n|\d+(?:[.,:/-]\d+)*(?:[ \u2009]*(?:km\/h|km|px|ms|kg|MB|GB|%|％|°C|秒|分钟|元|万|亿))?|[A-Za-z]+|[^\n]/gu)??[];
 let lines=1,used=0,overflowWidth=false;
 for(const token of tokens){if(token==='\n'){lines++;used=0;continue;}const n=Array.from(token).reduce((v,c)=>v+fontSize*(c==='\u2009'?.2:/\s/.test(c)?.35:/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(c)?1.08:/[MW@#%]/.test(c)?.9:/[ilI.,'!:;]/.test(c)?.35:.65)+fontSize*letterSpacing,0);if(n>width)overflowWidth=true;if(used>0&&used+n>width&&!/^[，。！？、；：）》】”’]/.test(token)){lines++;used=0;}used+=n;}
 return {lines,height:lines*fontSize*lineHeight,overflowWidth};
}
export function fitText(text:string,width:number,height:number,preferred:number,min:number,maxLines:number,autoShrink=true,lineHeight=1.4,letterSpacing=0){
 const measure=(size:number)=>measureText(text,size,Math.max(1,width),lineHeight,letterSpacing);
 preferred=Math.max(min,preferred);let fontSize=preferred,m=measure(fontSize);
 const fits=(v:ReturnType<typeof measure>)=>v.height<=height&&v.lines<=maxLines&&!v.overflowWidth;
 if(autoShrink&&!fits(m)){let lo=Math.min(min,preferred),hi=preferred;for(let i=0;i<16;i++){const mid=(lo+hi)/2;if(fits(measure(mid)))lo=mid;else hi=mid;}fontSize=Math.floor(lo*10)/10;m=measure(fontSize);}
 return {...m,fontSize,overflow:!fits(m)};
}
