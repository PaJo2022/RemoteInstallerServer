const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json());

// ── APK storage ───────────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './apks';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

// ── In-memory command queue ───────────────────────────────────────────────
// In production this would be a database
let commands = [];
let installHistory = [];

// ── Routes ────────────────────────────────────────────────────────────────

// Device polls this every 30 secs — gets pending commands
app.get('/commands', (req, res) => {
    const deviceId = req.query.deviceId || 'unknown';
    console.log(`[${new Date().toISOString()}] Poll from device: ${deviceId}`);
    
    // Return pending commands and clear queue
    const pending = [...commands];
    commands = [];
    
    res.json({ commands: pending });
});

// Queue an install command
app.post('/install', (req, res) => {
    const { packageName, apkUrl } = req.body;
    if (!packageName || !apkUrl) {
        return res.status(400).json({ error: 'packageName and apkUrl required' });
    }

    commands.push({
        type: 'INSTALL',
        packageName,
        apkUrl
    });

    console.log(`[QUEUED] INSTALL: ${packageName} from ${apkUrl}`);
    res.json({ success: true, message: `Install queued for ${packageName}` });
});

// Queue an uninstall command
app.post('/uninstall', (req, res) => {
    const { packageName } = req.body;
    if (!packageName) {
        return res.status(400).json({ error: 'packageName required' });
    }

    commands.push({
        type: 'UNINSTALL',
        packageName
    });

    console.log(`[QUEUED] UNINSTALL: ${packageName}`);
    res.json({ success: true, message: `Uninstall queued for ${packageName}` });
});

// Upload APK file to server
app.post('/upload', upload.single('apk'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No APK file uploaded' });
    }
    const apkUrl = `http://localhost:${PORT}/apks/${req.file.originalname}`;
    console.log(`[UPLOAD] APK uploaded: ${apkUrl}`);
    res.json({ success: true, apkUrl });
});

// Serve APK files for download
app.use('/apks', express.static('./apks'));

// Device reports install result
app.post('/result', (req, res) => {
    const { deviceId, packageName, action, success, message } = req.body;
    const result = {
        timestamp: new Date().toISOString(),
        deviceId,
        packageName,
        action,
        success,
        message
    };
    installHistory.push(result);
    console.log(`[RESULT] ${action} ${success ? 'SUCCESS' : 'FAILED'}: ${packageName} — ${message || ''}`);
    res.json({ received: true });
});

// View install history
app.get('/history', (req, res) => {
    res.json({ history: installHistory });
});

// View pending commands
app.get('/queue', (req, res) => {
    res.json({ pending: commands });
});

// ── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nRemote Installer Server running at http://localhost:${PORT}`);
    console.log(`\nEndpoints:`);
    console.log(`  GET  /commands        — device polls for commands`);
    console.log(`  POST /install         — queue an install`);
    console.log(`  POST /uninstall       — queue an uninstall`);
    console.log(`  POST /upload          — upload APK file`);
    console.log(`  POST /result          — device reports result`);
    console.log(`  GET  /history         — view install history`);
    console.log(`  GET  /queue           — view pending commands\n`);
});