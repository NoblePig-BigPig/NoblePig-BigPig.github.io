@echo off
REM Launch LayaAirIDE with Chrome DevTools Protocol enabled
REM This allows external tools to inject JavaScript into the IDE renderer
start "" "C:\Users\user\AppData\Local\Programs\LayaAirIDE\LayaAirIDE.exe" --remote-debugging-port=9222
echo LayaAirIDE started with CDP on port 9222
echo Use: node tools/laya-cli.js expand assets
