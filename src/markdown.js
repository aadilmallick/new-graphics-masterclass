import MarkdownIt from 'markdown-it';
import katex from 'katex';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import glsl from 'highlight.js/lib/languages/glsl';
import xml from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
hljs.registerLanguage('javascript',javascript);hljs.registerLanguage('js',javascript);hljs.registerLanguage('glsl',glsl);hljs.registerLanguage('html',xml);hljs.registerLanguage('svg',xml);hljs.registerLanguage('xml',xml);hljs.registerLanguage('sh',bash);hljs.registerLanguage('bash',bash);hljs.registerLanguage('json',json);
export const escapeHTML=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function highlight(code,language='javascript'){return hljs.getLanguage(language)?hljs.highlight(code,{language}).value:escapeHTML(code);}
const md=new MarkdownIt({html:false,linkify:false,typographer:false,highlight:(code,lang)=>highlight(code,lang)});
function renderMath(content,displayMode){return katex.renderToString(content,{displayMode,throwOnError:false,strict:'ignore',trust:false,output:'htmlAndMathml'});}
md.inline.ruler.after('escape','math_inline',(state,silent)=>{
  const start=state.pos;if(state.src[start]!=='$'||state.src[start+1]==='$')return false;
  let end=start+1;while((end=state.src.indexOf('$',end))!==-1&&state.src[end-1]==='\\')end++;
  if(end<0||state.src.slice(start+1,end).includes('\n'))return false;
  if(!silent){const token=state.push('math_inline','math',0);token.content=state.src.slice(start+1,end);}state.pos=end+1;return true;
});
md.block.ruler.before('fence','math_block',(state,start,end,silent)=>{
  const line=state.src.slice(state.bMarks[start]+state.tShift[start],state.eMarks[start]).trim();if(line!=='$$')return false;if(silent)return true;
  let next=start+1;while(next<end&&state.src.slice(state.bMarks[next]+state.tShift[next],state.eMarks[next]).trim()!=='$$')next++;
  if(next===end)return false;const token=state.push('math_block','math',0);token.block=true;token.content=state.getLines(start+1,next,0,false);token.map=[start,next+1];state.line=next+1;return true;
},{alt:['paragraph','reference','blockquote','list']});
md.renderer.rules.math_inline=(tokens,index)=>renderMath(tokens[index].content,false);
md.renderer.rules.math_block=(tokens,index)=>`<div class="equation">${renderMath(tokens[index].content,true)}</div>`;
const defaultImage=md.renderer.rules.image;md.renderer.rules.image=(tokens,index,options,env,self)=>{const token=tokens[index],src=token.attrGet('src');if(src?.startsWith('../public/'))token.attrSet('src',`${import.meta.env.BASE_URL}${src.slice(10)}`);token.attrSet('loading','lazy');return defaultImage(tokens,index,options,env,self);};
const originalLink=md.renderer.rules.link_open||((tokens,i,options,env,self)=>self.renderToken(tokens,i,options));
md.renderer.rules.link_open=(tokens,i,options,env,self)=>{const token=tokens[i],href=token.attrGet('href');if(href?.startsWith('https://')){token.attrSet('target','_blank');token.attrSet('rel','noopener noreferrer');}if(href?.endsWith('.md')){const file=href.split('/').pop();token.attrSet('href',`#/lesson/${file.match(/^\d\d-/)?.[0].slice(0,2)||file.replace('.md','')}`);}return originalLink(tokens,i,options,env,self);};
md.core.ruler.push('heading_ids',state=>{const used=new Map();state.tokens.forEach((token,i)=>{if(token.type==='heading_open'){const text=state.tokens[i+1]?.content||'';const base=text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const n=used.get(base)||0;used.set(base,n+1);token.attrSet('id',base+(n?`-${n}`:''));}});});
export const renderMarkdown=text=>md.render(text);
