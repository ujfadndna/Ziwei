export interface ExportCaseLibraryRequest {
  suggestedFilename: string;
  content: string;
}

export type ExportCaseLibraryResult =
  | { ok: true; canceled: false; path: string }
  | { ok: false; canceled: true }
  | { ok: false; canceled: false; error: string };

export type ImportCaseLibraryResult =
  | { ok: true; canceled: false; path: string; content: string }
  | { ok: false; canceled: true }
  | { ok: false; canceled: false; error: string };

export interface ZiweiDesktopBridge {
  isDesktop: boolean;
  platform: string;
  versions: {
    electron?: string;
    chrome: string;
    node: string;
  };
  exportCaseLibrary?: (request: ExportCaseLibraryRequest) => Promise<ExportCaseLibraryResult>;
  importCaseLibrary?: () => Promise<ImportCaseLibraryResult>;
}

declare global {
  interface Window {
    ziweiDesktop?: ZiweiDesktopBridge;
  }
}
