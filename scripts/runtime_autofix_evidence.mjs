// Bind a media repair to the failing record's own source, never nearby log text.
const demuxFailure = /DEMUXER_ERROR_NO_SUPPORTED_STREAMS|FFmpegDemuxer:\s*no supported streams/i;

export function mediaFailureSources(documents) {
  const sources = new Set();
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    const source = ['src', 'currentSrc', 'video', 'url'].map(key => value[key])
      .find(item => typeof item === 'string' && /\.mp4(?:[?#]|$)/i.test(item));
    if (source && demuxFailure.test(JSON.stringify(value))) sources.add(source);
    for (const child of Object.values(value)) visit(child);
  }
  for (const document of documents) {
    try { visit(JSON.parse(document)); continue; } catch {}
    // REPL entries contain one complete JSON record per line. Incomplete or
    // unstructured messages remain diagnostics, not permission to edit a file.
    for (const line of document.split('\n')) {
      const start = line.indexOf('{');
      if (start < 0) continue;
      const end = line.lastIndexOf('}');
      try { visit(JSON.parse(line.slice(start, end + 1))); } catch {}
    }
  }
  return [...sources];
}

export function repositoryMediaPath(source) {
  try {
    // Preserve traversal evidence before URL normalization can erase it.
    const decoded = decodeURIComponent(source);
    if (decoded.split(/[\\/]/).includes('..')) return null;
    const pathname = decodeURIComponent(new URL(source, 'http://local.invalid/').pathname);
    const rel = pathname.replace(/^\//, '');
    return /^assets\/[A-Za-z0-9_./-]+\.mp4$/i.test(rel) && !rel.split('/').includes('..') ? rel : null;
  } catch { return null; }
}
