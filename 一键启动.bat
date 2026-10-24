@echo off
chcp 936 >nul
setlocal enabledelayedexpansion
title Dramaflow 一键启动

cd /d "%~dp0"

echo ============================================================
echo   Dramaflow AI 短剧工厂 - 一键启动
echo   项目目录: %~dp0
echo ============================================================
echo.

REM ---------- 1. 检查 Bun ----------
where bun >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 Bun，请先安装 Bun 1.3.14：
    echo         npm install -g --allow-scripts=bun bun@1.3.14
    echo.
    pause
    exit /b 1
)
for /f "delims=" %%v in ('bun --version') do set BUNVER=%%v
echo [1/5] 已检测到 Bun 版本: !BUNVER!
echo.

REM ---------- 2. 检查端口是否已被占用 ----------
set PORT_BUSY=0
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000 " ^| findstr LISTENING') do (
    set PORT_BUSY=1
    set OLD_PID=%%p
)
if !PORT_BUSY!==1 (
    echo [提示] 端口 3000 已被占用 ^(PID !OLD_PID!^)，服务可能已在运行。
    echo        如需重启，请先运行「一键关闭服务.bat」。
    start "" http://127.0.0.1:3000
    echo.
    pause
    exit /b 0
)
echo [2/5] 端口 3000 空闲，可以启动。
echo.

REM ---------- 3. 检查依赖 ----------
if not exist "node_modules" (
    echo [3/5] 首次运行，正在安装依赖 ^(bun install^)...
    call bun install --frozen-lockfile
    if errorlevel 1 (
        echo [错误] 依赖安装失败，请检查网络后重试。
        pause
        exit /b 1
    )
) else (
    echo [3/5] 依赖已就绪，跳过安装。
)
echo.

REM ---------- 4. 检查构建产物 ----------
if not exist "build\server\index.js" (
    echo [4/5] 未发现构建产物，正在编译 ^(bun run build:server^)...
    echo        首次编译耗时较长，请耐心等待...
    call bun run build:server
    if errorlevel 1 (
        echo [错误] 编译失败，请查看上方日志。
        pause
        exit /b 1
    )
) else (
    echo [4/5] 构建产物已存在，跳过编译。
)
if not exist "data\workspaces\myProject" mkdir "data\workspaces\myProject"
echo.

REM ---------- 5. 启动服务 ----------
echo [5/5] 正在启动服务...
echo.
echo ============================================================
echo   服务启动后请访问: http://127.0.0.1:3000
echo   按 Ctrl+C 可停止服务，或运行「一键关闭服务.bat」
echo ============================================================
echo.

REM 延迟约 3 秒后自动打开浏览器（用系统 ping 计时，不依赖标准输入）
start "" /b cmd /c "%SystemRoot%\System32\ping.exe -n 4 127.0.0.1 >nul && start http://127.0.0.1:3000"

call bun run start:server

echo.
echo [提示] 服务已停止。
pause
