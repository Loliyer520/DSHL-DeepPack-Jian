import type {Timeline} from './schema.js';
/** RFC4180 quoting, BOM, CRLF, embedded commas/newlines, strict row width. */
export function parseBatch(text:string,format:'csv'|'json'):Record<string,string>[] {
 if(text.length>1_000_000)throw new Error('数据文件最多 1MB');
 let rows:unknown;
 if(format==='json')rows=JSON.parse(text.replace(/^\uFEFF/,''));
 else {
  const table:string[][]=[];let row:string[]=[],field='',quoted=false,closed=false;
  text=text.replace(/^\uFEFF/,'');
  for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
   if(c==='"'){if(field||closed)throw new Error('CSV 引号位置错误');quoted=true;}else if(c===','||c==='\n'||c==='\r'){row.push(field);field='';closed=false;if(c!==','){if(c==='\r'&&text[i+1]==='\n')i++;table.push(row);row=[];}}else{if(closed)throw new Error('CSV 引号后有多余字符');field+=c;}}
  if(quoted)throw new Error('CSV 引号未闭合');if(field||row.length||closed){row.push(field);table.push(row);}
  const headers=table.shift()?.map(h=>h.trim())??[];if(!headers.length||headers.some(h=>!h)||new Set(headers).size!==headers.length)throw new Error('CSV 表头不能为空或重复');
  rows=table.filter(r=>r.some(Boolean)).map((r,i)=>{if(r.length!==headers.length)throw new Error(`CSV 第 ${i+2} 行列数不匹配`);return Object.fromEntries(headers.map((h,j)=>[h,r[j]]));});
 }
 if(!Array.isArray(rows)||!rows.length||rows.length>100)throw new Error('需要 1–100 条数据');
 return rows.map((r,i)=>{if(!r||typeof r!=='object'||Array.isArray(r))throw new Error(`第 ${i+1} 条必须是对象`);return Object.fromEntries(Object.entries(r).map(([k,v])=>{if(!['string','number','boolean'].includes(typeof v)&&v!==null)throw new Error('数据值只能是文字、数字或布尔值');return [k,v===null?'':String(v)];}));});
}
export function batchVariant(t:Timeline,row:Record<string,string>):Timeline{
 const visit=(v:any):any=>{if(typeof v==='string')return v.replace(/\{\{\s*([^{}]+?)\s*\}\}/g,(_,key)=>{if(!Object.hasOwn(row,key))throw new Error('缺少数据列：'+key);return row[key];});if(Array.isArray(v))return v.map(visit);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,val])=>[k,k==='timeline'&&typeof val==='string'?JSON.stringify(visit(JSON.parse(val))):visit(val)]));return v;};
 return visit(t);
}
