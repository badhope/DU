"""SPA fallback HTTP server with /mistverse/ prefix stripping."""
import http.server
import os
import sys
from pathlib import Path

ROOT = Path("/workspace/dist/build/h5").resolve()
PREFIX = "/mistverse/"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5173


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Strip /mistverse/ prefix to map to ROOT
        if path.startswith(PREFIX):
            path = path[len(PREFIX):]
        elif path == "/mistverse":
            path = "/"
        return super().translate_path(path)

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            idx = ROOT / "index.html"
            if idx.exists():
                self.wfile.write(idx.read_bytes())
            return
        super().send_error(code, message, explain)


if __name__ == "__main__":
    os.chdir(ROOT)
    with http.server.HTTPServer(("127.0.0.1", PORT), SPAHandler) as httpd:
        print(f"Serving {ROOT} at http://127.0.0.1:{PORT}{PREFIX}")
        httpd.serve_forever()
