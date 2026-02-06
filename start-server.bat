@echo off
echo.
echo ========================================
echo   Servidor Local para Dashboard THINK
echo ========================================
echo.
echo Iniciando servidor en http://localhost:8000
echo.
echo IMPORTANTE: 
echo 1. Deja esta ventana abierta mientras uses el dashboard
echo 2. Abre tu navegador en: http://localhost:8000
echo 3. Presiona Ctrl+C para detener el servidor
echo.
echo ========================================
echo.

php -S localhost:8000

if errorlevel 1 (
    echo.
    echo ERROR: PHP no esta instalado.
    echo.
    echo Intentando con Python...
    python -m http.server 8000
    
    if errorlevel 1 (
        echo.
        echo ERROR: Ni PHP ni Python estan instalados.
        echo.
        echo Por favor, instala Python desde: https://www.python.org/downloads/
        echo O usa la extension Live Server de VS Code
        echo.
        pause
    )
)
