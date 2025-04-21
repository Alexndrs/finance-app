import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { isDev } from './utils.js';
// import { MailService } from 'core';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow;
// const mailService = new MailService();

app.on("ready", () => {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
    });
    if (isDev()) {
        mainWindow.loadURL("http://localhost:5123");
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
    }
})