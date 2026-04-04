@echo off
set /p ScenePath="Enter Scene Path (Default assets/Hello.ls): " || set ScenePath=assets/Hello.ls
node "%~dp0..\scripts\laya-cli.js" open-scene %ScenePath%
pause
