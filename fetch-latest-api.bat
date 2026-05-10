@echo off


pushd %~dp0\..\schema-apis\typescript

FOR /F "delims=" %%A IN ('pnpm pack') DO SET "LASTLINE=%%A"

popd

echo %LASTLINE%

pushd %~dp0
pnpm add "%~dp0\..\schema-apis\typescript\%LASTLINE%" --force
popd

