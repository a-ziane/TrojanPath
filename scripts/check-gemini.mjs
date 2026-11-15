import {readFile} from 'node:fs/promises';
const env=Object.fromEntries((await readFile('supabase/functions/.env','utf8')).split('\n').filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const res=await fetch('https://generativelanguage.googleapis.com/v1beta/models',{headers:{'x-goog-api-key':env.GEMINI_API_KEY},signal:AbortSignal.timeout(20000)});
if(!res.ok){console.log('Gemini key check: HTTP '+res.status);process.exit(1);}const data=await res.json();console.log(JSON.stringify({keyValid:true,flashLiteModels:data.models.filter(m=>m.name.includes('flash-lite')&&m.supportedGenerationMethods?.includes('generateContent')).map(m=>m.name)},null,2));
