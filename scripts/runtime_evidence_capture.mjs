// Diagnostics only: never changes input, assertions, or gameplay state.
import fs from 'node:fs';
import path from 'node:path';

export async function beginRuntimeEvidence(context, page, {out, prefix}) {
  if (!/^[a-z0-9.-]+$/i.test(prefix)) throw new Error('Invalid evidence prefix');
  fs.mkdirSync(out, {recursive: true});
  const runtime = {console: [], pageErrors: [], requests: [], captureErrors: []};
  const bounded = value => String(value).slice(0, 2000);
  const push = (list, value) => { if (list.length < 500) list.push(value); };
  const url = value => {
    try { const u = new URL(value); return `${u.origin}${u.pathname}`; }
    catch { return '[invalid URL]'; }
  };
  const listeners = {
    console: message => {
      if (['error', 'warning'].includes(message.type()))
        push(runtime.console, {type: message.type(), text: bounded(message.text())});
    },
    pageerror: error => push(runtime.pageErrors, bounded(error)),
    requestfailed: request => push(runtime.requests, {url: url(request.url()), error: bounded(request.failure()?.errorText)}),
    response: response => {
      if (response.status() >= 400) push(runtime.requests, {url: url(response.url()), status: response.status()});
    }
  };
  for (const [event, listener] of Object.entries(listeners)) page.on(event, listener);
  let started = false, finished = null;
  try { await context.tracing.start({screenshots: true, snapshots: true, sources: true}); started = true; }
  catch (error) { runtime.captureErrors.push(`Trace start: ${bounded(error)}`); }
  return {
    async finish() {
      if (finished) return finished;
      const trace = `${prefix}-trace.zip`, log = `${prefix}-runtime.json`;
      let traceAvailable = false;
      if (started) {
        try {
          await context.tracing.stop({path: path.join(out, trace)});
          traceAvailable = fs.statSync(path.join(out, trace)).size > 0;
        } catch (error) { runtime.captureErrors.push(`Trace stop: ${bounded(error)}`); }
      }
      for (const [event, listener] of Object.entries(listeners)) page.off(event, listener);
      runtime.trace = traceAvailable ? trace : null;
      fs.writeFileSync(path.join(out, log), JSON.stringify(runtime, null, 2) + '\n');
      finished = {trace: runtime.trace, runtime: log, captureErrors: runtime.captureErrors};
      return finished;
    }
  };
}
