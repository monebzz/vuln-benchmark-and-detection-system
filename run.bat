@echo off
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
echo Running Joern...
call "%~dp0joern\joern-cli\joern.bat" --script "%~dp0extract.sc"
echo Joern done.