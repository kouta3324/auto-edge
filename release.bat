@echo off
cd /d "%~dp0"

del /f /s /q dist\*
rmdir /s /q dist\lib\
rmdir /s /q dist\assets\
rmdir /s /q dist\data\

copy package.json dist
cd dist
call npm i --production

cd ..

xcopy /e lib dist\lib\
xcopy /e assets dist\assets\
copy msedgedriver.exe dist\
copy node.exe dist\
copy config.jsonc dist\
copy log4js.jsonc dist\
copy run.bat dist\

mkdir dist\data

del /f /q dist\package.json
del /f /q dist\package-lock.json

type nul > dist\.gitkeep

pause
