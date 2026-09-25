@echo off
chcp 65001 >nul
echo ===================================================
echo   SWAG INC. // VAMP 4 - PUSH TO GITHUB
echo ===================================================
echo.
set "PATH=%PATH%;d:\Swagg67\mingit\cmd;d:\Swagg67\mingit\mingw64\bin"

cd /d "d:\Swagg67\Prototype 2"

echo [1/3] Проверка статуса репозитория...
git status
echo.

echo [2/3] Добавление свежих изменений...
git add .
git commit -m "update: latest SWAG INC VAMP 4 changes" 2>nul
echo.

echo [3/3] Выгрузка на GitHub: https://github.com/Deadspace339/VAMP4-.git ...
echo (Если откроется окно браузера - нажмите 'Sign in with your browser' / 'Authorize')
echo.
git push -u origin main

echo.
echo ===================================================
echo   ГОТОВО! Проверьте репозиторий на GitHub!
echo ===================================================
pause
