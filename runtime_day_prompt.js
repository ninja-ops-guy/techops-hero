/* Doors Prompt loads only when opened; the desktop retains focus/session authority. */
(function(root){
  'use strict';
  function start(box,isValid,apps,native){
    if(!isValid())return false;
    var content=box.querySelector('.os-content');
    content.innerHTML='<section class="doors-terminal"><header><h1>Doors Command Prompt</h1><p>MIKE-WS <span>LOCAL COMMANDS</span></p></header><pre role="log" aria-label="Command output" aria-relevant="additions"></pre><form><label><span class="doors-terminal-prompt" aria-hidden="true">D:&#92;Mike&gt;</span><input aria-label="Command" maxlength="96" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Type help"></label><button type="submit">Run</button></form></section>';
    var form=content.querySelector('form'),input=form.querySelector('input'),output=content.querySelector('pre');
    var names=apps.filter(a=>a[0]!=='PROMPT').map(a=>a[0].toLowerCase());
    var help='help   dir   hostname   whoami   ver   cls   exit\nopen <app>   Launch an installed application.';
    function append(kind,text){
      String(text).split('\n').forEach(function(line){var row=root.document.createElement('span');row.dataset.kind=kind;row.textContent=line+'\n';output.appendChild(row);});
      while(output.children.length>50)output.removeChild(output.firstElementChild);
    }
    append('output','Doors Workstation Edition\n'+help);
    form.onsubmit=function(event){
      event.preventDefault();
      if(!isValid())return;
      var line=input.value.trim(),parts=line.toLowerCase().split(/\s+/),name=parts[0],reply;
      input.value='';
      if(!line)return;
      if(name==='open'&&parts.length===2&&names.includes(parts[1]))return native.openWorkstationTab(parts[1].toUpperCase());
      if(line.toLowerCase()==='exit')return native.openWorkstation();
      if(line.toLowerCase()==='cls')output.textContent='';
      else {
        var commands={help:help,dir:names.join('   '),hostname:'MIKE-WS',whoami:'AEROTECH / Mike',ver:'Doors Workstation Edition'};
        var known=parts.length===1&&Object.hasOwn(commands,name);
        reply=known?commands[name]:name==='open'?'Installed apps: '+names.join(', '):'Unknown command. Type help for local commands.';
        append('input','> '+line);append(known?'output':'error',reply);
      }
      output.scrollTop=output.scrollHeight;input.focus();
    };
    input.focus();return true;
  }
  root.TechOpsDayPrompt={start:start};
})(typeof globalThis!=='undefined'?globalThis:this);
