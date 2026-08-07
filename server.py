#!/usr/bin/env python3
import http.server
import socketserver
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import functools

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class TaskPulseHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/send-email':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                host = data.get('host') or 'smtp.gmail.com'
                port = int(data.get('port') or 587)
                user = data.get('user') or 'krishnarohith417@gmail.com'
                password = data.get('pass') or 'beblzukehtmmiitg'
                recipient = data.get('recipient') or 'krishnarohith417@gmail.com'
                subject = data.get('subject') or 'TaskPulse Reminder'
                body_content = data.get('body') or ''

                # Construct MIME Email
                msg = MIMEMultipart('alternative')
                msg['Subject'] = subject
                msg['From'] = user
                msg['To'] = recipient

                html_part = MIMEText(body_content, 'html')
                msg.attach(html_part)

                # Connect to SMTP Server
                print(f"[SMTP Server] Dispatching mail via {host}:{port} to {recipient}...")
                with smtplib.SMTP(host, port, timeout=15) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(user, password)
                    server.sendmail(user, [recipient], msg.as_string())
                
                print(f"[SMTP Server] SUCCESS: Email sent to {recipient}")
                
                response_bytes = json.dumps({"success": True, "message": f"Email delivered to {recipient}"}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(response_bytes)

            except Exception as e:
                print(f"[SMTP Server Error] FAILED: {str(e)}")
                response_bytes = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(response_bytes)
        else:
            self.send_error(404, "Endpoint not found")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == "__main__":
    handler_factory = functools.partial(TaskPulseHTTPRequestHandler, directory=DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), handler_factory) as httpd:
        print(f"[TaskPulse Server] Running at http://localhost:{PORT}")
        print("[SMTP Dispatcher] Live SMTP Email Endpoint active at /api/send-email")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
