#!/usr/bin/env python3
"""Serve the app locally:  python3 tools/serve.py  → http://localhost:8787"""
import http.server, pathlib, os
os.chdir(pathlib.Path(__file__).resolve().parent.parent)
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()
print("Cadence on http://localhost:8787  (Ctrl+C to stop)")
http.server.ThreadingHTTPServer(("127.0.0.1", 8787), H).serve_forever()
