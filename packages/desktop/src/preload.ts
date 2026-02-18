import { contextBridge, ipcRenderer } from "electron";

const CASE_EXPORT_CHANNEL = "ziwei:case-library:export";
const CASE_IMPORT_CHANNEL = "ziwei:case-library:import";

contextBridge.exposeInMainWorld("ziweiDesktop", {
  isDesktop: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  exportCaseLibrary: (request: { suggestedFilename: string; content: string }) =>
    ipcRenderer.invoke(CASE_EXPORT_CHANNEL, request),
  importCaseLibrary: () => ipcRenderer.invoke(CASE_IMPORT_CHANNEL),
});
