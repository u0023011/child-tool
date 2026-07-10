Cloudflare Pages 後端登入版設定說明

這版已經把密碼從 index.html 移除，改成 Cloudflare Pages Functions 後端驗證。

Cloudflare Pages 需要新增 3 個環境變數：

BASIC_PASSWORD = 0000
ADMIN_PASSWORD = 3728
AUTH_SECRET = 請自己設定一串很長的亂碼，例如：child-tool-2026-very-long-secret-xxxx

設定位置：
Cloudflare Dashboard
→ Workers & Pages
→ 選你的 Pages 專案 child-tool
→ Settings
→ Environment variables
→ Production
→ Add variable

新增完後要重新部署一次。
