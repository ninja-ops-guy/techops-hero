import concurrent.futures
import functools
import hashlib
import http.client
import pathlib
import tempfile
import threading
import unittest
from media_http_server import MediaHandler, RuntimeHTTPServer


class MediaDeliveryTest(unittest.TestCase):
    def start_server(self, directory):
        server = RuntimeHTTPServer(('127.0.0.1', 0), functools.partial(MediaHandler, directory=directory))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        self.addCleanup(thread.join)
        return server

    def test_runtime_server_has_explicit_parser_burst_capacity(self):
        self.assertGreaterEqual(RuntimeHTTPServer.request_queue_size, 128)
        self.assertTrue(RuntimeHTTPServer.daemon_threads)
        self.assertFalse(RuntimeHTTPServer.block_on_close)

    def test_exact_bytes_for_full_partial_suffix_and_head(self):
        with tempfile.TemporaryDirectory() as directory:
            pathlib.Path(directory, 'clip.mp4').write_bytes(b'0123456789')
            server = self.start_server(directory)
            for method, range_header, status, expected, content_range in [
                ('GET', None, 200, b'0123456789', None),
                ('GET', 'bytes=0-1', 206, b'01', 'bytes 0-1/10'),
                ('GET', 'bytes=5-', 206, b'56789', 'bytes 5-9/10'),
                ('GET', 'bytes=-3', 206, b'789', 'bytes 7-9/10'),
                ('GET', 'bytes=8-999', 206, b'89', 'bytes 8-9/10'),
                ('GET', 'bytes=10-', 416, b'', 'bytes */10'),
                ('HEAD', 'bytes=2-4', 206, b'', 'bytes 2-4/10'),
            ]:
                with self.subTest(method=method, range=range_header):
                    connection = http.client.HTTPConnection(*server.server_address, timeout=5)
                    connection.request(method, '/clip.mp4', headers={'Range': range_header} if range_header else {})
                    response = connection.getresponse()
                    self.assertEqual(response.status, status)
                    self.assertEqual(response.getheader('Content-Range'), content_range)
                    self.assertEqual(response.read(), expected)
                    connection.close()

    def test_parallel_parser_sized_script_delivery_is_byte_exact(self):
        with tempfile.TemporaryDirectory() as directory:
            # Parser-loaded asset chunks in the game are large generated JS files.
            # Exercise more simultaneous connections than TCPServer's legacy
            # listen backlog of five and verify no request is reset or truncated.
            payload = (b"const TO_GLITCH_3='parser-burst-fixture';\n" * 32768)
            pathlib.Path(directory, 'glitch_p3.js').write_bytes(payload)
            expected = hashlib.sha256(payload).hexdigest()
            server = self.start_server(directory)
            workers = 48
            gate = threading.Barrier(workers)

            def fetch_one(_):
                gate.wait(timeout=5)
                connection = http.client.HTTPConnection(*server.server_address, timeout=10)
                try:
                    connection.request('GET', '/glitch_p3.js')
                    response = connection.getresponse()
                    body = response.read()
                    return response.status, len(body), hashlib.sha256(body).hexdigest()
                finally:
                    connection.close()

            with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
                results = list(pool.map(fetch_one, range(workers)))
            self.assertEqual(results, [(200, len(payload), expected)] * workers)


if __name__ == '__main__':
    unittest.main()
