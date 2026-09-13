"""Static entrypoint contracts: real favicon bytes at root and Pages subpaths.

Run: python3 scripts/test_site_metadata.py
Uses the production media handler; does not mask missing resources or execute
browser/game scripts. Browser acceptance remains a separate Runtime bot gate.
"""
import contextlib
import functools
import http.client
import http.server
from html.parser import HTMLParser
from pathlib import Path
import shutil
import tempfile
import threading
import unittest
from urllib.parse import urljoin, urlsplit
import xml.etree.ElementTree as ET

from media_http_server import MediaHandler

ROOT = Path(__file__).resolve().parents[1]
SVG = '{http://www.w3.org/2000/svg}'


class HeadMetadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_head = False
        self.icons = []
        self.bases = []

    def handle_starttag(self, tag, attrs):
        if tag == 'head':
            self.in_head = True
        if not self.in_head:
            return
        attrs = dict(attrs)
        if tag == 'base':
            self.bases.append(attrs)
        if tag == 'link' and 'icon' in (attrs.get('rel') or '').lower().split():
            self.icons.append(attrs)

    def handle_endtag(self, tag):
        if tag == 'head':
            self.in_head = False


def parse_head(html):
    parser = HeadMetadata()
    parser.feed(html)
    return parser


@contextlib.contextmanager
def serve(directory):
    handler = functools.partial(MediaHandler, directory=str(directory))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield server.server_address
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


def request(address, target, method='GET'):
    connection = http.client.HTTPConnection(*address, timeout=5)
    try:
        connection.request(method, target)
        response = connection.getresponse()
        return response.status, dict(response.getheaders()), response.read()
    finally:
        connection.close()


class SiteMetadataTest(unittest.TestCase):
    def setUp(self):
        self.html = (ROOT / 'index.html').read_text(encoding='utf-8')
        self.head = parse_head(self.html)
        self.assertEqual(len(self.head.icons), 1, 'Declare one explicit favicon in <head>')
        self.icon = self.head.icons[0]

    def test_icon_is_explicit_local_and_project_relative(self):
        self.assertFalse(self.head.bases, 'An origin-changing <base> breaks Pages asset URLs')
        href = self.icon.get('href', '')
        self.assertEqual(href, './favicon.svg')
        self.assertEqual(self.icon.get('type'), 'image/svg+xml')
        self.assertEqual(self.icon.get('sizes'), 'any')
        parsed = urlsplit(href)
        self.assertFalse(parsed.scheme or parsed.netloc or parsed.query or parsed.fragment)

    def test_icon_is_a_nonempty_self_contained_svg(self):
        data = (ROOT / 'favicon.svg').read_bytes()
        self.assertGreater(len(data), 100)
        self.assertLess(len(data), 4096, 'A tab icon should remain small')
        svg = ET.fromstring(data)
        self.assertEqual(svg.tag, SVG + 'svg')
        self.assertEqual(svg.get('viewBox'), '0 0 32 32')
        self.assertEqual(svg.findtext(SVG + 'title'), 'TechOps Hero')
        self.assertTrue(any(node.tag == SVG + 'path' and node.get('d') for node in svg))
        for node in svg.iter():
            self.assertIn(node.tag, {SVG + tag for tag in ('svg', 'title', 'rect', 'path')})
            for key in node.attrib:
                self.assertFalse(key.lower().startswith('on') or 'href' in key.lower())

    def assert_delivery(self, prefix):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            site = root / prefix.strip('/')
            site.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / 'index.html', site / 'index.html')
            shutil.copyfile(ROOT / 'favicon.svg', site / 'favicon.svg')
            with serve(root) as address:
                for entry in (prefix, prefix + 'index.html', prefix + '?mode=nightcrawler'):
                    with self.subTest(entry=entry):
                        status, _, body = request(address, entry)
                        self.assertEqual(status, 200)
                        icon = parse_head(body.decode('utf-8')).icons[0]
                        absolute = urljoin('http://example.test' + entry, icon['href'])
                        target = urlsplit(absolute).path
                        self.assertEqual(target, prefix + 'favicon.svg')
                        status, headers, data = request(address, target)
                        self.assertEqual(status, 200)
                        self.assertEqual(headers['Content-Type'], 'image/svg+xml')
                        self.assertEqual(data, (ROOT / 'favicon.svg').read_bytes())
                        status, headers, data = request(address, target, 'HEAD')
                        self.assertEqual(status, 200)
                        self.assertEqual(int(headers['Content-Length']), (ROOT / 'favicon.svg').stat().st_size)
                        self.assertEqual(data, b'')

    def test_root_delivery(self):
        self.assert_delivery('/')

    def test_github_pages_subpath_delivery(self):
        self.assert_delivery('/techops-hero/')

    def test_missing_resources_still_return_404(self):
        with tempfile.TemporaryDirectory() as directory, serve(directory) as address:
            for target in ('/favicon.svg', '/favicon.ico', '/missing-game-asset.png'):
                with self.subTest(target=target):
                    status, _, _ = request(address, target)
                    self.assertEqual(status, 404, 'Do not hide 404s with a server stub')


if __name__ == '__main__':
    unittest.main()
