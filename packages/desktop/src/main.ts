import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";

const DEV_SERVER_URL = process.env.ZIWEI_DEV_SERVER_URL ?? "http://127.0.0.1:5173";
const CASE_EXPORT_CHANNEL = "ziwei:case-library:export";
const CASE_IMPORT_CHANNEL = "ziwei:case-library:import";

type ExportCaseLibraryRequest = {
  suggestedFilename: string;
  content: string;
};

async function loadRenderer(window: BrowserWindow): Promise<void> {
  if (!app.isPackaged) {
    await window.loadURL(DEV_SERVER_URL);
    return;
  }

  const indexPath = path.join(process.resourcesPath, "web-dist", "index.html");
  await window.loadFile(indexPath);
}

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  void loadRenderer(window);
  return window;
}

function registerCaseLibraryHandlers(): void {
  ipcMain.removeHandler(CASE_EXPORT_CHANNEL);
  ipcMain.handle(CASE_EXPORT_CHANNEL, async (_event, request: ExportCaseLibraryRequest) => {
    try {
      if (typeof request?.content !== "string") {
        return { ok: false, canceled: false, error: "Export payload is invalid." };
      }

      const fallbackFilename = "ziwei-cases.json";
      const defaultPath = path.join(
        app.getPath("documents"),
        request.suggestedFilename?.trim() || fallbackFilename
      );

      const saveResult = await dialog.showSaveDialog({
        title: "导出命例库",
        defaultPath,
        filters: [
          { name: "JSON", extensions: ["json"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (saveResult.canceled || !saveResult.filePath) {
        return { ok: false, canceled: true };
      }

      await writeFile(saveResult.filePath, request.content, "utf8");
      return { ok: true, canceled: false, path: saveResult.filePath };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown export error";
      return { ok: false, canceled: false, error: message };
    }
  });

  ipcMain.removeHandler(CASE_IMPORT_CHANNEL);
  ipcMain.handle(CASE_IMPORT_CHANNEL, async () => {
    try {
      const openResult = await dialog.showOpenDialog({
        title: "导入命例库",
        properties: ["openFile"],
        filters: [
          { name: "JSON", extensions: ["json"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      const filePath = openResult.filePaths[0];
      if (openResult.canceled || !filePath) {
        return { ok: false, canceled: true };
      }

      const content = await readFile(filePath, "utf8");
      return { ok: true, canceled: false, path: filePath, content };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown import error";
      return { ok: false, canceled: false, error: message };
    }
  });
}

app.whenReady().then(() => {
  registerCaseLibraryHandlers();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
