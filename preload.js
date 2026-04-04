const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Navigation
  navigate:       (page)   => ipcRenderer.send('navigate',        page),
  // Window controls
  minimizeWindow: ()       => ipcRenderer.send('window-minimize'),
  maximizeWindow: ()       => ipcRenderer.send('window-maximize'),
  closeWindow:    ()       => ipcRenderer.send('window-close'),
  // Snap layouts
  snapWindow:     (layout) => ipcRenderer.send('window-snap',     layout),
  // Edge resize (main-process polling)
  resizeStart:    (dir)    => ipcRenderer.send('resize-start',    { dir }),
  resizeEnd:      ()       => ipcRenderer.send('resize-end'),
  onNavigate:     (cb)     => ipcRenderer.on('navigate-to', (_e, page) => cb(page)),
});

contextBridge.exposeInMainWorld('env', {
  CHATBOT_API_KEY: process.env.CHATBOT_API_KEY || '',
  ENDPOINT: process.env.ENDPOINT || 'https://api.openai.com/v1/chat/completions',
  MODEL: process.env.MODEL || 'gpt-4o',
  OS: process.platform
});
