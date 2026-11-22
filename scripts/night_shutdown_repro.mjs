// Focused blank-page shutdown probe; does not qualify gameplay or replace a gate.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {boundedNightCleanup,NightCleanupTimeout} from './night_combat_qualification.mjs';
import {formatNightError} from './night_combat_diagnostics.mjs';
import {createNightShutdownDiagnostics} from './night_shutdown_diagnostics.mjs';

export async function runNightShutdownRepro({engine,out,launchOptions,trace=false,
 observe=createNightShutdownDiagnostics,cleanup=boundedNightCleanup,persist=record=>fs.writeFileSync(path.join(out,'shutdown-repro.json'),JSON.stringify(record,null,2)+'\n',{flush:true})}){
 const record={scope:'blank-page shutdown reproduction',trace,pass:false,cleanupErrors:[]};
 let browser,context,shutdown,traceStarted=false,timedOut=false;
 const failure=error=>{record.pass=false;record.error??=formatNightError(error);};
 try{
  shutdown=observe({record,launchOptions});
  browser=await engine.launch(launchOptions);
  shutdown.attach(browser);
  record.browserVersion=browser.version();
  context=await browser.newContext({viewport:{width:1440,height:900}});
  if(trace){await context.tracing.start({screenshots:true,snapshots:true,sources:true});traceStarted=true;}
  const page=await context.newPage();await page.goto('about:blank');record.pass=true;
 }catch(error){failure(error);}
 finally{
  if(traceStarted)try{await cleanup(()=>context.tracing.stop({path:path.join(out,'shutdown-repro-trace.zip')}),'capture.finish');}
  catch(error){failure(error);timedOut=error instanceof NightCleanupTimeout;}
  if(browser)shutdown?.observe('before.context.close',browser);
  for(const [operation,resource] of [['context.close',context],['browser.close',browser]]){
   if(!resource)continue;
   try{await cleanup(()=>resource.close(),operation);}
   catch(error){failure(error);record.cleanupErrors.push({operation,error:formatNightError(error)});timedOut=timedOut||error instanceof NightCleanupTimeout;}
   if(browser)shutdown?.observe('after.'+operation,browser);
  }
  shutdown?.settle();record.cleanupTimedOut=timedOut;persist(record);
 }
 return record;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const out=process.env.BOT_OUT_DIR||'night-shutdown-repro-artifacts';
 fs.mkdirSync(out,{recursive:true});
 const launchOptions={headless:true,...(process.env.BOT_CHROMIUM_EXECUTABLE?{executablePath:process.env.BOT_CHROMIUM_EXECUTABLE}:{}),...(process.env.BOT_CHROMIUM_CHANNEL?{channel:process.env.BOT_CHROMIUM_CHANNEL}:{})};
 try{
  const {chromium}=await import('playwright');
  const record=await runNightShutdownRepro({engine:chromium,out,launchOptions,trace:process.env.SHUTDOWN_TRACE==='1'});
  console.log(JSON.stringify(record));
  // Persist first. An unresolved transport must not keep the probe alive.
  if(record.cleanupTimedOut)process.exit(1);
  if(!record.pass)process.exitCode=1;
 }catch(error){console.error(formatNightError(error));process.exit(1);}
}
