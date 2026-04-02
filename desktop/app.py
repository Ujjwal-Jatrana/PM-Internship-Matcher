"""
InternMatch Desktop — Lightweight Python Webview Wrapper
Opens the built React app in a native desktop window.

Usage:
    pip install pywebview
    python app.py
"""
import os
import sys
import threading
import http.server
import socketserver

def get_dist_path():
    """Get path to the dist folder (works both in dev and PyInstaller bundle)."""
    if getattr(sys, 'frozen', False):
        # Running as PyInstaller bundle
        return os.path.join(sys._MEIPASS, 'dist')
    else:
        # Running in development
        return os.path.join(os.path.dirname(os.path.dirname(__file__)), 'dist')

def start_server(port=8765):
    """Start a local HTTP server to serve the built React app."""
    dist = get_dist_path()
    
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=dist, **kwargs)
        
        def log_message(self, format, *args):
            pass  # Suppress logs
        
        def do_GET(self):
            # SPA fallback: serve index.html for all non-file routes
            path = self.translate_path(self.path)
            if not os.path.exists(path) or os.path.isdir(path):
                self.path = '/index.html'
            super().do_GET()
    
    with socketserver.TCPServer(("", port), Handler) as httpd:
        httpd.serve_forever()

def main():
    port = 8765
    
    # Start local server in background
    server_thread = threading.Thread(target=start_server, args=(port,), daemon=True)
    server_thread.start()
    
    try:
        import webview
        # Open native window
        webview.create_window(
            'InternMatch — PM Internship Smart Match',
            f'http://localhost:{port}',
            width=1200,
            height=800,
            min_size=(800, 600)
        )
        webview.start()
    except ImportError:
        # Fallback: open in default browser
        import webbrowser
        print(f"pywebview not installed. Opening in browser...")
        webbrowser.open(f'http://localhost:{port}')
        input("Press Enter to close the app...")

if __name__ == '__main__':
    main()
