@echo off
setlocal
cd /d "%~dp0"
title Generator3DROOMS local server
where py >nul 2>nul
if not errorlevel 1 goto use_py
where python >nul 2>nul
if not errorlevel 1 goto use_python
echo Python 3 was not found. Install Python 3 from python.org and enable the launcher, then retry.
echo The app needs a local HTTP server for Three.js modules.
pause
exit /b 1

:use_py
py -3 -c "import http.server,socketserver,webbrowser,threading; s=socketserver.TCPServer(('127.0.0.1',0),http.server.SimpleHTTPRequestHandler); p=s.server_address[1]; threading.Timer(1.0,lambda:webbrowser.open('http://127.0.0.1:'+str(p)+'/web/')).start(); print('Generator3DROOMS is running at http://127.0.0.1:'+str(p)+'/web/'); print('Keep this window open while using the studio. Press Ctrl+C to stop.'); s.serve_forever()"
if errorlevel 1 goto failed
goto end

:use_python
python -c "import http.server,socketserver,webbrowser,threading; s=socketserver.TCPServer(('127.0.0.1',0),http.server.SimpleHTTPRequestHandler); p=s.server_address[1]; threading.Timer(1.0,lambda:webbrowser.open('http://127.0.0.1:'+str(p)+'/web/')).start(); print('Generator3DROOMS is running at http://127.0.0.1:'+str(p)+'/web/'); print('Keep this window open while using the studio. Press Ctrl+C to stop.'); s.serve_forever()"
if errorlevel 1 goto failed
goto end

:failed
echo Could not start the local server. Check that Python 3 is installed and try again.
pause
:end
endlocal
