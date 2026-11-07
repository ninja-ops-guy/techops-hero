'use strict';
// Keep the native bootstrap at its reviewed request-count ceiling. These are
// ordinary maintained source modules; the browser bundle is generated, not edited.
const fs=require('node:fs');
const marker='\n/* BEGIN GENERATED LINKED PROGRESSION BROWSER BUNDLE */\n';
const filename='campaign_act1.js';
const core=fs.readFileSync(filename,'utf8').split(marker)[0];
const files=['see-world/universe-core.js','universe-sections.js','universe-native.js'];
const suffix=marker+"if (typeof window !== 'undefined' && window.document) {\n"+files.map(f=>'\n/* source: '+f+' */\n'+fs.readFileSync(f,'utf8')).join('\n')+'\n}\n/* END GENERATED LINKED PROGRESSION BROWSER BUNDLE */\n';
const expected=core+suffix;
if(process.argv.includes('--check')){if(fs.readFileSync(filename,'utf8')!==expected)throw Error('Linked native bundle differs from its maintained source files.');console.log('Linked native bundle matches its sources.');}
else fs.writeFileSync(filename,expected);
