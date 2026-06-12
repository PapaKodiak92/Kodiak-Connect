const { app, BrowserWindow, shell, session } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 920,
    height: 560,
    minWidth: 760,
    minHeight: 480,
    title: "Kodiak Connect",
    backgroundColor: "#050914",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  mainWindow.removeMenu();

  const indexPath = path.join(__dirname, "..", "dist", "index.html");
  mainWindow.loadFile(indexPath);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  app.commandLine.appendSwitch("enable-features", "WebRTCPipeWireCapturer");

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(["media", "audioCapture", "videoCapture", "display-capture"].includes(permission));
  });

  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    return ["media", "audioCapture", "videoCapture", "display-capture"].includes(permission);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
