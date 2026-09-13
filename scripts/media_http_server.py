"""Serve the exact checkout with byte ranges required by browser media pipelines."""
import argparse
import functools
import http.server
import os
import re


class MediaHandler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        self.byte_range = None
        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().send_head()
        source = open(path, 'rb')
        size = os.fstat(source.fileno()).st_size
        start, end = 0, size - 1
        value = self.headers.get('Range')
        if value:
            match = re.fullmatch(r'bytes=(\d*)-(\d*)', value.strip())
            if not match or not any(match.groups()) or not size:
                source.close()
                return self.unsatisfied(size)
            left, right = match.groups()
            if left:
                start = int(left)
                end = min(int(right), end) if right else end
            else:
                start = max(0, size - int(right))
            if start > end or start >= size:
                source.close()
                return self.unsatisfied(size)
            self.byte_range = (start, end)
        self.send_response(206 if self.byte_range else 200)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(max(0, end - start + 1)))
        if self.byte_range:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.end_headers()
        return source

    def unsatisfied(self, size):
        self.send_response(416)
        self.send_header('Content-Range', f'bytes */{size}')
        self.send_header('Content-Length', '0')
        self.end_headers()
        return None

    def copyfile(self, source, output):
        if self.byte_range is None:
            return super().copyfile(source, output)
        start, end = self.byte_range
        source.seek(start)
        remaining = end - start + 1
        while remaining:
            chunk = source.read(min(65536, remaining))
            if not chunk:
                break
            output.write(chunk)
            remaining -= len(chunk)


class RuntimeHTTPServer(http.server.ThreadingHTTPServer):
    """Threaded CI server sized for parser-burst asset loading.

    socketserver.TCPServer defaults to a listen backlog of 5 on the Python
    versions used by GitHub's macOS runners. TechOps Hero loads many authored
    script/atlas chunks concurrently; an exhausted accept queue can surface as
    a transient ERR_CONNECTION_RESET and then cascade into missing lexical
    globals in dependent atlas scripts. Keep request handling unchanged, but
    make the admission queue explicit and large enough for that parser burst.
    """

    request_queue_size = 256
    daemon_threads = True
    block_on_close = False


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=4173)
    parser.add_argument('--bind', default='127.0.0.1')
    parser.add_argument('--directory', default=os.getcwd())
    args = parser.parse_args()
    handler = functools.partial(MediaHandler, directory=args.directory)
    RuntimeHTTPServer((args.bind, args.port), handler).serve_forever()
