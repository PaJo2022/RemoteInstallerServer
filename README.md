# Remote Installer Server

Lightweight Node.js backend for the Remote App Installer system.
Queues install/uninstall commands and dispatches them to Android devices.

## Start
```bash
npm install
node server.js
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /commands | Device polls for commands |
| POST | /install | Queue install command |
| POST | /uninstall | Queue uninstall command |
| POST | /upload | Upload APK file |
| POST | /result | Device reports result |
| GET | /history | View install history |
| GET | /queue | View pending commands |

## Example
```bash
# Queue an install
curl -X POST http://localhost:3000/install \
  -H "Content-Type: application/json" \
  -d '{"packageName": "com.your.app", "apkUrl": "http://localhost:3000/apks/app.apk"}'

# Check history
curl http://localhost:3000/history
```
