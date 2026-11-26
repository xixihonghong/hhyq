# 部署到 GitHub Pages（永久公网链接）

仓库已经初始化好了（分支 `main`，首个提交已存在）。剩下三步都在浏览器/命令行完成，大约 2 分钟。

## 1. 在 GitHub 上新建一个空仓库

打开 <https://github.com/new>：

- **Repository name**：`hhyq`（随便起，后面地址会跟着变）
- **Visibility**：`Public`（Pages 免费版只支持公开仓库）
- **不要**勾选 "Add a README file" / ".gitignore" / "license"（仓库必须是空的，否则推送会冲突）

## 2. 推送代码

把下面的 `你的用户名` 换成真实的 GitHub 用户名，在项目目录里执行：

```powershell
cd 'D:\桌面\文件夹\chengxu\后会有期问卷'
git remote add origin https://github.com/你的用户名/hhyq.git
git push -u origin main
```

弹窗要求登录时：**用户名 = GitHub 用户名，密码 = Personal Access Token**（不是登录密码）。

- 没有 Token 就去 <https://github.com/settings/tokens> → Generate new token (classic) → 勾选 `repo` → 生成后复制，只显示一次。
- 或者选 "Sign in with your browser"，在弹出的窗口里授权。

## 3. 打开 Pages

仓库页面 → **Settings** → 左侧 **Pages**：

- **Source**：`Deploy from a branch`
- **Branch**：`main` / `/ (root)`
- 点 **Save**

等 1–2 分钟，地址是：

```
https://你的用户名.github.io/hhyq/
```

## 之后更新内容

改完文件后：

```powershell
git add -A
git commit -m "改了什么"
git push
```

Pages 会在 30 秒左右自动重建，仍是同一个地址。

## 常见问题

| 现象 | 原因 / 处理 |
|---|---|
| 打开是 404 | Pages 还在构建，等 2 分钟；或分支/目录选错（必须是 `main` + `/ (root)`） |
| 页面白屏、样式丢失 | 仓库里缺 `css/`、`js/` 目录，检查是不是只传了 `index.html` |
| 推送报 `Authentication failed` | 用 Token 当密码，或 Token 没有勾 `repo` 权限 |
| 仓库名改成 `你的用户名.github.io` | 地址会变成根路径 `https://你的用户名.github.io/`，更短 |
| 想用自己的域名 | Settings → Pages → Custom domain，并在域名商加 CNAME 记录 |

## 注意

- 仓库里带了 `.nojekyll`，避免 GitHub 用 Jekyll 处理静态文件。
- `tools/`、`shots/`、`assets/candidates/` 已写进 `.gitignore`，不会上传（采集脚本和中间图，约几十 MB）。
- **版权**：`assets/img/` 与 `js/assets.js` 里是节目剧照和媒体配图，公开仓库等于公开发布这些图片。自己玩没问题，要长期公开传播建议换成授权图或插画占位。
