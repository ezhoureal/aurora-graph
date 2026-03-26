const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("auroraGraph", {
  platform: process.platform,
  versions: process.versions,
});
