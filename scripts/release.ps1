<#
.SYNOPSIS
    AI DeskPet 发布脚本 (Windows)
.DESCRIPTION
    执行完整发布流程：版本校验 → 构建 → 打包 → 发布
.PARAMETER Version
    新版本号 (semver, e.g., 1.2.3)
.PARAMETER Channel
    发布渠道: stable | beta | alpha (默认 stable)
.PARAMETER SkipBuild
    跳过构建步骤，只执行打包和发布
.PARAMETER DryRun
    模拟运行，不实际执行
.EXAMPLE
    .\release.ps1 -Version 1.2.3
    .\release.ps1 -Version 1.2.3-beta.1 -Channel beta
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Version,

    [ValidateSet("stable", "beta", "alpha")]
    [string]$Channel = "stable",

    [switch]$SkipBuild,
    [switch]$DryRun
)

# ── 配置 ──────────────────────────────────────────────────────
$ROOT_DIR = Split-Path -Parent $PSScriptRoot
$FRONTEND_DIR = Join-Path $ROOT_DIR "frontend"
$RELEASE_DIR = Join-Path $FRONTEND_DIR "release"
$IS_GIT_REPO = Test-Path (Join-Path $ROOT_DIR ".git")
$HAS_LOCKFILE = Test-Path (Join-Path $FRONTEND_DIR "package-lock.json")

# ── 辅助函数 ──────────────────────────────────────────────────

function Log($Message) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor Cyan
}

function LogStep($Message) {
    Write-Host "`n=== $Message ===" -ForegroundColor Yellow
}

function CheckLastExitCode {
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        throw "Command failed with exit code $LASTEXITCODE"
    }
}

function ConfirmContinue($Message) {
    $choice = Read-Host "$Message (y/N)"
    return $choice -eq 'y' -or $choice -eq 'Y'
}

# ── Electron 镜像配置 ─────────────────────────────────────────
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_CACHE = "$env:LOCALAPPDATA\electron-cache"

# ── 版本校验 ──────────────────────────────────────────────────

LogStep "版本校验"

if ($Version -notmatch '^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$') {
    throw "无效的版本号格式。请使用 semver 格式，例如: 1.2.3 或 1.2.3-beta.1"
}

if ($IS_GIT_REPO) {
    $gitStatus = git -C $ROOT_DIR status --porcelain 2>&1
    if ($gitStatus -and $gitStatus -notmatch "fatal:") {
        Write-Host "工作区有未提交的更改:" -ForegroundColor Yellow
        Write-Host $gitStatus
        if (-not (ConfirmContinue "是否继续发布？")) {
            exit 1
        }
    }
} else {
    Log "(非 git 仓库，跳过版本控制检查)"
}

# ── 更新版本号 ────────────────────────────────────────────────

LogStep "更新版本号"

$PackageJson = Join-Path $FRONTEND_DIR "package.json"
$pkg = Get-Content $PackageJson -Raw | ConvertFrom-Json
$oldVersion = $pkg.version

Log "版本: $oldVersion -> $Version"

if (-not $DryRun) {
    $oldPattern = '"version": "' + $oldVersion + '"'
    $newPattern = '"version": "' + $Version + '"'
    $newPkg = (Get-Content $PackageJson -Raw) -replace [regex]::Escape($oldPattern), $newPattern
        [System.IO.File]::WriteAllText($PackageJson, $newPkg, [System.Text.UTF8Encoding]::new($false))

    if ($IS_GIT_REPO) {
        git -C $ROOT_DIR add $PackageJson
        git -C $ROOT_DIR commit -m "chore: bump version to v$Version" 2>&1
        git -C $ROOT_DIR tag "v$Version" 2>&1
    } else {
        Log "(跳过 git 标签)"
    }
}

# ── 构建前端 ──────────────────────────────────────────────────

if (-not $SkipBuild) {
    LogStep "构建前端"

    Push-Location $FRONTEND_DIR

    try {
        Log "安装依赖..."
        if (-not $DryRun) {
            if ($HAS_LOCKFILE) {
                npm ci --ignore-scripts
            } else {
                npm install --no-audit --no-fund --ignore-scripts
            }
            CheckLastExitCode
        }

        Log "Electron 二进制修复..."
        if (-not $DryRun) {
            $electronDir = Join-Path $FRONTEND_DIR "node_modules\electron"
            $electronDist = Join-Path $electronDir "dist"
            $electronExe = Join-Path $electronDist "electron.exe"
            if ((Test-Path $electronDir) -and -not (Test-Path $electronExe)) {
                try {
                    $pkgJson = Join-Path $electronDir "package.json"
                    $ver = (Get-Content $pkgJson -Raw | ConvertFrom-Json).version
                    if ($ver) {
                        $url = "$env:ELECTRON_MIRROR" + "v$ver/electron-v$ver-win32-x64.zip"
                        $zip = "$env:TEMP\electron-v$ver.zip"
                        Log "下载 Electron $ver 二进制..."
                        Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing -TimeoutSec 300
                        if (-not (Test-Path $electronDist)) { New-Item -ItemType Directory -Path $electronDist -Force | Out-Null }
                        Expand-Archive -Path $zip -DestinationPath $electronDist -Force
                        Set-Content -Path (Join-Path $electronDir "path.txt") -Value "electron.exe" -NoNewline
                        Remove-Item $zip -Force -ErrorAction SilentlyContinue
                        Log "Electron $ver 二进制安装完成"
                    }
                } catch {
                    Write-Host "  Electron 二进制下载失败: $($_.Exception.Message)" -ForegroundColor Yellow
                }
            }
        }

        Log "TypeScript 类型检查..."
        if (-not $DryRun) {
            npx tsc --noEmit 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  TypeScript 检查有警告（不阻止构建）" -ForegroundColor Yellow
            }
        }

        Log "Vite 构建..."
        if (-not $DryRun) {
            $env:NODE_ENV = "production"
            npx vite build
            CheckLastExitCode
        }

        Log "前端构建完成"
    }
    finally {
        Pop-Location
    }
}
else {
    Log "跳过构建 (--SkipBuild)"
}

# ── 打包 Electron ─────────────────────────────────────────────

LogStep "打包 Electron"

Push-Location $FRONTEND_DIR

try {
    Log "运行 electron-builder..."

    if (-not $DryRun) {
        if ($Channel -eq "stable") {
            npx electron-builder --config electron-builder.yml --win --x64
        } else {
            npx electron-builder --config electron-builder.yml --win --x64 --publish=always
        }
        CheckLastExitCode
    }

    Log "构建产物:"
    Get-ChildItem $RELEASE_DIR -Filter "*.exe" -ErrorAction SilentlyContinue |
        ForEach-Object { Log "  - $($_.Name) ($('{0:N0}' -f $_.Length) bytes)" }
}
finally {
    Pop-Location
}

# ── 推送标签 ──────────────────────────────────────────────────

LogStep "推送至远程"

if ($DryRun) {
    Log "Dry run — 不执行推送"
}
else {
    if ($IS_GIT_REPO) {
        if (ConfirmContinue "推送标签 v$Version 到远程仓库？") {
            git -C $ROOT_DIR push origin "v$Version" 2>&1
            git -C $ROOT_DIR push origin main 2>&1
            Log "标签已推送。GitHub Actions 将自动构建并发布。"
        }
        else {
            Write-Host "标签未推送。稍后可手动执行: git push origin v$Version" -ForegroundColor Yellow
        }
    }
    else {
        Log "(非 git 仓库，跳过推送)"
    }
}

# ── 完成 ──────────────────────────────────────────────────────

LogStep "完成"

Log "发布摘要:"
Log "  Version:   $Version"
Log "  Channel:   $Channel"
Log "  Release:   $RELEASE_DIR"

Write-Host "`n  下一步:" -ForegroundColor Green
Write-Host "  1. 检查构建产物: $RELEASE_DIR" -ForegroundColor White
Write-Host "  2. 测试安装包" -ForegroundColor White
if ($IS_GIT_REPO) {
    Write-Host "  3. 更新 CHANGELOG.md 并推送" -ForegroundColor White
}
