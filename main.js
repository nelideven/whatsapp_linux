import { app, session, BrowserWindow, Menu, shell } from 'electron';
import Store from 'electron-store';
import contextMenu from 'electron-context-menu';

const store = new Store();
app.commandLine.appendSwitch("disable-gpu-vsync");

app.whenReady().then(() => {
    // Setting the user agent to mimic WhatsApp Web on usual browsers
    let originalUA = session.defaultSession.getUserAgent();
    console.log("Original User Agent: ", originalUA);
    let modifiedUA = originalUA.replace(/Electron\/[\d.]+\s*/, "");
    modifiedUA = modifiedUA.replace(/whatsapp_linux\/[\d.]+\s*/, "");
    session.defaultSession.setUserAgent(modifiedUA);
    console.log("Modified User Agent: ", modifiedUA);

    // Creating a new BrowserWindow instance
    let win = new BrowserWindow({ resizable: true, title: "WhatsApp for Linux", webPreferences: { enableBlinkFeatures: "WebRTC", contextIsolation: false, nodeIntegration: false, sandbox: true } });

    // Restoring window size and state
    const restoreWindowState = store.get('windowState');
    if (restoreWindowState) {
        win.setBounds({
            x: restoreWindowState.x || 0,
            y: restoreWindowState.y || 0,
            width: restoreWindowState.width || 1200,
            height: restoreWindowState.height || 600
        });
        if (restoreWindowState.maximized) {
            win.maximize();
        }
    } else {
        win.setBounds({ width: 1200, height: 600 });
    }

    // Setting up context menu
    contextMenu({
        window: win, // Ensure you're passing the correct window object
        showInspectElement: true
    });

    // Removing the default menu
    Menu.setApplicationMenu(null);
    
    // Loading the WhatsApp Web URL
    win.loadURL("https://web.whatsapp.com/");

    // Custom styling to remove borders and padding
    win.webContents.executeJavaScript(`
        const observer = new MutationObserver(() => {
            const htmlTag = document.documentElement;
            if (htmlTag.classList.contains('wf-loading')) {
                // Class appeared, inject CSS
                const style = document.createElement('style');
                style.innerHTML = \`
                    @media not all and (display-mode: standalone) {
                        @media screen and (min-width: 1441px) {
                            .app-wrapper-web ._aigs:not(._as6h) {
                                box-shadow: none !important;
                                width: 100% !important;
                                height: 100% !important;
                                max-width: none !important;
                                margin: 0 !important;
                                top: 0 !important;
                            }
                        }
                    }
                \`;
                document.head.appendChild(style);
                // Stop observing after injection
                observer.disconnect();
            }
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    `);

    // Redirecting external links to the default browser
    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: "deny" };
    });

    // Save window size and state when closed
    win.on('close', () => {
        store.set('windowState', {
            x: win.getBounds().x,
            y: win.getBounds().y,
            width: win.getBounds().width,
            height: win.getBounds().height,
            maximized: win.isMaximized()
        });
    });
});