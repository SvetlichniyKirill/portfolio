"""Локальный дев-сервер.

ES-модули и карта импортов не работают по file:// — браузер блокирует
их CORS-политикой. Поэтому сайт нужно открывать по http://, а не
двойным кликом по index.html.

    python serve.py            # только поднять
    python serve.py --open     # поднять и открыть браузер

Когда поставишь Node.js, этот файл больше не нужен: `npm run dev`
поднимет Vite с горячей перезагрузкой.
"""

import http.server
import socketserver
import sys
import webbrowser
from pathlib import Path

PORT = 5173  # тот же порт, что у Vite по умолчанию — привыкай сразу
ROOT = Path(__file__).parent


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        # Отключаем кэш: иначе правки в CSS/JS не видны без Ctrl+F5
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Тихий лог: только сами запросы, без служебного шума
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
