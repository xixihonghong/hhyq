# 一键推送到 GitHub Pages
# 用法：
#   .\deploy.ps1 -User 你的GitHub用户名
#   .\deploy.ps1 -User 你的GitHub用户名 -Repo my-quiz
param(
  [Parameter(Mandatory = $true)][string]$User,
  [string]$Repo = 'hhyq'
)

# 原生命令（git）往 stderr 写日志，Stop 模式会误判成异常，这里保持默认
$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot

if (-not (Test-Path '.git')) {
  Write-Host '当前目录不是 git 仓库：先执行 git init -b main' -ForegroundColor Red
  exit 1
}

$url = "https://github.com/$User/$Repo.git"
Write-Host "==> 远程仓库：$url"

$remotes = @(git remote 2>$null)
if ($remotes -contains 'origin') {
  git remote set-url origin $url
  Write-Host '==> 已更新 origin'
} else {
  git remote add origin $url
  Write-Host '==> 已添加 origin'
}

Write-Host '==> 推送 main（弹窗登录时，密码用 Personal Access Token）'
git push -u origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host ''
  Write-Host '推送失败：确认仓库已在 GitHub 上创建、且是空仓库；用户名和仓库名要写对。' -ForegroundColor Red
  exit 1
}

Write-Host ''
Write-Host '推送成功。最后在浏览器里做一次（只需一次）：'
Write-Host "  1. 打开 https://github.com/$User/$Repo/settings/pages"
Write-Host '  2. Source 选 Deploy from a branch'
Write-Host '  3. Branch 选 main + / (root)，点 Save'
Write-Host '  4. 等 1-2 分钟，访问：'
Write-Host "     https://$User.github.io/$Repo/"