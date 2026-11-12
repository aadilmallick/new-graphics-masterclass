import {readFile,writeFile} from 'node:fs/promises';
import {lessons} from '../src/catalog.js';
const chapters=[];
for(const lesson of lessons){const text=await readFile(new URL(`../course/${lesson.file}`,import.meta.url),'utf8');const prose=text.replace(/```[\s\S]*?```/g,'');chapters.push({id:lesson.id,title:lesson.title,proseWords:prose.split(/\s+/).filter(Boolean).length,sections:(text.match(/^## /gm)||[]).length,codeExamples:(text.match(/^```/gm)||[]).length/2});}
await writeFile(new URL('../research/chapter-depth.json',import.meta.url),JSON.stringify(chapters,null,2)+'\n');
console.table(chapters.map(({id,proseWords,sections,codeExamples})=>({id,proseWords,sections,codeExamples})));
console.log('Total core prose words:',chapters.reduce((n,c)=>n+c.proseWords,0));
