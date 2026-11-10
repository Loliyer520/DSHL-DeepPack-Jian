/** Small copy-on-write transaction for JSON model objects. Never mutates its input. */
type State={base:any;copy:any;children:Map<PropertyKey,any>;path:string[];root:Root;proxy:any};
type Root={version:number;paths:Map<string,string[]>};
const states=new WeakMap<object,State>();
const object=(v:any)=>v!==null&&typeof v==='object';
function equivalent(a:any,b:any):boolean{
 if(a===b)return true;if(!object(a)||!object(b)||Array.isArray(a)!==Array.isArray(b))return false;
 if(Array.isArray(a)&&a.length!==b.length)return false;
 const ak=Object.keys(a).filter(k=>a[k]!==undefined),bk=Object.keys(b).filter(k=>b[k]!==undefined);
 return ak.length===bk.length&&ak.every(k=>Object.hasOwn(b,k)&&equivalent(a[k],b[k]));
}
export function draftInfo(value:object){const s=states.get(value);return s?{base:s.base,version:s.root.version,paths:[...s.root.paths.values()]}:undefined;}
function normalize(value:any):any{
 if(!object(value))return value;if(states.has(value))return finishDraft(value);
 let next=value;for(const key of Object.keys(value)){const v=normalize(value[key]);if(v!==value[key]){if(next===value)next=Array.isArray(value)?value.slice():{...value};next[key]=v;}}return next;
}
export function createDraft<T extends object>(base:T):T{return wrap(base,[],{version:0,paths:new Map()});}
function wrap(base:any,path:string[],root:Root):any{
 const s:State={base,copy:null,children:new Map(),path,root,proxy:null};
 const change=(key:PropertyKey)=>{s.copy??=Array.isArray(base)?base.slice():{...base};root.version++;const p=[...path,String(key)];root.paths.set(JSON.stringify(p),p);};
 s.proxy=new Proxy(Array.isArray(base)?[]:{},{
  get(_,key){const value=(s.copy??base)[key];if(!object(value))return value;const cached=s.children.get(key);if(cached&&states.get(cached)!.base===value)return cached;const child=wrap(value,[...path,String(key)],root);s.children.set(key,child);return child;},
  set(_,key,value){value=normalize(value);if(equivalent((s.copy??base)[key],value))return true;change(key);s.copy[key]=value;s.children.delete(key);return true;},
  deleteProperty(_,key){if(Object.hasOwn(s.copy??base,key)&&(s.copy??base)[key]!==undefined){change(key);delete s.copy[key];s.children.delete(key);}return true;},
  has:(_,key)=>key in (s.copy??base),ownKeys:()=>Reflect.ownKeys(s.copy??base),
  getOwnPropertyDescriptor(_,key){if(key==='length'&&Array.isArray(base))return {value:(s.copy??base).length,writable:true,enumerable:false,configurable:false};const d=Object.getOwnPropertyDescriptor(s.copy??base,key);return d?{...d,configurable:key==='length'&&Array.isArray(base)?false:true}:undefined;}
 });states.set(s.proxy,s);return s.proxy;
}
export function finishDraft<T>(value:T):T{
 if(!object(value))return value;const s=states.get(value as object);if(!s)return value;
 let out=s.copy??s.base;
 for(const [key,child] of s.children){if(!Object.hasOwn(out,key))continue;const next=finishDraft(child);if(next!==out[key]){if(out===s.base)out=Array.isArray(s.base)?s.base.slice():{...s.base};out[key]=next;}}
 // Setting back the original value is a genuine no-op.
 if(out!==s.base){const keys=Object.keys(out);if(keys.length===Object.keys(s.base).length&&keys.every(k=>Object.is(out[k],s.base[k])))return s.base;}
 return out;
}
export function cloneValue<T>(value:T):T{return structuredClone(normalize(value));}
