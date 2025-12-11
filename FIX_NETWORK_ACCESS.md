# モバイル/他PCからアクセスできない問題の解決方法

## 問題
`ERR_ADDRESS_UNREACHABLE` エラーが表示される

## 原因
1. **開発サーバーが起動していない**（最も可能性が高い）
2. Windowsファイアウォールがポート3000をブロックしている
3. ネットワーク設定の問題

## 解決手順

### ステップ1: 開発サーバーを起動

**重要**: 開発サーバーが起動していることを確認してください。

```bash
cd judo-timer
npm run dev
```

起動時に以下のメッセージが表示されることを確認：
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

### ステップ2: ローカルで確認

PCのブラウザで以下にアクセス：
```
http://localhost:3000
```

正常に表示されることを確認してください。

### ステップ3: Windowsファイアウォールの設定

**管理者権限でPowerShellを開き**、以下を実行：

```powershell
netsh advfirewall firewall add rule name="Next.js Dev Server" dir=in action=allow protocol=TCP localport=3000
```

### ステップ4: IPアドレスの確認

```bash
ipconfig
```

表示されたIPv4アドレスを確認（例: `192.168.123.135`）

### ステップ5: モバイル/他PCからアクセス

- **同じWi-Fiネットワークに接続**していることを確認
- ブラウザで以下にアクセス：
  ```
  http://[あなたのIPアドレス]:3000
  ```
  例: `http://192.168.123.135:3000`

## トラブルシューティング

### 問題: 開発サーバーが起動しない
- `node_modules`を削除して再インストール：
  ```bash
  rm -rf node_modules
  npm install
  npm run dev
  ```

### 問題: ファイアウォールの設定ができない
- Windowsの設定から手動で設定：
  1. 「Windowsセキュリティ」→「ファイアウォールとネットワーク保護」
  2. 「詳細設定」
  3. 「受信の規則」→「新しい規則」
  4. 「ポート」を選択
  5. TCP、ポート3000を指定
  6. 「接続を許可する」を選択

### 問題: 同じネットワークに接続できない
- Wi-Fiルーターの設定を確認
- ゲストネットワークを使用している場合は、通常のネットワークに切り替え

### 問題: IPアドレスが変わった
- IPアドレスは再起動やネットワーク接続の変更で変わる可能性があります
- 毎回 `ipconfig` で確認してください

## 確認コマンド

### ポート3000がリッスンしているか確認
```bash
netstat -ano | findstr :3000
```

### ローカルホストへの接続テスト
```powershell
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000' -Method Get -TimeoutSec 3 | Select-Object StatusCode } catch { Write-Host 'Error:' $_.Exception.Message }"
```

### ネットワーク接続テスト
```powershell
Test-NetConnection -ComputerName 192.168.123.135 -Port 3000
```


