import {readFile,access,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';import {fileURLToPath} from 'node:url';import katex from 'katex';
import {lessons,appendices,projects,labs} from '../src/catalog.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),failures=[],stats={coreLessons:lessons.length,referenceChapters:appendices.length,labs:labs.length,diagrams:0,projectBriefs:0,words:0,codeBlocks:0,equations:0};
const exists=async p=>{try{await access(path.join(root,p));return true;}catch{return false;}};
for(const lesson of [...lessons,...appendices,...projects]){
  const filename=`${lesson.directory||'course'}/${lesson.file}`;if(!await exists(filename)){failures.push(`Missing ${filename}`);continue;}
  const text=await readFile(path.join(root,filename),'utf8');if(!text.startsWith('# '))failures.push(`No title: ${filename}`);
  if(/being prepared|TODO|lorem ipsum|coming soon/i.test(text))failures.push(`Unfinished content: ${filename}`);
  const prose=text.replace(/```[\s\S]*?```/g,'');stats.words+=prose.split(/\s+/).filter(Boolean).length;stats.codeBlocks+=(text.match(/^```/gm)||[]).length/2;
  for(const match of text.matchAll(/\]\(#\/lab\/([\w-]+)\)/g))if(!labs.some(l=>l.id===match[1]))failures.push(`Unknown lab ${match[1]} in ${filename}`);
  for(const match of text.matchAll(/\]\(#\/lesson\/([\w-]+)\)/g))if(![...lessons,...appendices,...projects].some(l=>l.id===match[1]))failures.push(`Unknown lesson ${match[1]} in ${filename}`);
  for(const match of text.matchAll(/!\[[^\]]*\]\(\.\.\/public\/([^)]*)\)/g))if(!await exists(`public/${match[1]}`))failures.push(`Missing image ${match[1]} in ${filename}`);
  const mathBlocks=[...prose.matchAll(/^\$\$\r?\n([\s\S]*?)^\$\$/gm)].map(m=>m[1]);const inlineProse=prose.replace(/^\$\$\r?\n[\s\S]*?^\$\$/gm,'');const mathInline=[...inlineProse.matchAll(/(?<!\\)\$([^$\n]+)\$/g)].map(m=>m[1]);
  for(const expression of [...mathBlocks,...mathInline]){stats.equations++;try{katex.renderToString(expression,{throwOnError:true,strict:'ignore',trust:false});}catch(error){failures.push(`Math error ${filename}: ${error.message}`);}}
}
const ids=new Set();for(const lab of labs){if(ids.has(lab.id))failures.push(`Duplicate lab ${lab.id}`);ids.add(lab.id);if(!await exists(`labs/${lab.file}`))failures.push(`Missing lab ${lab.file}`);if(!lessons.some(l=>l.id===lab.lesson))failures.push(`Unknown lesson for ${lab.id}`);}
const diagrams=(await readdir(path.join(root,'public/diagrams'))).filter(f=>f.endsWith('.svg'));stats.diagrams=diagrams.length;for(const file of diagrams){const svg=await readFile(path.join(root,'public/diagrams',file),'utf8');if(!svg.includes('<title')||!svg.includes('viewBox'))failures.push(`SVG accessibility/scaling metadata missing: ${file}`);}
stats.projectBriefs=(await readdir(path.join(root,'projects'))).filter(f=>f.endsWith('.md')).length;
await writeFile(path.join(root,'research/content-stats.json'),JSON.stringify(stats,null,2)+'\n');console.log(JSON.stringify(stats,null,2));if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}else console.log('Content, internal lab links, diagrams, and all math expressions verified.');
