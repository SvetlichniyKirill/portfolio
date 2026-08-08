"""Локальный сервер для разработки.

По file:// ES-модули не работают, поэтому открывать через http.

    python serve.py --open
"""

import http.server
import socketserver
import sys
import webbrowser
from pathlib import Path

PORT = 5173
ROOT = Path(__file__).parent


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        # без этого правки в css не видно без Ctrl+F5
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        print(f"  {fmt % args}")


def main() -> None:
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        url = f"http://127.0.0.1:{PORT}/"
        print(f"Сайт поднят: {url}\nCtrl+C — остановить\n")
        if "--open" in sys.argv:
            webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nОстановлено.")


if __name__ == "__main__":
    main()
