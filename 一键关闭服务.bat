@echo off
chcp 936 >nul
setlocal enabledelayedexpansion
title Toonflow 一键关闭服务

echo ============================================================
echo   Toonflow - 一键关闭服务
echo ============================================================
echo.

set FOUND=0

REM ---------- 关闭占用 3000 端口的服务进程 ----------
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000 " ^| findstr LISTENING') do (
    if not defined KILLED_%%p (
        set KILLED_%%p=1
        set FOUND=1
        echo [关闭] 正在结束端口 3000 上的进程 PID=%%p ...
        taskkill /F /PID %%p >nul 2>nul
        if errorlevel 1 (
            echo [警告] PID %%p 结束失败，请右键以管理员身份运行本脚本重试。
        ) else (
            echo [完成] PID %%p 已结束。
        )
    )
)

if !FOUND!==0 echo [提示] 未发现监听 3000 端口的进程，服务可能已经关闭。

echo.
echo [检查] 正在确认端口 3000 状态...
%SystemRoot%\System32\ping.exe -n 2 127.0.0.1 >nul
netstat -ano | findstr ":3000 " | findstr LISTENING >nul
if errorlevel 1 (
    echo [完成] 端口 3000 已释放，Toonflow 服务已关闭。
) else (
    echo [警告] 端口 3000 仍在监听，请尝试以管理员身份运行本脚本。
)

echo.
echo ============================================================
echo   关闭流程结束。
echo ============================================================
pause
