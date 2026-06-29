@echo off
chcp 65001 >nul
title AI DeskPet 后端服务

cd /d "%~dp0backend"

echo ================================
echo   AI DeskPet 后端服务启动中...
echo ================================
echo.
echo 后端地址: http://127.0.0.1:8000
echo API 文档: http://127.0.0.1:8000/docs
echo 健康检查: http://127.0.0.1:8000/api/v1/system/health
echo.
echo 按 Ctrl+C 停止服务
echo ================================
echo.

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --log-level info

pause