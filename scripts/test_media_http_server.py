import functools
import http.client
import pathlib
import tempfile
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from media_http_server import MediaHandler, RuntimeHTTPServer


class MediaDeliveryTest(unittest.TestCase):
    def make_server(self, directory):
        server = RuntimeHTTPServer(('127.0.0.1', 0), functools.partial(MediaHandler, directory=directory))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        return server, thread

    def test_exact_bytes_for_full_partial_suffix_and_head(self):
        with tempfile.TemporaryDirectory() as directory:
            pathlib.Path(directory, 'clip.mp4').write_bytes(b'0123456789')
            server, thread = self.make_server(directory)
            try:
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
                        connection = http.client.HTTPConnection(*server.server_address)
                        connection.request(method, '/clip.mp4', headers={'Range': range_header} if range_header else {})
                        response = connection.getresponse()
                        self.assertEqual(response.status, status)
                        self.assertEqual(response.getheader('Content-Range'), content_range)
                        self.assertEqual(response.read(), expected)
                        connection.close()
            finally:
                server.shutdown()
                server.server_close()
                thread.join()

    def test_parallel_browser_asset_burst_has_capacity_and_exact_delivery(self):
        self.assertGreaterEqual(RuntimeHTTPServer.request_queue_size, 64)
        with tempfile.TemporaryDirectory() as directory:
            payload = b'runtime-asset-' * 4096
            pathlib.Path(directory, 'asset.bin').write_bytes(payload)
            server, thread = self.make_server(directory)
            gate = threading.Barrier(32)

            def fetch_asset(_):
                gate.wait(timeout=5)
                connection = http.client.HTTPConnection(*server.server_address, timeout=5)
                try:
                    connection.request('GET', '/asset.bin')
                    response = connection.getresponse()
                    return response.status, response.read()
                finally:
                    connection.close()

            try:
                with ThreadPoolExecutor(max_workers=32) as pool:
                    results = list(pool.map(fetch_asset, range(32)))
                self.assertEqual(results, [(200, payload)] * 32)
            finally:
                server.shutdown()
                server.server_close()
                thread.join()


if __name__ == '__main__':
    unittest.main()
