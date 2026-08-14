// === Configuration & Constants ===
const NUS_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const NUS_CHAR_TX_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const NUS_CHAR_RX_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

// Fuente de descarga de Amiibos (Internet Archive)
const BASE_DOWNLOAD_URL = "https://archive.org/download/nintendo-amiibo-nfc-vault/Amiibo%20Bin.zip/";
let baseDownloadUrl = BASE_DOWNLOAD_URL;

const FRAME_HEADER_SIZE = 4;
const COMMAND_TIMEOUT_MS = 10000;
const FORMAT_TIMEOUT_MS = 45000;

// Maximum byte sizes on solosky firmware
const MAX_FILE_NAME_BYTES = 47;
const MAX_FILE_PATH_BYTES = 63;
const MAX_FOLDER_PATH_BYTES = 55;

// Category Short-name Mappings (to avoid path length exceedance)
const CATEGORY_MAPPINGS = {
    "Super Smash Bros Amiibo": "Smash",
    "The Legend of Zelda Amiibo": "Zelda",
    "Animal Crossing Amiibo": "AC",
    "Yoshi’s Wooly World Amiibo": "Yoshi",
    "Monster Hunter Amiibo": "MH",
    "Fire Emblem Amiibo": "FE",
    "Mario Sports Superstars Amiibo": "MarioSports",
    "Detective Pikachu Amiibo": "Pikachu",
    "Yu-Gi-Oh! Amiibo": "Yugioh",
    "Shovel Knight Amiibo": "Shovel",
    "Chibi-Robo! Amiibo": "Chibi",
    "BoxBoy! Amiibo": "BoxBoy",
    "Dark Souls Amiibo": "DarkSouls",
    "Super Mario Amiibo": "Mario",
    "Kirby Amiibo": "Kirby",
    "Metroid Amiibo": "Metroid",
    "Pikmin Amiibo": "Pikmin",
    "Skylanders Amiibo": "Skylanders",
    "Splatoon Amiibo": "Splatoon",
    "Xenoblade Chronicles": "Xenoblade"
};

const VFS_ERRORS = {
    0: "OK",
    1: "Error de comando",
    [-1]: "Error de hardware del dispositivo",
    [-2]: "Memoria insuficiente en dispositivo",
    [-3]: "Fin de archivo",
    [-4]: "El archivo/carpeta ya existe",
    [-5]: "Nombre demasiado largo",
    [-6]: "Disco no encontrado",
    [-7]: "Almacenamiento corrupto",
    [-90]: "Archivo/Carpeta no encontrado",
    [-91]: "Espacio insuficiente en disco",
    [-99]: "Operación no soportada",
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// --- Path sanitization helpers ---

const CATEGORY_SHORT = {
    "Animal Crossing Amiibo": "AC",
    "The Legend of Zelda Amiibo": "Zelda",
    "Super Smash Bros Amiibo": "Smash",
    "Mario Sports Superstars Amiibo": "MSports",
    "Monster Hunter Amiibo": "MH",
    "Kirby Amiibo": "Kirby",
    "Street Fighter Amiibo": "SF",
    "Super Mario Amiibo": "Mario",
    "Splatoon Amiibo": "Splatoon",
    "Fire Emblem Amiibo": "FE",
    "Super Nintendo World Power-Up Bands": "SNW",
    "Metroid Amiibo": "Metroid",
    "Yu-Gi-Oh! Amiibo": "Yugioh",
    "Power Pros Amiibo": "PowerPros",
    "Jikkyou Powerful Pro Baseball Amiibo Cards": "Jikkyou",
    "Yoshi’s Wooly World Amiibo": "Yoshi",
    "Shovel Knight Amiibo": "Shovel",
    "Skylanders Amiibo": "Skylanders",
    "My Mario Amiibo": "MyMario",
    "Resident Evil Amiibo": "RE",
    "Xenoblade Chronicles Amiibo": "Xenoblade",
    "Detective Pikachu Amiibo": "Pikachu",
    "Dark Souls Amiibo": "DarkSouls",
    "BoxBoy! Amiibo": "BoxBoy",
    "Chibi-Robo! Amiibo": "Chibi",
    "Diablo Amiibo": "Diablo",
    "Donkey Kong Bananza Amiibo": "DK",
    "Kellogs Amiibo": "Kellogs",
    "Mega Man Amiibo": "MegaMan",
    "Pikmin Amiibo": "Pikmin",
    "Pokkén Tournament Amiibo": "Pokken",
    "Pragmata Amiibo": "Pragmata"
};

function getCleanCategoryFolder(cat) {
    return CATEGORY_SHORT[cat] || CATEGORY_MAPPINGS[cat] || cat.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
}

function cleanSubPath(sub) {
    if (!sub) return "";
    return sub
        .replace(/Amiibo Cards\/!Series (\d+)/i, 'Cards/S$1')
        .replace(/Amiibo Cards\/!Sanrio Cards/i, 'Cards/Sanrio')
        .replace(/Amiibo Cards\/!Amiibo Festival/i, 'Cards/Festival')
        .replace(/Amiibo Cards\/!Welcome Amiibo/i, 'Cards/Welcome')
        .replace(/Amiibo Cards\/!Special Edition/i, 'Cards/Special')
        .replace(/Amiibo Figures/i, 'Figures')
        .replace(/Happy Home Designer Items/i, 'HHD')
        .replace(/Breath of the Wild/i, 'BotW')
        .replace(/Tears of the Kingdom/i, 'TotK')
        .replace(/Twilight Princess/i, 'TP')
        .replace(/Skyward Sword HD/i, 'Skyward')
        .replace(/Link’s Awakening/i, 'Awakening')
        .replace(/Kirby Air Riders Amiibo/i, 'AirRiders')
        .replace(/[^a-zA-Z0-9_\/]/g, '_')
        .replace(/_+/g, '_');
}

function fitPathToHardwareLimit(remotePath) {
    if (remotePath.length <= 58) return remotePath;
    const parts = remotePath.split('/');
    const file = parts.pop();
    const ext = file.includes('.') ? file.substring(file.lastIndexOf('.')) : '';
    const nameWithoutExt = file.substring(0, file.length - ext.length);
    const parentDir = parts.join('/');
    const maxNameLen = Math.max(8, 58 - parentDir.length - 1 - ext.length);
    const shortName = nameWithoutExt.substring(0, maxNameLen) + ext;
    return `${parentDir}/${shortName}`;
}

function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/ñ/g, "n").replace(/Ñ/g, "N");
}

function sanitizeName(name) {
    // 1. Remove bracket prefixes like [AC] 001 -, [Zel] 001 -
    let clean = name.replace(/^\[[^\]]+\]\s*\d*\s*-\s*/, '');
    
    // 2. Remove tildes/accents
    clean = removeAccents(clean);
    
    // 3. Remove parentheses content and other symbols
    clean = clean.replace(/\([^)]+\)/g, '')
                 .replace(/[^a-zA-Z0-9\s._-]/g, '')
                 .trim();
                 
    // 4. Clean spaces to underscores
    clean = clean.replace(/\s+/g, '_');
    
    return clean;
}

function utf8ByteLength(str) {
    return textEncoder.encode(str).length;
}

function getBaseName(path) {
    const parts = path.split("/").filter(Boolean);
    return parts.length === 0 ? "" : parts[parts.length - 1];
}

function getParentPath(path) {
    const idx = path.lastIndexOf("/");
    return idx <= 2 ? path.slice(0, 3) : path.slice(0, idx);
}

function joinPaths(parent, child) {
    const p = parent.endsWith("/") ? parent : parent + "/";
    const c = child.startsWith("/") ? child.slice(1) : child;
    return p + c;
}

// ==========================================
// === Pixl BLE Client (Real Device) ======
// ==========================================
class PixlBLEClient {
    constructor(onLog) {
        this.log = onLog;
        this.device = null;
        this.txChar = null;
        this.rxChar = null;
        
        this.queue = Promise.resolve();
        this.pendingCmd = null;
        this.pendingTimer = null;
        
        this.rxParts = [];
        this.rxBytes = 0;
        this.rxSeq = -1;
        this.chunking = false;
        
        this.maxChunkSize = 242; // standard max size for MTU 250
        this.onDisconnect = null;
        
        this._onNotification = this._onNotification.bind(this);
        this._onDisconnect = this._onDisconnect.bind(this);
    }

    async connect() {
        if (!navigator.bluetooth) {
            throw new Error("Web Bluetooth no está disponible en este navegador. Utiliza Chrome/Edge.");
        }
        
        this.log("Buscando dispositivo Allmiibo...");
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [NUS_SERVICE_UUID] }],
            optionalServices: [NUS_SERVICE_UUID]
        });

        this.log("Conectando al servidor GATT...");
        const server = await device.gatt.connect();
        
        device.addEventListener("gattserverdisconnected", this._onDisconnect);
        
        try {
            this.log("Buscando servicio de datos (NUS)...");
            const service = await server.getPrimaryService(NUS_SERVICE_UUID);
            this.txChar = await service.getCharacteristic(NUS_CHAR_TX_UUID);
            this.rxChar = await service.getCharacteristic(NUS_CHAR_RX_UUID);
            this.device = device;
            
            this.log("Activando notificaciones de datos...");
            await this.rxChar.startNotifications();
            this.rxChar.addEventListener("characteristicvaluechanged", this._onNotification);
            
            this.log("Conexión establecida con éxito.");
            
            // Clean state close file just in case
            await this._sendCommand(0x13, Uint8Array.of(0)).catch(() => {});
        } catch (err) {
            device.removeEventListener("gattserverdisconnected", this._onDisconnect);
            if (server.connected) server.disconnect();
            throw err;
        }
    }

    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
    }

    _onDisconnect() {
        this.log("El dispositivo Bluetooth se ha desconectado.");
        this._resetState();
        if (this.onDisconnect) this.onDisconnect();
    }

    _resetState() {
        clearTimeout(this.pendingTimer);
        if (this.pendingCmd) {
            this.pendingCmd.reject(new Error("Dispositivo desconectado."));
            this.pendingCmd = null;
        }
        this.device = null;
        this.txChar = null;
        this.rxChar = null;
        this.queue = Promise.resolve();
        this.rxParts = [];
        this.rxBytes = 0;
        this.rxSeq = -1;
        this.chunking = false;
    }

    _vfsError(status) {
        const signed = status > 127 ? status - 256 : status;
        return VFS_ERRORS[signed] || `Error desconocido (código ${signed})`;
    }

    // Command transport
    _sendCommand(cmd, payload = new Uint8Array(), timeoutMs = COMMAND_TIMEOUT_MS) {
        const run = () => {
            if (!this.txChar) return Promise.reject(new Error("No conectado."));
            
            return new Promise((resolve, reject) => {
                const pendingRef = { resolve, reject, cmd };
                
                pendingRef.onTimeout = () => {
                    if (this.pendingCmd !== pendingRef) return;
                    this.pendingCmd = null;
                    this.chunking = false;
                    this.rxParts = [];
                    reject(new Error(`El comando 0x${cmd.toString(16)} agotó el tiempo de espera.`));
                };

                pendingRef.armTimer = () => {
                    clearTimeout(this.pendingTimer);
                    this.pendingTimer = setTimeout(pendingRef.onTimeout, timeoutMs);
                };

                this.pendingCmd = pendingRef;
                
                const frame = new Uint8Array(FRAME_HEADER_SIZE + payload.length);
                frame[0] = cmd;
                frame[1] = 0; // status is 0 for requests
                frame[2] = 0; // chunk LE low byte
                frame[3] = 0; // chunk LE high byte
                frame.set(payload, FRAME_HEADER_SIZE);

                this.txChar.writeValue(frame)
                    .then(() => {
                        if (this.pendingCmd === pendingRef) {
                            pendingRef.armTimer();
                        }
                    })
                    .catch(err => {
                        if (this.pendingCmd === pendingRef) this.pendingCmd = null;
                        reject(err);
                    });
            });
        };

        const result = this.queue.then(run);
        this.queue = result.catch(() => {}); // prevent chain poisoning
        return result;
    }

    _onNotification(event) {
        if (!this.pendingCmd) return;
        
        try {
            const dv = event.target.value;
            const incoming = new Uint8Array(dv.buffer.slice(dv.byteOffset, dv.byteOffset + dv.byteLength));
            
            const cmd = incoming[0];
            const status = incoming[1];
            const chunkField = incoming[2] | (incoming[3] << 8);
            const hasMore = (chunkField & 0x8000) !== 0;
            const seq = chunkField & 0x7fff;
            
            if (hasMore) {
                if (!this.chunking) {
                    this.rxParts = [incoming];
                    this.rxBytes = incoming.length;
                    this.rxSeq = 0;
                    this.chunking = true;
                } else {
                    if (seq !== this.rxSeq + 1) {
                        this._failReassembly("Error de secuencia BLE RX.");
                        return;
                    }
                    this.rxParts.push(incoming.slice(FRAME_HEADER_SIZE));
                    this.rxBytes += incoming.length - FRAME_HEADER_SIZE;
                    this.rxSeq = seq;
                }
                if (this.pendingCmd && this.pendingCmd.armTimer) this.pendingCmd.armTimer();
                return;
            }
            
            let frame = incoming;
            if (this.chunking) {
                if (seq !== this.rxSeq + 1) {
                    this._failReassembly("Error de secuencia BLE RX en fragmento final.");
                    return;
                }
                this.rxParts.push(incoming.slice(FRAME_HEADER_SIZE));
                frame = this._concatBytes(...this.rxParts);
                this.rxParts = [];
                this.chunking = false;
                this.rxBytes = 0;
                this.rxSeq = -1;
            }
            
            const response = {
                cmd: frame[0],
                status: frame[1],
                payload: frame.slice(FRAME_HEADER_SIZE)
            };
            
            clearTimeout(this.pendingTimer);
            const p = this.pendingCmd;
            this.pendingCmd = null;
            
            if (response.cmd !== p.cmd) {
                p.reject(new Error(`Respuesta inesperada 0x${response.cmd.toString(16)} para comando 0x${p.cmd.toString(16)}`));
                return;
            }
            
            p.resolve(response);
        } catch (err) {
            this._failReassembly(err.message);
        }
    }

    _failReassembly(msg) {
        this.chunking = false;
        this.rxParts = [];
        this.rxBytes = 0;
        this.rxSeq = -1;
        clearTimeout(this.pendingTimer);
        if (this.pendingCmd) {
            this.pendingCmd.reject(new Error(msg));
            this.pendingCmd = null;
        }
    }

    _concatBytes(...arrays) {
        let totalLen = arrays.reduce((acc, a) => acc + a.length, 0);
        let res = new Uint8Array(totalLen);
        let offset = 0;
        for (let a of arrays) {
            res.set(a, offset);
            offset += a.length;
        }
        return res;
    }

    _encodeString(str) {
        const bytes = textEncoder.encode(str);
        const output = new Uint8Array(2 + bytes.length);
        output[0] = bytes.length & 0xff;
        output[1] = (bytes.length >> 8) & 0xff;
        output.set(bytes, 2);
        return output;
    }

    // --- Device Commands ---

    async getVersion() {
        const r = await this._sendCommand(0x01);
        if (r.status !== 0) return { ok: false, error: this._vfsError(r.status) };
        
        // Structure: [len_u16][version_str][len_u16][ble_mac_str]
        const len = r.payload[0] | (r.payload[1] << 8);
        const version = textDecoder.decode(r.payload.slice(2, 2 + len));
        const macOffset = 2 + len;
        const macLen = r.payload[macOffset] | (r.payload[macOffset + 1] << 8);
        const bleAddress = textDecoder.decode(r.payload.slice(macOffset + 2, macOffset + 2 + macLen));
        
        return { ok: true, data: { version, bleAddress } };
    }

    async listDrives() {
        const r = await this._sendCommand(0x10);
        if (r.status !== 0) return { ok: false, error: this._vfsError(r.status) };
        
        const count = r.payload[0];
        const drives = [];
        let offset = 1;
        for (let i = 0; i < count; i++) {
            const status = r.payload[offset++];
            const label = String.fromCharCode(r.payload[offset++]);
            const nameLen = r.payload[offset] | (r.payload[offset + 1] << 8);
            offset += 2;
            const name = textDecoder.decode(r.payload.slice(offset, offset + nameLen));
            offset += nameLen;
            
            const totalBytes = new DataView(r.payload.buffer, r.payload.byteOffset + offset, 4).getUint32(0, true);
            offset += 4;
            const freeBytes = new DataView(r.payload.buffer, r.payload.byteOffset + offset, 4).getUint32(0, true);
            offset += 4;
            
            drives.push({ label, name, totalBytes, freeBytes, status });
        }
        return { ok: true, data: drives };
    }

    async readFolder(path) {
        const r = await this._sendCommand(0x16, this._encodeString(path));
        if (r.status !== 0) return { ok: false, error: this._vfsError(r.status) };
        
        const entries = [];
        let offset = 0;
        const payload = r.payload;
        
        while (offset < payload.length) {
            if (payload.length - offset < 8) break;
            const nameLen = payload[offset] | (payload[offset + 1] << 8);
            if (payload.length - offset < 2 + nameLen + 6) break;
            offset += 2;
            const name = textDecoder.decode(payload.slice(offset, offset + nameLen));
            offset += nameLen;
            
            const size = new DataView(payload.buffer, payload.byteOffset + offset, 4).getUint32(0, true);
            offset += 4;
            
            const type = payload[offset++] === 1 ? "DIR" : "FILE";
            const metaSize = payload[offset++];
            
            // Skip meta data bytes
            offset += metaSize;
            
            entries.push({ name, size, type });
        }
        
        return { ok: true, data: entries };
    }

    async createFolder(path) {
        const r = await this._sendCommand(0x17, this._encodeString(path));
        if (r.status !== 0) return { ok: false, error: this._vfsError(r.status) };
        return { ok: true };
    }

    async removePath(path) {
        const r = await this._sendCommand(0x18, this._encodeString(path));
        if (r.status !== 0) return { ok: false, error: this._vfsError(r.status) };
        return { ok: true };
    }

    async renamePath(oldPath, newPath) {
        const payload = this._concatBytes(this._encodeString(oldPath), this._encodeString(newPath));
        const r = await this._sendCommand(0x19, payload);
        if (r.status !== 0) return { ok: false, error: this._vfsError(r.status) };
        return { ok: true };
    }

    async formatDrive(label = "E") {
        const payload = Uint8Array.of(label.charCodeAt(0));
        const r = await this._sendCommand(0x11, payload, FORMAT_TIMEOUT_MS);
        if (r.status !== 0) return { ok: false, error: this._vfsError(r.status) };
        return { ok: true };
    }

    async openFile(path, mode) {
        const modeFlag = mode === "w" ? 0x16 : 0x08; // 0x16 = write/create, 0x08 = read
        const payload = this._concatBytes(this._encodeString(path), Uint8Array.of(modeFlag));
        const r = await this._sendCommand(0x12, payload);
        if (r.status !== 0) return { ok: false, error: this._vfsError(r.status) };
        return { ok: true, fileId: r.payload[0] };
    }

    async writeFileChunk(fileId, data) {
        const payload = this._concatBytes(Uint8Array.of(fileId), data);
        const r = await this._sendCommand(0x15, payload);
        if (r.status !== 0) return { ok: false, error: this._vfsError(r.status) };
        return { ok: true };
    }

    async closeFile(fileId) {
        const r = await this._sendCommand(0x13, Uint8Array.of(fileId));
        if (r.status !== 0) return { ok: false, error: this._vfsError(r.status) };
        return { ok: true };
    }

    async enterDfu() {
        try {
            await this._sendCommand(0x02);
            return { ok: true };
        } catch (err) {
            // Dado que el chip se reinicia al instante, es normal que lance un error de desconexión.
            return { ok: true };
        }
    }
}

// ==========================================
// === Developer Mock Client (Simulator) ====
// ==========================================
class DevMockClient {
    constructor(onLog) {
        this.log = onLog;
        this.onDisconnect = null;
        this.connected = false;
        
        // Memory FS structure mapping path to list of entries
        this.fs = {
            "E:/": [
                { name: "amiibo", type: "DIR", size: 0 },
                { name: "save", type: "DIR", size: 0 },
                { name: "config.txt", type: "FILE", size: 45 }
            ],
            "E:/amiibo": [
                { name: "Smash", type: "DIR", size: 0 },
                { name: "Zelda", type: "DIR", size: 0 },
                { name: "Mario.bin", type: "FILE", size: 540 },
                { name: "Link.bin", type: "FILE", size: 540 }
            ],
            "E:/amiibo/Smash": [
                { name: "Luigi.bin", type: "FILE", size: 540 },
                { name: "Fox.bin", type: "FILE", size: 540 }
            ],
            "E:/amiibo/Zelda": [
                { name: "Zelda_TotK.bin", type: "FILE", size: 540 }
            ],
            "E:/save": [
                { name: "backup_01.bin", type: "FILE", size: 1024 }
            ]
        };
        
        this.totalBytes = 8 * 1024 * 1024; // 8MB drive size
    }

    async connect() {
        this.log("Conectando al simulador de Allmiibo...");
        await new Promise(r => setTimeout(r, 800));
        this.connected = true;
        this.log("Simulador conectado. Versión firmware virtual: 2.14.0");
    }

    disconnect() {
        this.connected = false;
        this.log("Simulador desconectado.");
        if (this.onDisconnect) this.onDisconnect();
    }

    async getVersion() {
        return { ok: true, data: { version: "2.14.0-SIMULATOR", bleAddress: "D4:3F:12:8A:CE:99" } };
    }

    async listDrives() {
        // Calculate free bytes based on size of all files in fs
        let used = 0;
        Object.values(this.fs).forEach(folder => {
            folder.forEach(item => {
                if (item.type === "FILE") used += item.size;
            });
        });
        
        const freeBytes = Math.max(0, this.totalBytes - used);
        return {
            ok: true,
            data: [{ label: "E", name: "E:", totalBytes: this.totalBytes, freeBytes, status: 0 }]
        };
    }

    async readFolder(path) {
        await new Promise(r => setTimeout(r, 200));
        const entries = this.fs[path] || [];
        // Sort folder first, then alphabetical
        const sorted = [...entries].sort((a, b) => {
            if (a.type !== b.type) return a.type === "DIR" ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        return { ok: true, data: sorted };
    }

    async createFolder(path) {
        await new Promise(r => setTimeout(r, 100));
        const parent = getParentPath(path);
        const name = getBaseName(path);
        
        if (!this.fs[parent]) this.fs[parent] = [];
        
        const exists = this.fs[parent].some(e => e.name === name);
        if (exists) return { ok: false, error: "Carpeta ya existe" };
        
        this.fs[parent].push({ name, type: "DIR", size: 0 });
        this.fs[path] = [];
        return { ok: true };
    }

    async removePath(path) {
        await new Promise(r => setTimeout(r, 150));
        const parent = getParentPath(path);
        const name = getBaseName(path);
        
        if (this.fs[parent]) {
            this.fs[parent] = this.fs[parent].filter(e => e.name !== name);
        }
        
        // Remove children if it's a directory
        delete this.fs[path];
        return { ok: true };
    }

    async renamePath(oldPath, newPath) {
        await new Promise(r => setTimeout(r, 150));
        const parentOld = getParentPath(oldPath);
        const nameOld = getBaseName(oldPath);
        const parentNew = getParentPath(newPath);
        const nameNew = getBaseName(newPath);
        
        if (this.fs[parentOld]) {
            const item = this.fs[parentOld].find(e => e.name === nameOld);
            if (item) {
                item.name = nameNew;
                if (item.type === "DIR") {
                    this.fs[newPath] = this.fs[oldPath] || [];
                    delete this.fs[oldPath];
                }
            }
        }
        return { ok: true };
    }

    async formatDrive() {
        await new Promise(r => setTimeout(r, 1000));
        this.fs = {
            "E:/": []
        };
        return { ok: true };
    }

    async openFile(path, mode) {
        // Return dummy file handle
        this._currentWritePath = path;
        return { ok: true, fileId: 42 };
    }

    async writeFileChunk(fileId, data) {
        // Do nothing in mock, just simulate
        return { ok: true };
    }

    async closeFile(fileId) {
        // Add written file to filesystem
        if (this._currentWritePath) {
            const parent = getParentPath(this._currentWritePath);
            const name = getBaseName(this._currentWritePath);
            if (!this.fs[parent]) this.fs[parent] = [];
            
            const exists = this.fs[parent].find(e => e.name === name);
            if (exists) {
                exists.size = 540; // mock size
            } else {
                this.fs[parent].push({ name, type: "FILE", size: 540 });
            }
            this._currentWritePath = null;
        }
        return { ok: true };
    }

    // Mock upload high-level
    async uploadFile(path, file, onProgress, abortSignal) {
        const total = file.size;
        let offset = 0;
        const speed = 250; // speed steps
        
        while (offset < total) {
            if (abortSignal && abortSignal.aborted) {
                throw new Error("Carga cancelada.");
            }
            await new Promise(r => setTimeout(r, 60));
            offset = Math.min(offset + speed, total);
            onProgress(offset, total);
        }
        
        // Write to mock fs
        const parent = getParentPath(path);
        const name = getBaseName(path);
        if (!this.fs[parent]) this.fs[parent] = [];
        this.fs[parent] = this.fs[parent].filter(e => e.name !== name);
        this.fs[parent].push({ name, type: "FILE", size: total });
    }

    async enterDfu() {
        this.log("Comando DFU enviado. Reiniciando simulador...");
        this.disconnect();
        return { ok: true };
    }
}

// ==========================================
// === Web App Orchestrator & State ========
// ==========================================

const state = {
    client: null,
    isMock: false,
    isConnected: false,
    currentPath: "E:/",
    selectedItems: new Set(),
    uploadQueue: [],
    categories: {}, // loaded from JSON
    imagesCache: {}, // Cache for AmiiboAPI results
    amiiboApiList: null, // Full list from AmiiboAPI
    selectedCatalogue: new Set(), // Selected Amiibo paths from catalogue
    explorerViewMode: "list", // "list" or "grid" view for local explorer
    explorerSort: "name-asc", // Current sorting criteria for local explorer
    currentEntries: [], // Cached directory contents to allow instant sorting
    explorerTabMode: "folders", // "folders" or "gallery" view type
    scannedAmiibos: [], // Recursively scanned Amiibos for the gallery view
    abortUpload: false // Flag to cancel running upload queue
};

// UI Elements mapping
const el = {
    btnConnectBle: document.getElementById("btn-connect-ble"),
    btnConnectMock: document.getElementById("btn-connect-mock"),
    btnDisconnect: document.getElementById("btn-disconnect"),
    statusDot: document.getElementById("status-dot"),
    statusText: document.getElementById("status-text"),
    deviceInfo: document.getElementById("device-info"),
    infoVersion: document.getElementById("info-version"),
    infoMac: document.getElementById("info-mac"),
    storageContainer: document.getElementById("storage-container"),
    storageBar: document.getElementById("storage-bar"),
    storageUsed: document.getElementById("storage-used"),
    storageFree: document.getElementById("storage-free"),
    explorerActions: document.getElementById("explorer-actions"),
    btnNewFolder: document.getElementById("btn-new-folder"),
    btnUploadFiles: document.getElementById("btn-upload-files"),
    btnUploadFolder: document.getElementById("btn-upload-folder"),
    btnFormat: document.getElementById("btn-format"),
    inputFiles: document.getElementById("input-files"),
    inputFolder: document.getElementById("input-folder"),
    fileDropzone: document.getElementById("file-dropzone"),
    explorerBreadcrumb: document.getElementById("explorer-breadcrumb"),
    explorerTableBody: document.getElementById("explorer-table-body"),
    
    // Queue elements
    queueList: document.getElementById("queue-list"),
    queueProgress: document.getElementById("queue-progress"),
    btnQueueStart: document.getElementById("btn-queue-start"),
    btnQueueCancel: document.getElementById("btn-queue-cancel"),
    btnQueueClear: document.getElementById("btn-queue-clear"),
    
    // Online Catalogue Elements
    filterCategory: document.getElementById("filter-category"),
    searchAmiibo: document.getElementById("search-amiibo"),
    amiiboGrid: document.getElementById("amiibo-grid"),
    
    // Catalogue Selection & Installation
    catSelectedCount: document.getElementById("cat-selected-count"),
    btnCatSelectAll: document.getElementById("btn-cat-select-all"),
    btnCatDeselectAll: document.getElementById("btn-cat-deselect-all"),
    btnCatInstall: document.getElementById("btn-cat-install"),
    btnCatInstallSeries: document.getElementById("btn-cat-install-series"),
    btnCatSync: document.getElementById("btn-cat-sync"),
    
    // Modals
    modalFolder: document.getElementById("modal-folder"),
    folderNameInput: document.getElementById("folder-name-input"),
    folderNameError: document.getElementById("folder-name-error"),
    btnFolderCancel: document.getElementById("btn-folder-cancel"),
    btnFolderConfirm: document.getElementById("btn-folder-confirm"),
    
    modalRename: document.getElementById("modal-rename"),
    renameInput: document.getElementById("rename-input"),
    renameError: document.getElementById("rename-error"),
    btnRenameCancel: document.getElementById("btn-rename-cancel"),
    btnRenameConfirm: document.getElementById("btn-rename-confirm"),
    
    modalDelete: document.getElementById("modal-delete"),
    deleteMessage: document.getElementById("delete-message"),
    btnDeleteCancel: document.getElementById("btn-delete-cancel"),
    btnDeleteConfirm: document.getElementById("btn-delete-confirm"),
    
    modalWarning: document.getElementById("modal-warning"),
    warningList: document.getElementById("warning-list"),
    btnWarningClose: document.getElementById("btn-warning-close"),
    
    modalInstall: document.getElementById("modal-install"),
    installFolderInput: document.getElementById("install-folder-input"),
    installFolderError: document.getElementById("install-folder-error"),
    installCountText: document.getElementById("install-count-text"),
    btnInstallCancel: document.getElementById("btn-install-cancel"),
    btnInstallConfirm: document.getElementById("btn-install-confirm"),
    
    updateWarningBadge: document.getElementById("update-warning-badge"),
    btnToggleView: document.getElementById("btn-toggle-view"),
    btnToggleViewIcon: document.getElementById("btn-toggle-view-icon"),
    toggleViewText: document.getElementById("toggle-view-text"),
    explorerTableContainer: document.getElementById("explorer-table-container"),
    explorerGridContainer: document.getElementById("explorer-grid-container"),
    explorerSortSelect: document.getElementById("explorer-sort-select"),
    explorerViewSelect: document.getElementById("explorer-view-select"),
    
    // Key UI
    keyStatusBadge: document.getElementById("key-status-badge"),
    btnUploadKey: document.getElementById("btn-upload-key"),
    btnAutoKey: document.getElementById("btn-auto-key"),
    inputKeyFile: document.getElementById("input-key-file"),
    
    // Auto Key Modal UI
    modalAutoKey: document.getElementById("modal-auto-key"),
    inputKeyUrl: document.getElementById("input-key-url"),
    autoKeyError: document.getElementById("auto-key-error"),
    autoKeyProgress: document.getElementById("auto-key-progress"),
    btnAutoKeyCancel: document.getElementById("btn-auto-key-cancel"),
    btnAutoKeyConfirm: document.getElementById("btn-auto-key-confirm"),
    
    // Help Modal UI
    btnHelp: document.getElementById("btn-help"),
    modalHelp: document.getElementById("modal-help"),
    btnHelpClose: document.getElementById("btn-help-close"),
    
    // DFU Update Modal UI
    btnDfuHelp: document.getElementById("btn-dfu-help"),
    modalDfuUpdate: document.getElementById("modal-dfu-update"),
    btnDfuClose: document.getElementById("btn-dfu-close"),
    btnDfuTrigger: document.getElementById("btn-dfu-trigger"),
    dfuTriggerStatus: document.getElementById("dfu-trigger-status"),
    
    toastContainer: document.getElementById("toast-container")
};

// --- Toast helper ---
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "error" : ""}`;
    
    const icon = document.createElement("span");
    icon.className = "material-symbols-rounded";
    icon.textContent = type === "error" ? "error" : "check_circle";
    
    const text = document.createElement("span");
    text.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    el.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = "slideIn 0.3s ease-out reverse forwards";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Log printer ---
function logEvent(msg) {
    console.log(`[Allmiibo] ${msg}`);
}

// --- Connection UI Updates ---
function setConnectionState(connected, isMock = false) {
    state.isConnected = connected;
    state.isMock = isMock;
    
    if (connected) {
        el.btnConnectBle.style.display = "none";
        el.btnConnectMock.style.display = "none";
        el.btnDisconnect.style.display = "inline-flex";
        
        el.statusDot.className = "status-dot connected";
        el.statusText.textContent = isMock ? "Conectado (Simulador)" : "Conectado";
        
        el.deviceInfo.hidden = false;
        el.storageContainer.style.display = "flex";
        el.explorerActions.style.display = "flex";
        
        updateDeviceInfo();
        updateStorageBar();
        refreshExplorer();
    } else {
        el.btnConnectBle.style.display = "inline-flex";
        el.btnConnectMock.style.display = "inline-flex";
        el.btnDisconnect.style.display = "none";
        
        el.statusDot.className = "status-dot";
        el.statusText.textContent = "Desconectado";
        
        el.deviceInfo.hidden = true;
        el.storageContainer.style.display = "none";
        el.explorerActions.style.display = "none";
        el.updateWarningBadge.style.display = "none";
        
        el.explorerTableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    Conecta tu Allmiibo para explorar los archivos del dispositivo
                </td>
            </tr>
        `;
        renderBreadcrumb();
    }
}

async function updateDeviceInfo() {
    try {
        const info = await state.client.getVersion();
        if (info.ok) {
            el.infoVersion.textContent = info.data.version;
            el.infoMac.textContent = info.data.bleAddress;
            checkForFirmwareUpdate(info.data.version);
        }
    } catch (err) {
        logEvent(`Error al obtener info de versión: ${err.message}`);
    }
}

async function updateStorageBar() {
    try {
        const res = await state.client.listDrives();
        if (res.ok && res.data.length > 0) {
            const drive = res.data[0];
            const used = drive.totalBytes - drive.freeBytes;
            const pct = (used / drive.totalBytes) * 100;
            
            el.storageBar.style.width = `${pct}%`;
            el.storageUsed.textContent = `${(used / 1024).toFixed(0)} KB usado`;
            el.storageFree.textContent = `${(drive.freeBytes / (1024*1024)).toFixed(2)} MB libre`;
        }
    } catch (err) {
        logEvent(`Error al obtener espacio de almacenamiento: ${err.message}`);
    }
}

// --- Explorer Navigation & Rendering ---
async function checkEncryptionKeyStatus() {
    if (!state.isConnected) return;
    try {
        const res = await state.client.readFolder("E:/");
        if (res.ok) {
            const keyFile = res.data.find(entry => entry.name.toLowerCase() === "key_retail.bin");
            if (keyFile) {
                if (keyFile.size === 160) {
                    el.keyStatusBadge.textContent = "Válida";
                    el.keyStatusBadge.style.backgroundColor = "var(--primary-light)";
                    el.keyStatusBadge.style.color = "var(--primary)";
                } else {
                    el.keyStatusBadge.textContent = "Inválida";
                    el.keyStatusBadge.style.backgroundColor = "#fef3c7";
                    el.keyStatusBadge.style.color = "var(--warning)";
                }
            } else {
                el.keyStatusBadge.textContent = "No instalada";
                el.keyStatusBadge.style.backgroundColor = "var(--danger-light)";
                el.keyStatusBadge.style.color = "var(--danger)";
            }
        }
    } catch (err) {
        console.error("Error checking key status:", err);
    }
}

async function checkForFirmwareUpdate(currentVersion) {
    if (!currentVersion) return;
    try {
        let latestVersion = "2.16.0";
        try {
            const res = await fetch("https://api.github.com/repos/solosky/pixl.js/releases/latest");
            if (res.ok) {
                const data = await res.json();
                if (data.tag_name) {
                    latestVersion = data.tag_name.replace(/^v/i, '');
                }
            }
        } catch (fetchErr) {
            console.warn("Could not reach GitHub releases API, using fallback latest version:", latestVersion);
        }
        
        const cleanCurrent = currentVersion.replace(/[^\d.]/g, '');
        const cleanLatest = latestVersion.replace(/[^\d.]/g, '');
        
        if (cleanCurrent && cleanLatest) {
            const curParts = cleanCurrent.split(".").map(Number);
            const latParts = cleanLatest.split(".").map(Number);
            let isOlder = false;
            for (let i = 0; i < Math.max(curParts.length, latParts.length); i++) {
                const curVal = curParts[i] || 0;
                const latVal = latParts[i] || 0;
                if (curVal < latVal) {
                    isOlder = true;
                    break;
                } else if (curVal > latVal) {
                    break;
                }
            }
            if (isOlder) {
                el.updateWarningBadge.textContent = `¡v${latestVersion} disponible!`;
                el.updateWarningBadge.style.backgroundColor = "var(--danger-light)";
                el.updateWarningBadge.style.color = "var(--danger)";
                el.updateWarningBadge.style.display = "inline-block";
                el.updateWarningBadge.title = `Tu versión: v${currentVersion} - Última versión disponible: v${latestVersion}. Haz clic para actualizar.`;
            } else {
                el.updateWarningBadge.textContent = `v${currentVersion} (Al día)`;
                el.updateWarningBadge.style.backgroundColor = "var(--primary-light)";
                el.updateWarningBadge.style.color = "var(--primary-hover)";
                el.updateWarningBadge.style.display = "inline-block";
                el.updateWarningBadge.title = `Tu dispositivo está actualizado a la versión más reciente.`;
            }
        } else {
            el.updateWarningBadge.style.display = "none";
        }
    } catch (err) {
        console.error("Error checking firmware update:", err);
    }
}

function getCategoryFromPath(path) {
    const parts = path.split("/").filter(Boolean);
    if (parts.length >= 2) {
        const idx = parts.findIndex(p => p.toLowerCase() === "amiibo");
        if (idx !== -1 && idx + 1 < parts.length) {
            const folderName = parts[idx + 1];
            for (const [key, value] of Object.entries(CATEGORY_MAPPINGS)) {
                if (value.toLowerCase() === folderName.toLowerCase()) return key;
            }
            return folderName;
        }
    }
    return "all";
}

async function refreshExplorer() {
    if (!state.isConnected) return;
    
    if (state.explorerTabMode === "gallery") {
        await refreshGalleryMode();
        return;
    }
    
    if (state.explorerViewMode === "list") {
        el.explorerTableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    <span class="material-symbols-rounded pulse" style="font-size: 2rem; animation: pulse 1.5s infinite;">progress_activity</span>
                    <div style="margin-top: 8px;">Cargando archivos...</div>
                </td>
            </tr>
        `;
    } else {
        el.explorerGridContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 48px;">
                <span class="material-symbols-rounded pulse" style="font-size: 2.5rem; animation: pulse 1.5s infinite; color: var(--text-muted);">progress_activity</span>
                <div style="margin-top: 12px; font-weight: 600;">Cargando archivos...</div>
            </div>
        `;
    }
    
    try {
        const res = await state.client.readFolder(state.currentPath);
        if (res.ok) {
            state.currentEntries = res.data;
            renderExplorer(res.data);
            renderBreadcrumb();
            if (state.currentPath === "E:/") {
                checkEncryptionKeyStatus();
            }
            // Asynchronously load child counts for directories
            loadFolderChildCounts(res.data);
        } else {
            showToast(`Error al leer carpeta: ${res.error}`, "error");
        }
    } catch (err) {
        showToast(`Error de conexión: ${err.message}`, "error");
    }
}

async function loadFolderChildCounts(entries) {
    const dirs = entries.filter(e => e.type === "DIR");
    for (const dir of dirs) {
        try {
            const childPath = joinPaths(state.currentPath, dir.name);
            const childRes = await state.client.readFolder(childPath);
            if (childRes.ok) {
                dir._childCount = childRes.data.length;
            } else {
                dir._childCount = 0;
            }
        } catch {
            dir._childCount = 0;
        }
    }
    // Re-render to show updated counts (only if we're still on the same path)
    if (state.currentEntries === entries) {
        renderExplorer(entries);
    }
}

function renderBreadcrumb() {
    if (!state.isConnected) {
        el.explorerBreadcrumb.innerHTML = '<span class="breadcrumb-link" data-path="E:/">Root</span>';
        return;
    }
    
    const parts = state.currentPath.split("/").filter(Boolean);
    let pathAcc = "E:/";
    let html = `<span class="breadcrumb-link" data-path="E:/">Root</span>`;
    
    for (let i = 1; i < parts.length; i++) {
        pathAcc = pathAcc + (pathAcc === "E:/" ? "" : "/") + parts[i];
        html += ` <span class="breadcrumb-separator">/</span> <span class="breadcrumb-link" data-path="${pathAcc}">${parts[i]}</span>`;
    }
    el.explorerBreadcrumb.innerHTML = html;
}

function renderExplorer(entries) {
    let sorted = [...entries];
    const sortVal = el.explorerSortSelect.value;
    
    const dirs = sorted.filter(e => e.type === "DIR");
    const files = sorted.filter(e => e.type !== "DIR");
    
    // Sort directories alphabetically (always on top)
    if (sortVal === "name-desc") {
        dirs.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: 'base', numeric: true }));
    } else {
        dirs.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }));
    }
    
    // Sort files based on chosen sort value
    if (sortVal === "name-asc") {
        files.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }));
    } else if (sortVal === "name-desc") {
        files.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: 'base', numeric: true }));
    } else if (sortVal === "size-asc") {
        files.sort((a, b) => a.size - b.size);
    } else if (sortVal === "size-desc") {
        files.sort((a, b) => b.size - a.size);
    }
    
    const finalEntries = [...dirs, ...files];
    
    if (state.explorerViewMode === "list") {
        el.explorerTableContainer.style.display = "block";
        el.explorerGridContainer.style.display = "none";
        renderExplorerTable(finalEntries);
    } else {
        el.explorerTableContainer.style.display = "none";
        el.explorerGridContainer.style.display = "grid";
        renderExplorerGrid(finalEntries);
    }
}

function renderExplorerTable(entries) {
    if (entries.length === 0) {
        el.explorerTableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    Esta carpeta está vacía.
                </td>
            </tr>
        `;
        return;
    }
    
    el.explorerTableBody.innerHTML = "";
    
    if (state.currentPath !== "E:/") {
        const tr = document.createElement("tr");
        tr.style.cursor = "pointer";
        tr.addEventListener("click", () => {
            state.currentPath = getParentPath(state.currentPath);
            refreshExplorer();
        });
        
        tr.innerHTML = `
            <td></td>
            <td colspan="3" class="file-row-name-container">
                <span class="material-symbols-rounded file-icon">arrow_back</span>
                <span>.. (Subir nivel)</span>
            </td>
        `;
        el.explorerTableBody.appendChild(tr);
    }
    
    entries.forEach(e => {
        const tr = document.createElement("tr");
        if (state.selectedItems.has(e.name)) {
            tr.classList.add("selected");
        }
        
        const tdCheck = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = state.selectedItems.has(e.name);
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                state.selectedItems.add(e.name);
                tr.classList.add("selected");
            } else {
                state.selectedItems.delete(e.name);
                tr.classList.remove("selected");
            }
        });
        tdCheck.appendChild(checkbox);
        
        const tdName = document.createElement("td");
        tdName.className = "file-row-name-container";
        tdName.style.cursor = e.type === "DIR" ? "pointer" : "default";
        
        const icon = document.createElement("span");
        icon.className = "material-symbols-rounded file-icon";
        icon.textContent = e.type === "DIR" ? "folder" : "description";
        if (e.type === "DIR") icon.style.color = "#3b82f6";
        
        const label = document.createElement("span");
        label.textContent = e.name;
        
        tdName.appendChild(icon);
        tdName.appendChild(label);
        
        if (e.type === "DIR") {
            tdName.addEventListener("click", () => {
                state.currentPath = joinPaths(state.currentPath, e.name);
                refreshExplorer();
            });
        }
        
        const tdSize = document.createElement("td");
        if (e.type === "DIR") {
            tdSize.textContent = e._childCount != null ? `${e._childCount} elementos` : "...";
            tdSize.style.color = "var(--text-muted)";
            tdSize.style.fontSize = "0.8rem";
        } else {
            tdSize.textContent = e.size >= 1024 ? `${(e.size / 1024).toFixed(1)} KB` : `${e.size} B`;
        }
        
        const tdActions = document.createElement("td");
        tdActions.className = "file-actions";
        
        const btnRename = document.createElement("button");
        btnRename.className = "action-icon-btn";
        btnRename.innerHTML = `<span class="material-symbols-rounded">edit</span>`;
        btnRename.title = "Renombrar";
        btnRename.addEventListener("click", (evt) => {
            evt.stopPropagation();
            openRenameModal(e.name);
        });
        
        const btnDelete = document.createElement("button");
        btnDelete.className = "action-icon-btn delete";
        btnDelete.innerHTML = `<span class="material-symbols-rounded">delete</span>`;
        btnDelete.title = "Eliminar";
        btnDelete.addEventListener("click", (evt) => {
            evt.stopPropagation();
            openDeleteModal(e.name);
        });
        
        tdActions.appendChild(btnRename);
        tdActions.appendChild(btnDelete);
        
        tr.appendChild(tdCheck);
        tr.appendChild(tdName);
        tr.appendChild(tdSize);
        tr.appendChild(tdActions);
        
        el.explorerTableBody.appendChild(tr);
    });
}

function renderExplorerGrid(entries) {
    el.explorerGridContainer.innerHTML = "";
    
    if (entries.length === 0 && state.currentPath === "E:/") {
        el.explorerGridContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 48px;">
                Esta carpeta está vacía.
            </div>
        `;
        return;
    }
    
    if (state.currentPath !== "E:/") {
        const card = document.createElement("div");
        card.className = "amiibo-card";
        card.style.justifyContent = "center";
        card.style.minHeight = "200px";
        
        const imgWrap = document.createElement("div");
        imgWrap.className = "amiibo-img-wrap";
        imgWrap.innerHTML = `<span class="material-symbols-rounded" style="font-size: 4rem; color: var(--text-secondary);">arrow_back</span>`;
        
        const info = document.createElement("div");
        info.className = "amiibo-info";
        const nameEl = document.createElement("div");
        nameEl.className = "amiibo-card-name";
        nameEl.textContent = ".. Subir Nivel";
        info.appendChild(nameEl);
        
        card.appendChild(imgWrap);
        card.appendChild(info);
        
        card.addEventListener("click", () => {
            state.currentPath = getParentPath(state.currentPath);
            refreshExplorer();
        });
        el.explorerGridContainer.appendChild(card);
    }
    
    if (entries.length === 0 && state.currentPath !== "E:/") return;
    
    const category = getCategoryFromPath(state.currentPath);
    
    entries.forEach(e => {
        const card = document.createElement("div");
        card.className = "amiibo-card";
        if (state.selectedItems.has(e.name)) {
            card.classList.add("selected");
        }
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "amiibo-card-checkbox";
        checkbox.checked = state.selectedItems.has(e.name);
        checkbox.addEventListener("change", (evt) => {
            evt.stopPropagation();
            if (checkbox.checked) {
                state.selectedItems.add(e.name);
                card.classList.add("selected");
            } else {
                state.selectedItems.delete(e.name);
                card.classList.remove("selected");
            }
        });
        card.appendChild(checkbox);
        
        card.addEventListener("click", (evt) => {
            if (evt.target.closest("button") || evt.target.closest("input[type='checkbox']")) return;
            evt.preventDefault();
            
            if (e.type === "DIR") {
                state.currentPath = joinPaths(state.currentPath, e.name);
                refreshExplorer();
            } else {
                const isSelected = state.selectedItems.has(e.name);
                if (isSelected) {
                    state.selectedItems.delete(e.name);
                    card.classList.remove("selected");
                    checkbox.checked = false;
                } else {
                    state.selectedItems.add(e.name);
                    card.classList.add("selected");
                    checkbox.checked = true;
                }
            }
        });
        
        const imgWrap = document.createElement("div");
        imgWrap.className = "amiibo-img-wrap";
        
        if (e.type === "DIR") {
            imgWrap.innerHTML = `<span class="material-symbols-rounded" style="font-size: 4.5rem; color: #3b82f6;">folder</span>`;
        } else {
            const img = document.createElement("img");
            img.className = "amiibo-img";
            img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24'><path fill='%2394a3b8' d='M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z'/></svg>";
            img.style.opacity = "0.3";
            imgWrap.appendChild(img);
        }
        
        const info = document.createElement("div");
        info.className = "amiibo-info";
        
        const nameEl = document.createElement("div");
        nameEl.className = "amiibo-card-name";
        nameEl.textContent = e.type === "DIR" ? e.name : e.name.replace(/\.bin$|\.nfc$/i, '');
        nameEl.title = e.name;
        
        const subtitleEl = document.createElement("div");
        subtitleEl.className = "amiibo-card-series";
        if (e.type === "DIR") {
            subtitleEl.textContent = e._childCount != null ? `Carpeta (${e._childCount} elem.)` : "Carpeta";
        } else {
            subtitleEl.textContent = `Archivo (${e.size >= 1024 ? (e.size / 1024).toFixed(1) + ' KB' : e.size + ' B'})`;  
        }
        
        info.appendChild(nameEl);
        info.appendChild(subtitleEl);
        
        const actionsDiv = document.createElement("div");
        actionsDiv.style.display = "flex";
        actionsDiv.style.width = "100%";
        actionsDiv.style.justifyContent = "center";
        actionsDiv.style.gap = "8px";
        actionsDiv.style.marginTop = "8px";
        
        const btnRename = document.createElement("button");
        btnRename.className = "btn btn-secondary";
        btnRename.style.padding = "4px 8px";
        btnRename.style.fontSize = "0.8rem";
        btnRename.innerHTML = `<span class="material-symbols-rounded" style="font-size: 1rem;">edit</span>`;
        btnRename.title = "Renombrar";
        btnRename.addEventListener("click", (evt) => {
            evt.stopPropagation();
            openRenameModal(e.name);
        });
        
        const btnDelete = document.createElement("button");
        btnDelete.className = "btn btn-secondary";
        btnDelete.style.padding = "4px 8px";
        btnDelete.style.fontSize = "0.8rem";
        btnDelete.innerHTML = `<span class="material-symbols-rounded" style="font-size: 1rem; color: var(--danger);">delete</span>`;
        btnDelete.title = "Eliminar";
        btnDelete.addEventListener("click", (evt) => {
            evt.stopPropagation();
            openDeleteModal(e.name);
        });
        
        actionsDiv.appendChild(btnRename);
        actionsDiv.appendChild(btnDelete);
        
        card.appendChild(imgWrap);
        card.appendChild(info);
        card.appendChild(actionsDiv);
        
        el.explorerGridContainer.appendChild(card);
        
        if (e.type !== "DIR") {
            const cleanName = e.name.replace(/\.bin$|\.nfc$/i, '');
            fetchAmiiboImageAndDetails(cleanName, category, card);
        }
    });
}

// --- Folder & File selection upload queue ---

function collectFoldersFromPath(relPath, set) {
    const parts = relPath.split("/").filter(Boolean);
    for (let i = 1; i < parts.length; i++) {
        set.add(parts.slice(0, i).join("/"));
    }
}

async function handleFilesSelected(fileList) {
    const collected = {
        folders: new Set(),
        files: []
    };
    
    for (const f of fileList) {
        const relPath = f.webkitRelativePath || f.name;
        collected.files.push({
            relativePath: relPath,
            file: f
        });
        if (f.webkitRelativePath) {
            collectFoldersFromPath(relPath, collected.folders);
        }
    }
    
    planUpload(collected.folders, collected.files);
}

// Traverse dropped folders recursively
async function collectFromDataTransfer(dataTransfer) {
    const folders = new Set();
    const files = [];
    
    const entries = Array.from(dataTransfer.items)
        .filter(item => item.kind === "file")
        .map(item => item.webkitGetAsEntry?.())
        .filter(Boolean);

    function readAllEntries(reader) {
        return new Promise((resolve, reject) => {
            const all = [];
            function next() {
                reader.readEntries((batch) => {
                    if (batch.length === 0) resolve(all);
                    else {
                        all.push(...batch);
                        next();
                    }
                }, reject);
            }
            next();
        });
    }

    function fileFromEntry(entry) {
        return new Promise((resolve, reject) => entry.file(resolve, reject));
    }

    async function walk(entry, prefix) {
        if (entry.isDirectory) {
            if (prefix) folders.add(prefix);
            const children = await readAllEntries(entry.createReader());
            await Promise.all(
                children.map(child => walk(child, prefix ? `${prefix}/${child.name}` : child.name))
            );
        } else {
            const f = await fileFromEntry(entry);
            files.push({ relativePath: prefix || f.name, file: f });
            if (prefix) collectFoldersFromPath(prefix, folders);
        }
    }

    for (const entry of entries) {
        await walk(entry, entry.name);
    }

    return { folders, files };
}

function planUpload(folders, files) {
    const base = state.currentPath;
    const sortedFolders = [...folders].sort((a, b) => {
        const d = a.split("/").length - b.split("/").length;
        return d !== 0 ? d : a.localeCompare(b);
    });
    
    const plan = [];
    const warnings = [];
    
    // 1. Plan folder creation
    sortedFolders.forEach(rel => {
        // Apply folder sanitization (e.g. Zelda, Smash)
        const parts = rel.split("/");
        const category = parts[0];
        const shortCategory = getCleanCategoryFolder(category);
        
        let pathParts = [shortCategory];
        for(let i=1; i<parts.length; i++) {
            pathParts.push(sanitizeName(parts[i]));
        }
        
        const sanitizedRel = pathParts.join("/");
        const remote = joinPaths(base, sanitizedRel);
        
        let error = null;
        const byteLen = utf8ByteLength(remote);
        if (byteLen > MAX_FOLDER_PATH_BYTES) {
            error = `Ruta de carpeta excede los ${MAX_FOLDER_PATH_BYTES} bytes (${byteLen} bytes)`;
        }
        
        if (error) {
            warnings.push({ path: rel, error });
            plan.push({ kind: "folder", localPath: rel, remotePath: remote, status: "skipped", reason: error });
        } else {
            plan.push({ kind: "folder", localPath: rel, remotePath: remote, status: "pending" });
        }
    });
    
    // 2. Plan file uploads
    files.forEach(entry => {
        // Apply path sanitization to files too
        const parts = entry.relativePath.split("/");
        const category = parts[0];
        let sanitizedRel = "";
        
        if (parts.length > 1) {
            const shortCategory = getCleanCategoryFolder(category);
            let pathParts = [shortCategory];
            for (let i = 1; i < parts.length - 1; i++) {
                pathParts.push(sanitizeName(parts[i]));
            }
            const cleanFilename = sanitizeName(parts[parts.length - 1]);
            pathParts.push(cleanFilename + (cleanFilename.toLowerCase().endsWith(".bin") ? "" : ".bin"));
            sanitizedRel = pathParts.join("/");
        } else {
            // Loose files outside folders
            const cleanFilename = sanitizeName(entry.relativePath);
            sanitizedRel = cleanFilename + (cleanFilename.toLowerCase().endsWith(".bin") ? "" : ".bin");
        }
        
        const remote = joinPaths(base, sanitizedRel);
        
        let error = null;
        const totalByteLen = utf8ByteLength(remote);
        const nameByteLen = utf8ByteLength(getBaseName(remote));
        
        if (totalByteLen > MAX_FILE_PATH_BYTES) {
            error = `Ruta excede los ${MAX_FILE_PATH_BYTES} bytes (${totalByteLen} bytes)`;
        } else if (nameByteLen > MAX_FILE_NAME_BYTES) {
            error = `Nombre de archivo excede los ${MAX_FILE_NAME_BYTES} bytes (${nameByteLen} bytes)`;
        }
        
        if (error) {
            warnings.push({ path: entry.relativePath, error });
            plan.push({ kind: "file", localPath: entry.relativePath, remotePath: remote, file: entry.file, status: "skipped", reason: error });
        } else {
            plan.push({ kind: "file", localPath: entry.relativePath, remotePath: remote, file: entry.file, status: "pending" });
        }
    });
    
    state.uploadQueue = plan;
    renderUploadQueue();
    
    if (warnings.length > 0) {
        showWarningModal(warnings);
    }
}

function renderUploadQueue() {
    if (state.uploadQueue.length === 0) {
        el.queueList.innerHTML = `<div class="queue-empty-msg" id="queue-empty-msg">No hay archivos en cola. Arrastra archivos/carpetas aquí.</div>`;
        el.btnQueueStart.disabled = true;
        el.btnQueueClear.disabled = true;
        el.queueProgress.hidden = true;
        return;
    }
    
    el.btnQueueClear.disabled = false;
    // Enable start only if there are pending items
    const hasPending = state.uploadQueue.some(item => item.status === "pending");
    el.btnQueueStart.disabled = !state.isConnected || !hasPending;
    
    el.queueList.innerHTML = "";
    state.uploadQueue.forEach(item => {
        const div = document.createElement("div");
        div.className = "queue-item";
        
        const spanName = document.createElement("span");
        spanName.className = "queue-item-name";
        spanName.textContent = `${item.kind === "folder" ? "[Carpeta] " : ""}${item.localPath}`;
        spanName.title = `Destino: ${item.remotePath}`;
        
        const spanStatus = document.createElement("span");
        spanStatus.className = `queue-item-status ${item.status}`;
        spanStatus.textContent = item.status === "error" ? "Error" : 
                                 item.status === "uploading" ? "Subiendo..." : 
                                 item.status === "skipped" ? "Ignorado" : 
                                 item.status === "pending" ? "Pendiente" : "Completado";
        
        div.appendChild(spanName);
        div.appendChild(spanStatus);
        el.queueList.appendChild(div);
    });
}

async function runQueueUpload() {
    if (state.uploadQueue.length === 0 || !state.isConnected) return;
    
    state.abortUpload = false;
    el.btnQueueStart.style.display = "none";
    el.btnQueueCancel.style.display = "flex";
    el.btnQueueCancel.disabled = false;
    el.btnQueueClear.disabled = true;
    el.explorerActions.querySelectorAll("button").forEach(b => b.disabled = true);
    
    el.queueProgress.hidden = false;
    el.queueProgress.textContent = "0%";
    
    const pendingItems = state.uploadQueue.filter(i => i.status === "pending");
    const totalCount = pendingItems.length;
    let completedCount = 0;
    
    for (let item of state.uploadQueue) {
        if (state.abortUpload) {
            logEvent("Subida detenida por el usuario.");
            showToast("Subida cancelada por el usuario.", "error");
            break;
        }
        
        if (item.status !== "pending") continue;
        
        item.status = "uploading";
        renderUploadQueue();
        
        try {
            if (item.kind === "folder") {
                logEvent(`Creando carpeta en dispositivo: ${item.remotePath}`);
                await state.client.createFolder(item.remotePath);
            } else {
                let fileObj = item.file;
                if (item.githubUrl) {
                    logEvent(`Descargando binario desde: ${item.githubUrl}`);
                    const response = await fetch(item.githubUrl);
                    if (!response.ok) throw new Error(`HTTP ${response.status} al descargar de Archive`);
                    fileObj = await response.blob();
                    item.file = fileObj;
                }
                
                logEvent(`Subiendo archivo: ${item.remotePath} (${fileObj.size} bytes)`);
                
                if (state.client instanceof DevMockClient) {
                    await state.client.uploadFile(item.remotePath, fileObj, (progress, total) => {
                        const pct = Math.round((progress / total) * 100);
                        el.queueProgress.textContent = `${Math.round(((completedCount + (progress / total)) / totalCount) * 100)}%`;
                    });
                } else {
                    const openRes = await state.client.openFile(item.remotePath, "w");
                    if (!openRes.ok) throw new Error(openRes.error);
                    
                    const fileId = openRes.fileId;
                    try {
                        const totalSize = fileObj.size;
                        let offset = 0;
                        const chunkSize = state.client.maxChunkSize;
                        
                        while (offset < totalSize) {
                            if (state.abortUpload) throw new Error("Cancelado por el usuario");
                            
                            const end = Math.min(offset + chunkSize, totalSize);
                            const chunk = new Uint8Array(await item.file.slice(offset, end).arrayBuffer());
                            
                            const writeRes = await state.client.writeFileChunk(fileId, chunk);
                            if (!writeRes.ok) throw new Error(writeRes.error);
                            
                            offset = end;
                            const filePct = offset / totalSize;
                            el.queueProgress.textContent = `${Math.round(((completedCount + filePct) / totalCount) * 100)}%`;
                        }
                    } finally {
                        await state.client.closeFile(fileId).catch(() => {});
                    }
                }
            }
            item.status = "done";
        } catch (err) {
            item.status = "error";
            showToast(`Error en ${item.localPath}: ${err.message}`, "error");
            logEvent(`Fallo de subida: ${err.message}`);
        }
        
        completedCount++;
        renderUploadQueue();
    }
    
    el.btnQueueStart.style.display = "flex";
    el.btnQueueCancel.style.display = "none";
    el.btnQueueClear.disabled = false;
    el.explorerActions.querySelectorAll("button").forEach(b => b.disabled = false);
    
    if (!state.abortUpload) {
        el.queueProgress.textContent = "100%";
        showToast("Cola de transferencia finalizada.");
    }
    
    state.abortUpload = false;
    updateStorageBar();
    refreshExplorer();
}

// --- Online Database Logic ---

async function initOnlineCatalogue() {
    try {
        let loaded = false;
        const cachedDb = localStorage.getItem("cached_amiibo_db_v2");
        if (cachedDb) {
            try {
                const parsedCache = JSON.parse(cachedDb);
                let count = 0;
                Object.values(parsedCache).forEach(arr => count += arr.length);
                if (count >= 500) {
                    state.categories = parsedCache;
                    populateCategoryDropdown();
                    renderOnlineCatalogue();
                    loaded = true;
                }
            } catch(e) {}
        }
        
        // Fetch full AmiiboAPI list once for fast matching
        try {
            const apiRes = await fetch("https://www.amiiboapi.org/api/amiibo/");
            if (apiRes.ok) {
                const apiJson = await apiRes.json();
                if (apiJson && apiJson.amiibo) {
                    state.amiiboApiList = apiJson.amiibo;
                }
            }
        } catch (apiErr) {
            console.warn("AmiiboAPI offline:", apiErr.message);
        }
        
        // If not loaded or outdated, sync automatically from Archive
        if (!loaded) {
            await syncCatalogueFromArchive();
        }
    } catch (err) {
        logEvent(`Error al inicializar base de datos: ${err.message}`);
    }
}

function populateCategoryDropdown() {
    let totalCount = 0;
    Object.values(state.categories).forEach(arr => totalCount += arr.length);
    
    el.filterCategory.innerHTML = `<option value="all">Todas las Series (${totalCount} Amiibos)</option>`;
    
    // Sort categories alphabetically
    const sortedCategories = Object.keys(state.categories).sort((a, b) => a.localeCompare(b));
    
    sortedCategories.forEach(cat => {
        const items = state.categories[cat];
        const subpaths = new Set(items.map(a => a.subPath).filter(Boolean));
        
        if (subpaths.size > 0) {
            const optgroup = document.createElement("optgroup");
            optgroup.label = `📁 ${cat} (${items.length})`;
            
            const allInCatOpt = document.createElement("option");
            allInCatOpt.value = cat;
            allInCatOpt.textContent = `⚡ Todo ${cat} (${items.length})`;
            optgroup.appendChild(allInCatOpt);
            
            const sortedSubpaths = Array.from(subpaths).sort((a, b) => a.localeCompare(b));
            sortedSubpaths.forEach(sub => {
                const subCount = items.filter(a => a.subPath === sub).length;
                const cleanSubName = sub.replace(/^Amiibo Cards\/!?/i, '').replace(/^!?/, '');
                const opt = document.createElement("option");
                opt.value = `${cat}::${sub}`;
                opt.textContent = `└─ ${cleanSubName} (${subCount})`;
                optgroup.appendChild(opt);
            });
            
            el.filterCategory.appendChild(optgroup);
        } else {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = `${cat} (${items.length})`;
            el.filterCategory.appendChild(opt);
        }
    });
}

async function syncCatalogueFromArchive() {
    const originalText = el.btnCatSync.innerHTML;
    el.btnCatSync.disabled = true;
    el.btnCatSync.innerHTML = `<span class="material-symbols-rounded pulse" style="font-size: 1.1rem; animation: pulse 1s infinite;">sync</span> Sincronizando...`;
    showToast("Sincronizando catálogo con Internet Archive...");
    
    try {
        const categories = {};
        const res = await fetch("https://archive.org/download/nintendo-amiibo-nfc-vault/Amiibo%20Bin.zip/");
        if (!res.ok) throw new Error("No se pudo conectar con el listado de Archive.org.");
        const html = await res.text();
        
        const re = /href=["']([^"']+)["']/gi;
        let m;
        let fileCount = 0;
        
        while ((m = re.exec(html)) !== null) {
            const href = m[1];
            if (!href) continue;
            if (!href.toLowerCase().includes(".bin") && !href.toLowerCase().includes(".nfc")) continue;
            
            let decoded = decodeURIComponent(href);
            const zipPrefix = "Amiibo Bin.zip/";
            const idx = decoded.indexOf(zipPrefix);
            let relPath = idx !== -1 ? decoded.substring(idx + zipPrefix.length) : decoded;
            
            if (relPath.startsWith("Amiibo Bin/")) {
                relPath = relPath.substring("Amiibo Bin/".length);
            }
            
            const ext = relPath.toLowerCase().endsWith(".nfc") ? "nfc" : "bin";
            const parts = relPath.split("/").filter(Boolean);
            const filename = parts[parts.length - 1];
            
            // Skip hidden files
            if (filename.startsWith("._") || filename.startsWith(".")) continue;
            
            let categoryName = "Otros";
            let subPath = "";
            
            if (parts.length >= 2) {
                categoryName = parts[0];
                if (parts.length > 2) {
                    subPath = parts.slice(1, parts.length - 1).join("/");
                }
            }
            
            if (categoryName.toLowerCase() === "images") continue;
            
            if (!categories[categoryName]) {
                categories[categoryName] = [];
            }
            
            const name = filename.substring(0, filename.lastIndexOf('.'));
            
            // Raw encoded URL for fetch
            const downloadUrl = href.startsWith("//") 
                ? "https:" + href 
                : (href.startsWith("http") ? href : "https://archive.org" + href);
            
            categories[categoryName].push({
                name: name,
                path: downloadUrl,
                rawRelativePath: relPath,
                subPath: subPath,
                ext: ext
            });
            fileCount++;
        }
        
        if (fileCount === 0) {
            throw new Error("No se encontraron Amiibos válidos (.bin o .nfc) dentro del ZIP en Archive.org.");
        }
        
        for (const cat of Object.keys(categories)) {
            categories[cat].sort((a, b) => a.name.localeCompare(b.name));
        }
        
        state.categories = categories;
        localStorage.setItem("cached_amiibo_db_v2", JSON.stringify(categories));
        
        populateCategoryDropdown();
        renderOnlineCatalogue();
        showToast(`¡Catálogo sincronizado! Se encontraron ${fileCount} Amiibos en Internet Archive.`);
    } catch (err) {
        logEvent(`Error al sincronizar desde Archive.org: ${err.message}`);
        showToast(`Error de sincronización: ${err.message}`, "error");
    } finally {
        el.btnCatSync.disabled = false;
        el.btnCatSync.innerHTML = originalText;
    }
}

function normalizeString(str) {
    if (!str) return "";
    return str.normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") // remove accents
              .toLowerCase()
              .replace(/[^a-z0-9]/g, ' ')      // replace all non-alphanumeric characters with spaces
              .replace(/\s+/g, ' ')            // collapse multiple spaces
              .trim();
}

function cleanAmiiboNameForSearch(name) {
    // Clean prefix like "[AC] AF1 - " or "[AC] 001 - "
    let clean = name.replace(/^\[[^\]]+\]\s*[^-\n]*-\s*/, '');
    // Replace parenthesis with spaces instead of stripping!
    clean = clean.replace(/[()]/g, ' ').trim();
    return clean;
}

function findAmiiboInList(name, category) {
    if (!state.amiiboApiList) return null;
    
    const normSearch = normalizeString(name);
    const normCategory = normalizeString(category);
    const searchTokens = normSearch.split(' ').filter(Boolean);
    
    let bestMatch = null;
    let highestScore = 0;
    
    for (const item of state.amiiboApiList) {
        const normApi = normalizeString(item.name);
        const normChar = normalizeString(item.character);
        const normSeries = normalizeString(item.amiiboSeries);
        const normGame = normalizeString(item.gameSeries);
        
        const apiTokens = normApi.split(' ').filter(Boolean);
        const charTokens = normChar.split(' ').filter(Boolean);
        
        let score = 0;
        
        // 1. Name Similarity
        if (normSearch === normApi) {
            score += 1000;
        } else if (normSearch.includes(normApi) || normApi.includes(normSearch)) {
            const lenDiff = Math.abs(normSearch.length - normApi.length);
            score += Math.max(0, 500 - lenDiff * 10);
        }
        
        // 2. Character overlap
        const hasCharOverlap = charTokens.some(t => searchTokens.includes(t));
        if (hasCharOverlap) {
            score += 150;
        }
        
        // 3. Category/Series match
        if (normCategory === normSeries || normCategory === normGame) {
            score += 200;
        } else if (normCategory.includes(normSeries) || normSeries.includes(normCategory) ||
                   normCategory.includes(normGame) || normGame.includes(normCategory)) {
            score += 100;
        }
        
        // 4. Token overlap ratio
        let tokenMatches = 0;
        searchTokens.forEach(t => {
            if (apiTokens.includes(t)) tokenMatches++;
        });
        
        if (tokenMatches > 0) {
            const matchRatio = tokenMatches / searchTokens.length;
            score += matchRatio * 500;
            if (tokenMatches === searchTokens.length) {
                score += 500; // all search tokens match bonus
            }
        }
        
        if (score > highestScore) {
            highestScore = score;
            bestMatch = item;
        }
    }
    
    return highestScore >= 150 ? bestMatch : null;
}

async function fetchAmiiboImageAndDetails(name, category, cardElement) {
    const cacheKey = `${category}_${name}`;
    if (state.imagesCache[cacheKey]) {
        applyImageToCard(cardElement, state.imagesCache[cacheKey]);
        return;
    }
    
    // 1. Try to find in loaded memory list
    const match = findAmiiboInList(name, category);
    if (match) {
        state.imagesCache[cacheKey] = {
            image: match.image,
            character: match.character,
            amiiboSeries: match.amiiboSeries
        };
        applyImageToCard(cardElement, state.imagesCache[cacheKey]);
        return;
    }
    
    // 2. Fallback to individual API call (using amiiboapi.org)
    const searchName = cleanAmiiboNameForSearch(name);
    try {
        const res = await fetch(`https://www.amiiboapi.org/api/amiibo/?name=${encodeURIComponent(searchName)}`);
        if (!res.ok) throw new Error("Amiibo not found");
        
        const json = await res.json();
        if (json.amiibo && json.amiibo.length > 0) {
            // Find the best match using our robust logic in the API returned list
            const matchInRes = findAmiiboInList(name, category) || json.amiibo[0];
            let item = matchInRes;
            
            state.imagesCache[cacheKey] = {
                image: item.image,
                character: item.character,
                amiiboSeries: item.amiiboSeries
            };
            
            applyImageToCard(cardElement, state.imagesCache[cacheKey]);
        }
    } catch (err) {
        // Fallback placeholder image
        const fallbackInfo = {
            image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%23cbd5e1'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 12 12 12 12-4.48 12-12S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z'/></svg>",
            character: name,
            amiiboSeries: category
        };
        applyImageToCard(cardElement, fallbackInfo);
    }
}

function applyImageToCard(cardElement, info) {
    const imgEl = cardElement.querySelector(".amiibo-img");
    if (imgEl) {
        imgEl.src = info.image;
        imgEl.style.opacity = "1";
    }
    if (info.amiiboSeries) {
        const seriesEl = cardElement.querySelector(".amiibo-card-series");
        if (seriesEl) {
            seriesEl.textContent = info.amiiboSeries;
        }
    }
}

function updateCatalogueSelectionUI() {
    const count = state.selectedCatalogue.size;
    el.catSelectedCount.textContent = count;
    el.btnCatInstall.disabled = count === 0 || !state.isConnected;
}

function renderOnlineCatalogue() {
    el.amiiboGrid.innerHTML = "";
    
    const searchVal = el.searchAmiibo.value.toLowerCase();
    const filterVal = el.filterCategory.value;
    
    let selectedCat = filterVal;
    let selectedSub = null;
    if (filterVal !== "all" && filterVal.includes("::")) {
        const parts = filterVal.split("::");
        selectedCat = parts[0];
        selectedSub = parts[1];
    }
    
    const rendered = new Set();
    
    Object.keys(state.categories).forEach(cat => {
        if (filterVal !== "all" && selectedCat !== cat) return;
        
        const list = state.categories[cat];
        list.forEach(amiibo => {
            if (selectedSub && amiibo.subPath !== selectedSub) return;
            if (searchVal && !amiibo.name.toLowerCase().includes(searchVal)) return;
            
            // Deduplicate based on path/unique key
            const uniqueKey = amiibo.path || `${cat}_${amiibo.name}`;
            if (rendered.has(uniqueKey)) return;
            rendered.add(uniqueKey);
            
            const card = document.createElement("div");
            card.className = "amiibo-card";
            if (state.selectedCatalogue.has(amiibo.path)) {
                card.classList.add("selected");
            }
            
            // Checkbox indicator
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "amiibo-card-checkbox";
            checkbox.checked = state.selectedCatalogue.has(amiibo.path);
            card.appendChild(checkbox);
            
            card.addEventListener("click", (evt) => {
                if (evt.target.closest("button") || evt.target.closest("input[type='checkbox']")) return;
                evt.preventDefault();
                
                const isSelected = state.selectedCatalogue.has(amiibo.path);
                if (isSelected) {
                    state.selectedCatalogue.delete(amiibo.path);
                    card.classList.remove("selected");
                    checkbox.checked = false;
                } else {
                    state.selectedCatalogue.add(amiibo.path);
                    card.classList.add("selected");
                    checkbox.checked = true;
                }
                updateCatalogueSelectionUI();
            });
            
            checkbox.addEventListener("change", () => {
                if (checkbox.checked) {
                    state.selectedCatalogue.add(amiibo.path);
                    card.classList.add("selected");
                } else {
                    state.selectedCatalogue.delete(amiibo.path);
                    card.classList.remove("selected");
                }
                updateCatalogueSelectionUI();
            });
            
            const imgWrap = document.createElement("div");
            imgWrap.className = "amiibo-img-wrap";
            
            const img = document.createElement("img");
            img.className = "amiibo-img";
            img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24'><path fill='%2394a3b8' d='M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z'/></svg>";
            img.style.opacity = "0.3";
            imgWrap.appendChild(img);
            
            const info = document.createElement("div");
            info.className = "amiibo-info";
            
            const nameEl = document.createElement("div");
            nameEl.className = "amiibo-card-name";
            nameEl.textContent = amiibo.name;
            nameEl.title = amiibo.name;
            
            const seriesEl = document.createElement("div");
            seriesEl.className = "amiibo-card-series";
            
            // Build informative series & subfolder label
            let displaySeries = CATEGORY_MAPPINGS[cat] || cat.replace(/ Amiibo$/i, '');
            if (amiibo.subPath) {
                const cleanSub = amiibo.subPath.replace(/^Amiibo Cards\/!?/i, '').replace(/^!?/, '');
                displaySeries = `${displaySeries} • ${cleanSub}`;
            }
            seriesEl.textContent = displaySeries;
            
            info.appendChild(nameEl);
            info.appendChild(seriesEl);
            
            const btnFlash = document.createElement("button");
            btnFlash.className = "btn btn-primary";
            btnFlash.style.width = "100%";
            btnFlash.style.marginTop = "8px";
            btnFlash.innerHTML = `<span class="material-symbols-rounded" style="font-size: 1.1rem;">install_mobile</span> Instalar`;
            btnFlash.disabled = !state.isConnected;
            
            btnFlash.addEventListener("click", (evt) => {
                evt.stopPropagation();
                openInstallFolderModal([{ amiibo, category: cat }]);
            });
            
            card.appendChild(imgWrap);
            card.appendChild(info);
            card.appendChild(btnFlash);
            
            el.amiiboGrid.appendChild(card);
            
            // Lazy load images
            fetchAmiiboImageAndDetails(amiibo.name, cat, card);
        });
    });
    
    if (el.amiiboGrid.children.length === 0) {
        el.amiiboGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 48px;">
                No se encontraron Amiibos con los filtros aplicados.
            </div>
        `;
    }
    updateCatalogueSelectionUI();
}

let _activeInstallList = [];
function openInstallFolderModal(amiibos) {
    _activeInstallList = amiibos;
    el.installCountText.textContent = amiibos.length;
    
    // Suggest folder name
    let suggestion = "Amiibos";
    if (amiibos.length > 0) {
        const firstCat = amiibos[0].category;
        const allSame = amiibos.every(item => item.category === firstCat);
        if (allSame) {
            suggestion = getCleanCategoryFolder(firstCat);
        }
    }
    
    el.installFolderInput.value = suggestion;
    el.installFolderError.style.display = "none";
    el.modalInstall.classList.add("active");
}

// Deprecated old standalone flashing method
async function flashAmiiboFromCatalogue(amiibo, category) {
    if (!state.isConnected) return;
    
    const githubRawUrl = baseDownloadUrl.endsWith('/') 
        ? `${baseDownloadUrl}${encodeURIComponent(amiibo.path)}` 
        : `${baseDownloadUrl}/${encodeURIComponent(amiibo.path)}`;
    
    // Work out local destination folder on Allmiibo
    const shortCategory = getCleanCategoryFolder(category);
    const destinationFolder = joinPaths("E:/amiibo", shortCategory);
    
    const cleanFilename = sanitizeName(amiibo.name) + ".bin";
    const remotePath = joinPaths(destinationFolder, cleanFilename);
    
    showToast(`Iniciando transferencia de ${cleanFilename}...`);
    logEvent(`Descargando de GitHub: ${githubRawUrl}`);
    
    try {
        // 1. Fetch file from GitHub
        const response = await fetch(githubRawUrl);
        if (!response.ok) throw new Error("No se pudo descargar el archivo binario del servidor.");
        const blob = await response.blob();
        
        // 2. Ensure folder on Allmiibo
        logEvent(`Verificando carpeta destino en dispositivo: ${destinationFolder}`);
        if (state.client instanceof DevMockClient) {
            await state.client.createFolder(destinationFolder);
        } else {
            // Recreate directories if needed
            await state.client.createFolder("E:/amiibo").catch(() => {});
            await state.client.createFolder(destinationFolder).catch(() => {});
        }
        
        // 3. Upload raw bytes to BLE
        logEvent(`Subiendo binario directamente al Allmiibo en: ${remotePath}`);
        
        if (state.client instanceof DevMockClient) {
            await state.client.uploadFile(remotePath, blob, () => {}, null);
        } else {
            const openRes = await state.client.openFile(remotePath, "w");
            if (!openRes.ok) throw new Error(openRes.error);
            const fileId = openRes.fileId;
            
            try {
                const totalSize = blob.size;
                let offset = 0;
                const chunkSize = state.client.maxChunkSize;
                
                while (offset < totalSize) {
                    const end = Math.min(offset + chunkSize, totalSize);
                    const chunk = new Uint8Array(await blob.slice(offset, end).arrayBuffer());
                    
                    const writeRes = await state.client.writeFileChunk(fileId, chunk);
                    if (!writeRes.ok) throw new Error(writeRes.error);
                    
                    offset = end;
                }
            } finally {
                await state.client.closeFile(fileId).catch(() => {});
            }
        }
        
        showToast(`${cleanFilename} instalado correctamente en el Allmiibo!`);
        updateStorageBar();
        if (state.currentPath === destinationFolder || state.currentPath === "E:/" || state.currentPath === "E:/amiibo") {
            refreshExplorer();
        }
    } catch (err) {
        showToast(`Fallo en la instalación: ${err.message}`, "error");
        logEvent(`Error al flashear desde catálogo: ${err.message}`);
    }
}

// --- Modals Handlers ---

let _activeDeleteName = "";
function openDeleteModal(name) {
    _activeDeleteName = name;
    el.deleteMessage.textContent = `¿Seguro que deseas eliminar "${name}"? Esta acción no se puede deshacer.`;
    el.modalDelete.classList.add("active");
}

let _activeRenameOldName = "";
function openRenameModal(name) {
    _activeRenameOldName = name;
    el.renameInput.value = name;
    el.renameError.style.display = "none";
    el.modalRename.classList.add("active");
}

function showWarningModal(warnings) {
    el.warningList.innerHTML = "";
    warnings.forEach(w => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${w.path}</strong>: ${w.error}`;
        el.warningList.appendChild(li);
    });
    el.modalWarning.classList.add("active");
}

// --- Auto Key & Help Modal Handlers ---

async function downloadKeysFromGitHub() {
    el.autoKeyError.style.display = "none";
    el.autoKeyProgress.style.display = "flex";
    el.btnAutoKeyConfirm.disabled = true;
    el.btnAutoKeyCancel.disabled = true;
    
    const urlKey = el.inputKeyUrl ? el.inputKeyUrl.value.trim() : "https://archive.org/download/nintendo-amiibo-nfc-vault/%21Essential%20Files.zip/%21Essential%20Files%2Fkey_retail.bin";
    
    try {
        logEvent(`Descargando key_retail.bin desde: ${urlKey}`);
        const res = await fetch(urlKey);
        if (!res.ok) throw new Error(`No se pudo descargar key_retail.bin (HTTP ${res.status})`);
        const buf = await res.arrayBuffer();
        
        if (buf.byteLength !== 160) {
            throw new Error(`El archivo descargado no mide 160 bytes (mide ${buf.byteLength} bytes). La clave key_retail.bin debe medir exactamente 160 bytes.`);
        }
        
        logEvent("Cargando clave en el dispositivo...");
        const blob = new Blob([buf], { type: "application/octet-stream" });
        
        state.uploadQueue = [{
            kind: "file",
            localPath: "key_retail.bin",
            remotePath: "E:/key_retail.bin",
            file: blob,
            status: "pending"
        }];
        
        renderUploadQueue();
        el.modalAutoKey.classList.remove("active");
        
        document.querySelector('[data-tab="local-tab"]').click();
        await runQueueUpload();
        
        checkEncryptionKeyStatus();
        showToast("Clave key_retail.bin instalada con éxito desde Internet Archive.");
    } catch (err) {
        logEvent(`Error en descarga automática de clave: ${err.message}`);
        el.autoKeyError.textContent = `Error: ${err.message}`;
        el.autoKeyError.style.display = "block";
    } finally {
        el.autoKeyProgress.style.display = "none";
        el.btnAutoKeyConfirm.disabled = false;
        el.btnAutoKeyCancel.disabled = false;
    }
}

// --- Recursive file scanner & Gallery Renderer ---

async function scanFilesRecursively(dir = "E:/") {
    let files = [];
    const res = await state.client.readFolder(dir);
    if (res.ok) {
        for (const entry of res.data) {
            const entryPath = joinPaths(dir, entry.name);
            if (entry.type === "DIR") {
                // Avoid scanning saves directory to keep it fast
                if (entry.name.toLowerCase() === "save") continue;
                const childFiles = await scanFilesRecursively(entryPath);
                files.push(...childFiles);
            } else {
                const lower = entry.name.toLowerCase();
                if ((lower.endsWith(".bin") || lower.endsWith(".nfc")) && lower !== "key_retail.bin") {
                    files.push({
                        name: entry.name,
                        path: entryPath,
                        size: entry.size
                    });
                }
            }
        }
    }
    return files;
}

async function refreshGalleryMode() {
    if (!state.isConnected) return;
    
    el.explorerTableContainer.style.display = "none";
    el.explorerGridContainer.style.display = "grid";
    
    el.explorerGridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 48px;">
            <span class="material-symbols-rounded pulse" style="font-size: 2.5rem; animation: pulse 1.5s infinite; color: var(--primary);">sync</span>
            <div style="margin-top: 12px; font-weight: 600;">Escaneando Allmiibo...</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Esto puede tardar unos segundos sobre Bluetooth</div>
        </div>
    `;
    
    try {
        const files = await scanFilesRecursively("E:/");
        state.scannedAmiibos = files;
        renderGalleryMode();
    } catch (err) {
        showToast(`Error al escanear Amiibos: ${err.message}`, "error");
        el.explorerGridContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--danger); padding: 48px;">
                <span class="material-symbols-rounded" style="font-size: 2.5rem;">error</span>
                <div style="margin-top: 12px; font-weight: 600;">Error al escanear el dispositivo</div>
                <div style="font-size: 0.8rem; margin-top: 4px;">${err.message}</div>
            </div>
        `;
    }
}

function renderGalleryMode() {
    el.explorerGridContainer.innerHTML = "";
    
    let sorted = [...state.scannedAmiibos];
    const sortVal = el.explorerSortSelect.value;
    
    // Sort scanned files based on chosen sort value
    if (sortVal === "name-asc") {
        sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }));
    } else if (sortVal === "name-desc") {
        sorted.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: 'base', numeric: true }));
    } else if (sortVal === "size-asc") {
        sorted.sort((a, b) => a.size - b.size);
    } else if (sortVal === "size-desc") {
        sorted.sort((a, b) => b.size - a.size);
    }
    
    if (sorted.length === 0) {
        el.explorerGridContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 48px;">
                No se encontraron archivos Amiibo (.bin o .nfc) en el dispositivo.
            </div>
        `;
        return;
    }
    
    sorted.forEach(e => {
        const card = document.createElement("div");
        card.className = "amiibo-card";
        if (state.selectedItems.has(e.path)) {
            card.classList.add("selected");
        }
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "amiibo-card-checkbox";
        checkbox.checked = state.selectedItems.has(e.path);
        checkbox.addEventListener("change", (evt) => {
            evt.stopPropagation();
            if (checkbox.checked) {
                state.selectedItems.add(e.path);
                card.classList.add("selected");
            } else {
                state.selectedItems.delete(e.path);
                card.classList.remove("selected");
            }
        });
        card.appendChild(checkbox);
        
        card.addEventListener("click", (evt) => {
            if (evt.target.closest("button") || evt.target.closest("input[type='checkbox']")) return;
            evt.preventDefault();
            
            const isSelected = state.selectedItems.has(e.path);
            if (isSelected) {
                state.selectedItems.delete(e.path);
                card.classList.remove("selected");
                checkbox.checked = false;
            } else {
                state.selectedItems.add(e.path);
                card.classList.add("selected");
                checkbox.checked = true;
            }
        });
        
        const imgWrap = document.createElement("div");
        imgWrap.className = "amiibo-img-wrap";
        
        const img = document.createElement("img");
        img.className = "amiibo-img";
        img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24'><path fill='%2394a3b8' d='M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z'/></svg>";
        img.style.opacity = "0.3";
        imgWrap.appendChild(img);
        
        const info = document.createElement("div");
        info.className = "amiibo-info";
        
        const nameEl = document.createElement("div");
        nameEl.className = "amiibo-card-name";
        nameEl.textContent = e.name.replace(/\.bin$|\.nfc$/i, '');
        nameEl.title = e.name;
        
        const subtitleEl = document.createElement("div");
        subtitleEl.className = "amiibo-card-series";
        subtitleEl.textContent = `Archivo (${e.size} B)`;
        
        // Show path location
        const pathEl = document.createElement("div");
        pathEl.style.fontSize = "0.7rem";
        pathEl.style.color = "var(--text-muted)";
        pathEl.style.whiteSpace = "nowrap";
        pathEl.style.overflow = "hidden";
        pathEl.style.textOverflow = "ellipsis";
        pathEl.style.marginTop = "2px";
        pathEl.textContent = getParentPath(e.path);
        
        info.appendChild(nameEl);
        info.appendChild(subtitleEl);
        info.appendChild(pathEl);
        
        const actionsDiv = document.createElement("div");
        actionsDiv.style.display = "flex";
        actionsDiv.style.width = "100%";
        actionsDiv.style.justifyContent = "center";
        actionsDiv.style.gap = "8px";
        actionsDiv.style.marginTop = "8px";
        
        const btnRename = document.createElement("button");
        btnRename.className = "btn btn-secondary";
        btnRename.style.padding = "4px 8px";
        btnRename.style.fontSize = "0.8rem";
        btnRename.innerHTML = `<span class="material-symbols-rounded" style="font-size: 1rem;">edit</span>`;
        btnRename.title = "Renombrar";
        btnRename.addEventListener("click", (evt) => {
            evt.stopPropagation();
            
            // Set the old name and path context
            _activeRenameOldName = e.name;
            state.currentPath = getParentPath(e.path);
            openRenameModal(e.name);
        });
        
        const btnDelete = document.createElement("button");
        btnDelete.className = "btn btn-secondary";
        btnDelete.style.padding = "4px 8px";
        btnDelete.style.fontSize = "0.8rem";
        btnDelete.innerHTML = `<span class="material-symbols-rounded" style="font-size: 1rem; color: var(--danger);">delete</span>`;
        btnDelete.title = "Eliminar";
        btnDelete.addEventListener("click", (evt) => {
            evt.stopPropagation();
            
            _activeDeleteName = e.name;
            state.currentPath = getParentPath(e.path);
            openDeleteModal(e.name);
        });
        
        actionsDiv.appendChild(btnRename);
        actionsDiv.appendChild(btnDelete);
        
        card.appendChild(imgWrap);
        card.appendChild(info);
        card.appendChild(actionsDiv);
        
        el.explorerGridContainer.appendChild(card);
        
        // Dynamic image fetch
        const cleanName = e.name.replace(/\.bin$|\.nfc$/i, '');
        const category = getCategoryFromPath(e.path);
        fetchAmiiboImageAndDetails(cleanName, category, card);
    });
}


// ==========================================
// === DOM Event Listeners ==================
// ==========================================

// Connect Bluetooth
el.btnConnectBle.addEventListener("click", async () => {
    try {
        state.client = new PixlBLEClient(logEvent);
        state.client.onDisconnect = () => {
            setConnectionState(false);
        };
        await state.client.connect();
        setConnectionState(true);
        // Refresh catalog buttons state
        renderOnlineCatalogue();
    } catch (err) {
        showToast(err.message, "error");
        setConnectionState(false);
    }
});

// Connect Simulator
el.btnConnectMock.addEventListener("click", async () => {
    state.client = new DevMockClient(logEvent);
    state.client.onDisconnect = () => {
        setConnectionState(false);
    };
    await state.client.connect();
    setConnectionState(true);
    // Refresh catalog buttons state
    renderOnlineCatalogue();
});

// Disconnect
el.btnDisconnect.addEventListener("click", () => {
    if (state.client) {
        state.client.disconnect();
    }
});

// Tab Switch
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));
        
        btn.classList.add("active");
        const tabId = btn.getAttribute("data-tab");
        document.getElementById(tabId).classList.add("active");
    });
});

// Breadcrumb click navigation
el.explorerBreadcrumb.addEventListener("click", (evt) => {
    const link = evt.target.closest(".breadcrumb-link");
    if (link) {
        state.currentPath = link.getAttribute("data-path");
        refreshExplorer();
    }
});

// Create folder dialog
el.btnNewFolder.addEventListener("click", () => {
    el.folderNameInput.value = "";
    el.folderNameError.style.display = "none";
    el.modalFolder.classList.add("active");
});

el.btnFolderCancel.addEventListener("click", () => {
    el.modalFolder.classList.remove("active");
});

el.btnFolderConfirm.addEventListener("click", async () => {
    const folderName = el.folderNameInput.value.trim();
    if (!folderName) {
        el.folderNameError.textContent = "El nombre de la carpeta no puede estar vacío.";
        el.folderNameError.style.display = "block";
        return;
    }
    
    // Apply character sanitization
    const sanitized = sanitizeName(folderName);
    const newPath = joinPaths(state.currentPath, sanitized);
    
    try {
        const res = await state.client.createFolder(newPath);
        if (res.ok) {
            el.modalFolder.classList.remove("active");
            showToast(`Carpeta "${sanitized}" creada.`);
            refreshExplorer();
        } else {
            el.folderNameError.textContent = `Error: ${res.error}`;
            el.folderNameError.style.display = "block";
        }
    } catch (err) {
        el.folderNameError.textContent = `Fallo de conexión: ${err.message}`;
        el.folderNameError.style.display = "block";
    }
});

// Rename dialog
el.btnRenameCancel.addEventListener("click", () => {
    el.modalRename.classList.remove("active");
});

el.btnRenameConfirm.addEventListener("click", async () => {
    const newName = el.renameInput.value.trim();
    if (!newName) {
        el.renameError.textContent = "El nombre no puede estar vacío.";
        el.renameError.style.display = "block";
        return;
    }
    
    const sanitized = sanitizeName(newName);
    const oldPath = joinPaths(state.currentPath, _activeRenameOldName);
    const newPath = joinPaths(state.currentPath, sanitized);
    
    try {
        const res = await state.client.renamePath(oldPath, newPath);
        if (res.ok) {
            el.modalRename.classList.remove("active");
            showToast("Elemento renombrado con éxito.");
            refreshExplorer();
        } else {
            el.renameError.textContent = `Error: ${res.error}`;
            el.renameError.style.display = "block";
        }
    } catch (err) {
        el.renameError.textContent = `Fallo de conexión: ${err.message}`;
        el.renameError.style.display = "block";
    }
});

// Delete dialog
el.btnDeleteCancel.addEventListener("click", () => {
    el.modalDelete.classList.remove("active");
});

el.btnDeleteConfirm.addEventListener("click", async () => {
    const path = joinPaths(state.currentPath, _activeDeleteName);
    try {
        const res = await state.client.removePath(path);
        if (res.ok) {
            el.modalDelete.classList.remove("active");
            showToast(`"${_activeDeleteName}" eliminado.`);
            refreshExplorer();
            updateStorageBar();
        } else {
            showToast(`Error al eliminar: ${res.error}`, "error");
        }
    } catch (err) {
        showToast(`Fallo de conexión: ${err.message}`, "error");
    }
});

// Delete folder recursively with progress callback
async function deleteFolderRecursively(path, onProgress) {
    const res = await state.client.readFolder(path);
    if (res.ok) {
        for (const entry of res.data) {
            const entryPath = joinPaths(path, entry.name);
            if (entry.type === "DIR") {
                await deleteFolderRecursively(entryPath, onProgress);
            } else {
                if (onProgress) onProgress(entryPath);
                await state.client.removePath(entryPath);
            }
        }
    }
    if (onProgress) onProgress(path);
    return await state.client.removePath(path);
}

// Borrar todos los Amiibos con progreso visual
el.btnFormat.addEventListener("click", async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar TODOS los Amiibos del dispositivo? (La clave key_retail.bin y tus partidas guardadas NO se borrarán).")) return;
    
    // Show progress overlay
    const overlay = document.getElementById("modal-delete-progress");
    const statusText = document.getElementById("delete-progress-text");
    const counterText = document.getElementById("delete-progress-counter");
    overlay.classList.add("active");
    
    el.btnFormat.disabled = true;
    let deleteCount = 0;
    
    try {
        await deleteFolderRecursively("E:/amiibo", (currentPath) => {
            deleteCount++;
            const shortName = currentPath.split("/").pop();
            statusText.textContent = shortName;
            counterText.textContent = `${deleteCount} elementos eliminados...`;
        });
        await state.client.createFolder("E:/amiibo");
        showToast(`Todos los Amiibos han sido eliminados (${deleteCount} elementos).`);
    } catch (err) {
        try { await state.client.createFolder("E:/amiibo"); } catch(e) {}
        showToast(`Limpieza completada (${deleteCount} elementos eliminados).`);
    } finally {
        overlay.classList.remove("active");
        el.btnFormat.disabled = false;
        state.currentPath = "E:/";
        updateStorageBar();
        refreshExplorer();
    }
});

// Close Warnings modal
el.btnWarningClose.addEventListener("click", () => {
    el.modalWarning.classList.remove("active");
});

// Dropzone interactions & Input Browse
el.fileDropzone.addEventListener("click", () => {
    el.inputFiles.click();
});

el.btnUploadFiles.addEventListener("click", () => {
    el.inputFiles.click();
});

el.btnUploadFolder.addEventListener("click", () => {
    el.inputFolder.click();
});

el.inputFiles.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
        handleFilesSelected(e.target.files);
        e.target.value = ""; // reset for future changes
    }
});

el.inputFolder.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
        handleFilesSelected(e.target.files);
        e.target.value = ""; // reset
    }
});

// Dropzone Drag-n-drop events
let _dragCounter = 0;
el.fileDropzone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    _dragCounter++;
    el.fileDropzone.classList.add("drag-over");
});

el.fileDropzone.addEventListener("dragleave", () => {
    _dragCounter--;
    if (_dragCounter <= 0) {
        _dragCounter = 0;
        el.fileDropzone.classList.remove("drag-over");
    }
});

el.fileDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
});

el.fileDropzone.addEventListener("drop", async (e) => {
    e.preventDefault();
    _dragCounter = 0;
    el.fileDropzone.classList.remove("drag-over");
    
    const { items, files } = e.dataTransfer;
    const hasEntryApi = items && items.length > 0 && typeof items[0].webkitGetAsEntry === "function";
    
    if (!hasEntryApi && (!files || files.length === 0)) return;
    
    try {
        const collected = hasEntryApi ? await collectFromDataTransfer(e.dataTransfer) : { folders: new Set(), files: Array.from(files).map(f => ({ relativePath: f.name, file: f })) };
        if (collected.files.length === 0 && collected.folders.size === 0) return;
        
        planUpload(collected.folders, collected.files);
    } catch (err) {
        showToast(`Error al procesar carpetas arrastradas: ${err.message}`, "error");
    }
});

// Queue Actions
el.btnQueueClear.addEventListener("click", () => {
    state.uploadQueue = [];
    renderUploadQueue();
});

el.btnQueueStart.addEventListener("click", () => {
    runQueueUpload();
});

el.btnQueueCancel.addEventListener("click", () => {
    state.abortUpload = true;
    showToast("Deteniendo subida...");
});

// Toggle Local Explorer View mode
el.btnToggleView.addEventListener("click", () => {
    state.explorerViewMode = state.explorerViewMode === "list" ? "grid" : "list";
    el.btnToggleViewIcon.textContent = state.explorerViewMode === "list" ? "grid_view" : "list";
    el.toggleViewText.textContent = state.explorerViewMode === "list" ? "Vista Cuadrícula" : "Vista Lista";
    refreshExplorer();
});

// Explorer Sort Selection changed
el.explorerSortSelect.addEventListener("change", () => {
    state.explorerSort = el.explorerSortSelect.value;
    if (state.explorerTabMode === "gallery") {
        renderGalleryMode();
    } else {
        renderExplorer(state.currentEntries); // instant local sort and re-render without refetching BLE!
    }
});

// Explorer View Selector (Folders vs Gallery Mode)
el.explorerViewSelect.addEventListener("change", () => {
    state.explorerTabMode = el.explorerViewSelect.value;
    if (state.explorerTabMode === "gallery") {
        el.btnToggleView.style.display = "none";
        el.btnNewFolder.style.display = "none";
        el.btnUploadFiles.style.display = "none";
        el.btnUploadFolder.style.display = "none";
    } else {
        el.btnToggleView.style.display = "inline-flex";
        el.btnNewFolder.style.display = "inline-flex";
        el.btnUploadFiles.style.display = "inline-flex";
        el.btnUploadFolder.style.display = "inline-flex";
    }
    refreshExplorer();
});

// Help Modal Events
el.btnHelp.addEventListener("click", () => {
    el.modalHelp.classList.add("active");
});
el.btnHelpClose.addEventListener("click", () => {
    el.modalHelp.classList.remove("active");
});

// Auto Key Modal Events
el.btnAutoKey.addEventListener("click", () => {
    el.autoKeyError.style.display = "none";
    el.autoKeyProgress.style.display = "none";
    el.modalAutoKey.classList.add("active");
});
el.btnAutoKeyCancel.addEventListener("click", () => {
    el.modalAutoKey.classList.remove("active");
});
el.btnAutoKeyConfirm.addEventListener("click", downloadKeysFromGitHub);

// DFU Update Modal Events
function updateDfuTriggerStatus() {
    if (state.isConnected) {
        el.btnDfuTrigger.disabled = false;
        el.dfuTriggerStatus.textContent = "(Dispositivo conectado. Haz clic arriba para enviarle el comando de reinicio a DFU automáticamente).";
        el.dfuTriggerStatus.style.color = "var(--primary-hover)";
    } else {
        el.btnDfuTrigger.disabled = true;
        el.dfuTriggerStatus.textContent = "(Conéctate primero al Allmiibo para poder enviarle el comando de reinicio automático).";
        el.dfuTriggerStatus.style.color = "var(--text-muted)";
    }
}

el.btnDfuHelp.addEventListener("click", () => {
    updateDfuTriggerStatus();
    el.modalDfuUpdate.classList.add("active");
});
el.btnDfuClose.addEventListener("click", () => {
    el.modalDfuUpdate.classList.remove("active");
});
el.updateWarningBadge.addEventListener("click", (e) => {
    e.preventDefault();
    updateDfuTriggerStatus();
    el.modalDfuUpdate.classList.add("active");
});
el.btnDfuTrigger.addEventListener("click", async () => {
    if (!state.isConnected) return;
    if (confirm("¿Estás seguro de que deseas reiniciar tu Allmiibo en modo DFU? Se desconectará de esta página.")) {
        showToast("Enviando comando DFU...");
        try {
            await state.client.enterDfu();
            showToast("Allmiibo reiniciado en modo actualización (DFU).");
            el.modalDfuUpdate.classList.remove("active");
        } catch (err) {
            showToast(`Error al reiniciar: ${err.message}`, "error");
        }
    }
});

// Install entire filtered series
el.btnCatInstallSeries.addEventListener("click", () => {
    const searchVal = el.searchAmiibo.value.toLowerCase();
    const filterVal = el.filterCategory.value;
    
    if (filterVal === "all") {
        showToast("Por favor, selecciona una serie o subserie específica en el filtro para instalarla completa.", "error");
        return;
    }
    
    let selectedCat = filterVal;
    let selectedSub = null;
    if (filterVal.includes("::")) {
        const parts = filterVal.split("::");
        selectedCat = parts[0];
        selectedSub = parts[1];
    }
    
    const visibleAmiibos = [];
    const list = state.categories[selectedCat] || [];
    list.forEach(amiibo => {
        if (selectedSub && amiibo.subPath !== selectedSub) return;
        if (searchVal && !amiibo.name.toLowerCase().includes(searchVal)) return;
        visibleAmiibos.push({ amiibo, category: selectedCat });
    });
    
    if (visibleAmiibos.length === 0) {
        showToast("No hay Amiibos visibles en la serie seleccionada para instalar.", "error");
        return;
    }
    
    openInstallFolderModal(visibleAmiibos);
});

// Sync Online Catalogue from Internet Archive
el.btnCatSync.addEventListener("click", () => {
    syncCatalogueFromArchive();
});

// Update Key listeners
el.btnUploadKey.addEventListener("click", () => {
    el.inputKeyFile.click();
});

el.inputKeyFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size !== 160) {
        if (!confirm(`Advertencia: El archivo seleccionado no mide 160 bytes (mide ${file.size} bytes). El archivo key_retail.bin correcto debe medir exactamente 160 bytes para activar la base de datos de Allmiibo. ¿Deseas subirlo de todas formas?`)) {
            e.target.value = "";
            return;
        }
    }
    
    state.uploadQueue = [{
        kind: "file",
        localPath: file.name,
        remotePath: "E:/key_retail.bin",
        file: file,
        status: "pending"
    }];
    
    renderUploadQueue();
    document.querySelector('[data-tab="local-tab"]').click();
    runQueueUpload().then(() => {
        checkEncryptionKeyStatus();
    });
    
    e.target.value = "";
});

// Catalogue Search and Filter
el.searchAmiibo.addEventListener("input", renderOnlineCatalogue);
el.filterCategory.addEventListener("change", () => {
    state.selectedCatalogue.clear(); // Clear selections on filter change
    renderOnlineCatalogue();
});


// Select All visible
el.btnCatSelectAll.addEventListener("click", () => {
    const searchVal = el.searchAmiibo.value.toLowerCase();
    const filterVal = el.filterCategory.value;
    const rendered = new Set();
    
    Object.keys(state.categories).forEach(cat => {
        if (filterVal !== "all" && filterVal !== cat) return;
        
        const list = state.categories[cat];
        list.forEach(amiibo => {
            if (searchVal && !amiibo.name.toLowerCase().includes(searchVal)) return;
            
            const cleanName = cleanAmiiboNameForSearch(amiibo.name);
            const uniqueKey = `${cat}_${cleanName}`;
            if (rendered.has(uniqueKey)) return;
            rendered.add(uniqueKey);
            
            state.selectedCatalogue.add(amiibo.path);
        });
    });
    
    renderOnlineCatalogue();
});

// Deselect All
el.btnCatDeselectAll.addEventListener("click", () => {
    state.selectedCatalogue.clear();
    renderOnlineCatalogue();
});

// Trigger bulk install folder modal
el.btnCatInstall.addEventListener("click", () => {
    if (state.selectedCatalogue.size === 0) return;
    
    const selectedAmiibos = [];
    state.selectedCatalogue.forEach(path => {
        for (const cat of Object.keys(state.categories)) {
            const match = state.categories[cat].find(a => a.path === path);
            if (match) {
                selectedAmiibos.push({ amiibo: match, category: cat });
                break;
            }
        }
    });
    
    openInstallFolderModal(selectedAmiibos);
});

// Install modal close
el.btnInstallCancel.addEventListener("click", () => {
    el.modalInstall.classList.remove("active");
});

// Install modal confirm and queue
el.btnInstallConfirm.addEventListener("click", async () => {
    const folderName = el.installFolderInput.value.trim();
    if (!folderName) {
        el.installFolderError.textContent = "El nombre de la carpeta no puede estar vacío.";
        el.installFolderError.style.display = "block";
        return;
    }
    
    const sanitizedFolder = sanitizeName(folderName);
    const destinationFolder = joinPaths("E:/amiibo", sanitizedFolder);
    
    const queueItems = [];
    
    // 1. Create base target folder
    queueItems.push({
        kind: "folder",
        localPath: sanitizedFolder,
        remotePath: destinationFolder,
        status: "pending"
    });
    
    // 2. Collect unique subfolders from items, then create them
    const uniqueSubFolders = new Set();
    _activeInstallList.forEach(item => {
        if (item.amiibo.subPath) {
            const shortSub = cleanSubPath(item.amiibo.subPath);
            const subParts = shortSub.split("/").filter(Boolean);
            let current = "";
            for (const part of subParts) {
                current = current ? `${current}/${part}` : part;
                uniqueSubFolders.add(current);
            }
        }
    });
    // Sort subfolders by depth so parents are created first
    const sortedSubFolders = Array.from(uniqueSubFolders).sort((a, b) => a.split("/").length - b.split("/").length);
    for (const sub of sortedSubFolders) {
        queueItems.push({
            kind: "folder",
            localPath: sub,
            remotePath: joinPaths(destinationFolder, sub),
            status: "pending"
        });
    }
    
    // 3. Add each file download/flash item with strict 58-byte path limit
    _activeInstallList.forEach(item => {
        const cleanFilename = sanitizeName(item.amiibo.name) + ".bin";
        let rawRemotePath;
        if (item.amiibo.subPath) {
            const shortSub = cleanSubPath(item.amiibo.subPath);
            rawRemotePath = joinPaths(destinationFolder, shortSub, cleanFilename);
        } else {
            rawRemotePath = joinPaths(destinationFolder, cleanFilename);
        }
        
        const finalRemotePath = fitPathToHardwareLimit(rawRemotePath);
        
        let downloadUrl = item.amiibo.path;
        if (!downloadUrl.startsWith("http")) {
            downloadUrl = baseDownloadUrl.endsWith('/') 
                ? `${baseDownloadUrl}${item.amiibo.path}` 
                : `${baseDownloadUrl}/${item.amiibo.path}`;
        }
        
        queueItems.push({
            kind: "file",
            localPath: `${item.amiibo.name}`,
            remotePath: finalRemotePath,
            githubUrl: downloadUrl,
            status: "pending"
        });
    });
    
    // Clear selection
    state.selectedCatalogue.clear();
    updateCatalogueSelectionUI();
    
    // Close modal
    el.modalInstall.classList.remove("active");
    
    // Add to upload queue and start upload
    state.uploadQueue = queueItems;
    renderUploadQueue();
    
    // Switch to Local tab
    document.querySelector('[data-tab="local-tab"]').click();
    
    // Trigger queue run
    runQueueUpload();
});

// Initialize database
initOnlineCatalogue();
