import {readFile,writeFile} from 'node:fs/promises';
import {GeminiProvider} from '../supabase/functions/_shared/provider.ts';
import {demoProfile,emptyState} from '../shared/domain.ts';
import {validatePlan} from '../shared/planner.ts';
const env=Object.fromEntries((await readFile('supabase/functions/.env','utf8')).split('\n').filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
for(const model of ['gemini-2.5-flash-lite','gemini-3.1-flash-lite','gemini-3.5-flash-lite']){
 globalThis.Deno={env:{get:key=>key==='GEMINI_MODEL'?model:env[key]}};
 try{const state={...emptyState(),profile:demoProfile};const spec=validatePlan(await new GeminiProvider().generate(demoProfile,state),demoProfile,state);await writeFile('/private/tmp/trojanpath-gemini-result.json',JSON.stringify({model,spec}),{mode:0o600});console.log(JSON.stringify({realAI:true,model,quests:spec.tasks.length,minutes:spec.tasks.reduce((n,t)=>n+t.minutes,0)}));break;}catch(error){console.log(model+': '+error.message);}
}
