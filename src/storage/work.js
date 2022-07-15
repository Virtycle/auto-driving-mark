export default (inputs) => {
    // no import to use
    const { taskLimit, eventNames } = inputs;

    function withError(promise) {
        return promise
            .then((data) => {
                return [null, data];
            })
            .catch((err) => [err, undefined]);
    }

    class PCDParser {
        static littleEndian = true;

        static decodeText(array) {
            return new TextDecoder().decode(array);
        }

        static parse(data) {
            // from https://gitlab.com/taketwo/three-pcd-loader/blob/master/decompress-lzf.js

            function decompressLZF(inData, outLength) {
                const inLength = inData.length;
                const outData = new Uint8Array(outLength);
                let inPtr = 0;
                let outPtr = 0;
                let ctrl;
                let len;
                let ref;
                do {
                    ctrl = inData[inPtr++];
                    if (ctrl < 1 << 5) {
                        ctrl++;
                        if (outPtr + ctrl > outLength) throw new Error('Output buffer is not large enough');
                        if (inPtr + ctrl > inLength) throw new Error('Invalid compressed data');
                        do {
                            outData[outPtr++] = inData[inPtr++];
                        } while (--ctrl);
                    } else {
                        len = ctrl >> 5;
                        ref = outPtr - ((ctrl & 0x1f) << 8) - 1;
                        if (inPtr >= inLength) throw new Error('Invalid compressed data');
                        if (len === 7) {
                            len += inData[inPtr++];
                            if (inPtr >= inLength) throw new Error('Invalid compressed data');
                        }

                        ref -= inData[inPtr++];
                        if (outPtr + len + 2 > outLength) throw new Error('Output buffer is not large enough');
                        if (ref < 0) throw new Error('Invalid compressed data');
                        if (ref >= outPtr) throw new Error('Invalid compressed data');
                        do {
                            outData[outPtr++] = outData[ref++];
                        } while (--len + 2);
                    }
                } while (inPtr < inLength);

                return outData;
            }

            function parseHeader(data) {
                const PCDheader = {};
                const result1 = data.search(/[\r\n]DATA\s(\S*)\s/i);
                const result2 = /[\r\n]DATA\s(\S*)\s/i.exec(data.slice(result1 - 1));

                PCDheader.data = result2[1];
                PCDheader.headerLen = result2[0].length + result1;
                PCDheader.str = data.slice(0, PCDheader.headerLen);

                // remove comments

                PCDheader.str = PCDheader.str.replace(/\#.*/gi, '');

                // parse

                PCDheader.version = /VERSION (.*)/i.exec(PCDheader.str);
                PCDheader.fields = /FIELDS (.*)/i.exec(PCDheader.str);
                PCDheader.size = /SIZE (.*)/i.exec(PCDheader.str);
                PCDheader.type = /TYPE (.*)/i.exec(PCDheader.str);
                PCDheader.count = /COUNT (.*)/i.exec(PCDheader.str);
                PCDheader.width = /WIDTH (.*)/i.exec(PCDheader.str);
                PCDheader.height = /HEIGHT (.*)/i.exec(PCDheader.str);
                PCDheader.viewpoint = /VIEWPOINT (.*)/i.exec(PCDheader.str);
                PCDheader.points = /POINTS (.*)/i.exec(PCDheader.str);

                // evaluate

                if (PCDheader.version !== null) PCDheader.version = parseFloat(PCDheader.version[1]);

                PCDheader.fields = PCDheader.fields !== null ? PCDheader.fields[1].split(' ') : [];

                if (PCDheader.type !== null) PCDheader.type = PCDheader.type[1].split(' ');

                if (PCDheader.width !== null) PCDheader.width = parseInt(PCDheader.width[1]);

                if (PCDheader.height !== null) PCDheader.height = parseInt(PCDheader.height[1]);

                if (PCDheader.viewpoint !== null) PCDheader.viewpoint = PCDheader.viewpoint[1];

                if (PCDheader.points !== null) PCDheader.points = parseInt(PCDheader.points[1], 10);

                if (PCDheader.points === null) PCDheader.points = PCDheader.width * PCDheader.height;

                if (PCDheader.size !== null) {
                    PCDheader.size = PCDheader.size[1].split(' ').map(function (x) {
                        return parseInt(x, 10);
                    });
                }

                if (PCDheader.count !== null) {
                    PCDheader.count = PCDheader.count[1].split(' ').map(function (x) {
                        return parseInt(x, 10);
                    });
                } else {
                    PCDheader.count = [];

                    for (let i = 0, l = PCDheader.fields.length; i < l; i++) {
                        PCDheader.count.push(1);
                    }
                }

                PCDheader.offset = {};

                let sizeSum = 0;

                for (let i = 0, l = PCDheader.fields.length; i < l; i++) {
                    if (PCDheader.data === 'ascii') {
                        PCDheader.offset[PCDheader.fields[i]] = i;
                    } else {
                        PCDheader.offset[PCDheader.fields[i]] = sizeSum;
                        sizeSum += PCDheader.size[i] * PCDheader.count[i];
                    }
                }

                // for binary only

                PCDheader.rowSize = sizeSum;

                return PCDheader;
            }

            function getMethod(type, size) {
                if (type === 'F') {
                    return DataView.prototype.getFloat32;
                } else if (type === 'U') {
                    if (size === 1) return DataView.prototype.getUint8;
                    if (size === 2) return DataView.prototype.getUint16;
                    if (size === 4) return DataView.prototype.getUint32;
                } else if (type === 'I') {
                    if (size === 1) return DataView.prototype.getInt8;
                    if (size === 2) return DataView.prototype.getInt16;
                    if (size === 4) return DataView.prototype.getInt32;
                }
            }

            const textData = Parser.decodeText(new Uint8Array(data));

            // parse header (always ascii format)

            const PCDheader = parseHeader(textData);

            // parse data

            const position = [];
            const intensity = [];

            let minIntensity = Number.MAX_SAFE_INTEGER;
            let maxIntensity = Number.MIN_SAFE_INTEGER;

            let xMin = Number.MAX_SAFE_INTEGER;
            let xMax = Number.MIN_SAFE_INTEGER;

            let yMin = Number.MAX_SAFE_INTEGER;
            let yMax = Number.MIN_SAFE_INTEGER;

            let zMin = Number.MAX_SAFE_INTEGER;
            let zMax = Number.MIN_SAFE_INTEGER;

            // ascii

            if (PCDheader.data === 'ascii') {
                const offset = PCDheader.offset;
                const pcdData = textData.slice(PCDheader.headerLen);
                const lines = pcdData.split('\n');

                for (let i = 0, l = lines.length; i < l; i++) {
                    if (lines[i] === '') continue;

                    const line = lines[i].split(' ');

                    if (offset.x !== undefined) {
                        const x = parseFloat(line[offset.x]);
                        const y = parseFloat(line[offset.y]);
                        const z = parseFloat(line[offset.z]);
                        if (x > xMax) {
                            xMax = x;
                        }
                        if (x < xMin) {
                            xMin = x;
                        }
                        if (y > yMax) {
                            yMax = y;
                        }
                        if (y < yMin) {
                            yMin = y;
                        }
                        if (z > zMax) {
                            zMax = z;
                        }
                        if (z < zMin) {
                            zMin = z;
                        }
                        position.push(x);
                        position.push(y);
                        position.push(z);
                    }

                    if (offset.intensity !== undefined) {
                        const nowNum = parseFloat(line[offset.intensity]);
                        if (nowNum > maxIntensity) {
                            maxIntensity = nowNum;
                        }
                        if (nowNum < minIntensity) {
                            minIntensity = nowNum;
                        }
                        intensity.push(nowNum);
                    }
                }
            }

            // binary-compressed

            // normally data in PCD files are organized as array of structures: XYZRGBXYZRGB
            // binary compressed PCD files organize their data as structure of arrays: XXYYZZRGBRGB
            // that requires a totally different parsing approach compared to non-compressed data

            if (PCDheader.data === 'binary_compressed') {
                const sizes = new Uint32Array(data.slice(PCDheader.headerLen, PCDheader.headerLen + 8));
                const compressedSize = sizes[0];
                const decompressedSize = sizes[1];
                const decompressed = decompressLZF(
                    new Uint8Array(data, PCDheader.headerLen + 8, compressedSize),
                    decompressedSize,
                );
                const dataview = new DataView(decompressed.buffer);

                const offset = PCDheader.offset;

                for (let i = 0; i < PCDheader.points; i++) {
                    if (offset.x !== undefined) {
                        const x = dataview.getFloat32(
                            PCDheader.points * offset.x + PCDheader.size[0] * i,
                            Parser.littleEndian,
                        );
                        const y = dataview.getFloat32(
                            PCDheader.points * offset.y + PCDheader.size[1] * i,
                            Parser.littleEndian,
                        );
                        const z = dataview.getFloat32(
                            PCDheader.points * offset.z + PCDheader.size[2] * i,
                            Parser.littleEndian,
                        );
                        if (x > xMax) {
                            xMax = x;
                        }
                        if (x < xMin) {
                            xMin = x;
                        }
                        if (y > yMax) {
                            yMax = y;
                        }
                        if (y < yMin) {
                            yMin = y;
                        }
                        if (z > zMax) {
                            zMax = z;
                        }
                        if (z < zMin) {
                            zMin = z;
                        }
                        position.push(x);
                        position.push(y);
                        position.push(z);
                    }

                    if (offset.intensity !== undefined) {
                        const intensity_index = PCDheader.fields.findIndex((field) => field === 'intensity');
                        const type = PCDheader.type[intensity_index];
                        const size = PCDheader.size[intensity_index];
                        const method = getMethod(type, size);
                        const nowNum = method.call(
                            dataview,
                            PCDheader.points * offset.intensity + PCDheader.size[intensity_index] * i,
                            Parser.littleEndian,
                        );
                        if (nowNum > maxIntensity) {
                            maxIntensity = nowNum;
                        }
                        if (nowNum < minIntensity) {
                            minIntensity = nowNum;
                        }
                        intensity.push(nowNum);
                    }
                }
            }

            // binary

            if (PCDheader.data === 'binary') {
                const dataview = new DataView(data, PCDheader.headerLen);
                const offset = PCDheader.offset;

                for (let i = 0, row = 0; i < PCDheader.points; i++, row += PCDheader.rowSize) {
                    if (offset.x !== undefined) {
                        const x = dataview.getFloat32(
                            PCDheader.points * offset.x + PCDheader.size[0] * i,
                            Parser.littleEndian,
                        );
                        const y = dataview.getFloat32(
                            PCDheader.points * offset.y + PCDheader.size[1] * i,
                            Parser.littleEndian,
                        );
                        const z = dataview.getFloat32(
                            PCDheader.points * offset.z + PCDheader.size[2] * i,
                            Parser.littleEndian,
                        );
                        if (x > xMax) {
                            xMax = x;
                        }
                        if (x < xMin) {
                            xMin = x;
                        }
                        if (y > yMax) {
                            yMax = y;
                        }
                        if (y < yMin) {
                            yMin = y;
                        }
                        if (z > zMax) {
                            zMax = z;
                        }
                        if (z < zMin) {
                            zMin = z;
                        }
                        position.push(x);
                        position.push(y);
                        position.push(z);
                    }

                    if (offset.intensity !== undefined) {
                        const intensity_index = PCDheader.fields.findIndex((field) => field === 'intensity');
                        const type = PCDheader.type[intensity_index];
                        const size = PCDheader.size[intensity_index];
                        const method = getMethod(type, size);
                        const nowNum = method.call(
                            dataview,
                            PCDheader.points * offset.intensity + PCDheader.size[intensity_index] * i,
                            Parser.littleEndian,
                        );
                        if (nowNum > maxIntensity) {
                            maxIntensity = nowNum;
                        }
                        if (nowNum < minIntensity) {
                            minIntensity = nowNum;
                        }
                        intensity.push(nowNum);
                    }
                }
            }
            let positionData = [];
            let intensityData = [];
            if (position.length > 0) positionData = new Float32Array(position);
            if (intensity.length > 0) intensityData = new Float32Array(intensity);

            return {
                intensity: intensityData,
                points: positionData,
                range: {
                    intensity: { max: maxIntensity, min: minIntensity },
                    x: { max: xMax, min: xMin },
                    y: { max: yMax, min: yMin },
                    z: { max: zMax, min: zMin },
                },
            };
        }
    }

    class IDB {
        idbApi = null;

        defaultVersion = 1;

        taskLimit = 1;

        taskList = [];

        taskListToRemove = [];

        ready = false;

        taskListDB = null;

        taskListDBName = 'spo-db-list';

        taskDB = null;

        constructor(idb, taskLimit) {
            this.idbApi = idb;
            this.taskLimit = taskLimit;
        }

        static getIDBApi() {
            try {
                if (typeof indexedDB !== 'undefined') {
                    return indexedDB;
                }
                if (typeof webkitIndexedDB !== 'undefined') {
                    return webkitIndexedDB;
                }
                if (typeof mozIndexedDB !== 'undefined') {
                    return mozIndexedDB;
                }
                if (typeof OIndexedDB !== 'undefined') {
                    return OIndexedDB;
                }
                if (typeof msIndexedDB !== 'undefined') {
                    return msIndexedDB;
                }
            } catch (e) {
                return;
            }
        }

        async init() {
            const [err, taskListDB] = await withError(this.checkTaskListDB());
            if (err) {
                this.handleError(err);
                return false;
            }
            this.taskListDB = taskListDB;
            const taskList = await this.getTaskList();
            if (Array.isArray(taskList)) {
                this.taskList = taskList;
                this.taskListToRemove = this.checkTaskNumToLimit();
                if (this.taskListToRemove.length) {
                    const [errI, done] = await withError(this.removeTaskToLimit());
                    this.taskListToRemove = [];
                    this.taskList = await this.getTaskList();
                    if (errI) return false;
                }
                return true;
            }
            return false;
        }

        checkTaskListDB() {
            return new Promise((resolve, reject) => {
                const request = this.idbApi.open(this.taskListDBName, this.defaultVersion);
                request.onsuccess = (event) => {
                    const idb = event.target.result;
                    idb.onerror = this.handleError.bind(this);
                    resolve(idb);
                };
                request.onerror = reject;
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    db.createObjectStore(this.taskListDBName, { keyPath: 'name' });
                };
            });
        }

        getTaskList() {
            return new Promise((resolve) => {
                const taskListObjectStore = this.taskListDB
                    .transaction(this.taskListDBName)
                    .objectStore(this.taskListDBName);
                const rq = taskListObjectStore.getAll();
                rq.onsuccess = (e) => {
                    resolve(e.target.result);
                };
            });
        }

        checkTaskNumToLimit() {
            const toRemoveNum = this.taskList.length - this.taskLimit + 1;
            if (toRemoveNum > 0) {
                const taskListI = this.taskList.sort((a, b) => {
                    return a.timeTag - b.timeTag;
                });
                return taskListI.filter((item, index) => index <= toRemoveNum - 1);
            } else {
                return [];
            }
        }

        removeTaskToLimit() {
            const taskToRemove = this.taskListToRemove;
            const promises = taskToRemove.map((item) => {
                return new Promise((resolve) => {
                    const rq = this.idbApi.deleteDatabase(item.name);
                    rq.onsuccess = () => {
                        const taskListObjectStore = this.taskListDB
                            .transaction(this.taskListDBName, 'readwrite')
                            .objectStore(this.taskListDBName);
                        const rqInner = taskListObjectStore.delete(item.name);
                        rqInner.onsuccess = () => {
                            resolve();
                        };
                    };
                });
            });
            return Promise.all(promises);
        }

        handleError(err) {
            self.postMessage({ type: 'error', info: err.message });
        }

        async getDbInfo(name) {
            const [err, databases] = await withError(this.idbApi.databases());
            if (err) {
                this.handleError(err);
                return undefined;
            }
            return databases.find(({ name: dbName }) => dbName === name);
        }

        async storeTask(params) {
            const { taskName, listP, listI } = params;
            if (this.taskDB) {
                this.taskDB.close();
                this.taskDB = null;
            }
            const [err, taskDB] = await withError(this.checkTaskDB(taskName));
            if (err) {
                this.handleError(err);
                return false;
            }
            this.taskDB = taskDB;
            const indexToFind = this.taskList.findIndex((item) => item.name === taskName);
            if (indexToFind === -1) {
                const data = await this.storeTaskToList(taskName);
                if (data && data.timeTag) {
                    this.taskList.push(data);
                }
            }
        }

        storeTaskToList(taskName) {
            return new Promise((resolve) => {
                const taskListObjectStore = this.taskListDB
                    .transaction(this.taskListDBName, 'readwrite')
                    .objectStore(this.taskListDBName);
                const data = {
                    name: taskName,
                    timeTag: Date.now(),
                };
                const rq = taskListObjectStore.add(data);
                rq.onsuccess = () => {
                    resolve(data);
                };
            });
        }

        checkTaskDB(taskName) {
            return new Promise((resolve, reject) => {
                const request = this.idbApi.open(taskName, this.defaultVersion);
                request.onsuccess = (event) => {
                    const idb = event.target.result;
                    idb.onerror = this.handleError.bind(this);
                    resolve(idb);
                };
                request.onerror = reject;
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    db.createObjectStore('points-data', { keyPath: 'name' });
                    const imgOS = db.createObjectStore('images-data', { keyPath: 'name' });
                    imgOS.createIndex('width', 'width', { unique: false });
                    imgOS.createIndex('height', 'height', { unique: false });
                };
            });
        }
    }

    const idbApi = IDB.getIDBApi();
    if (!idbApi) {
        self.postMessage({ type: 'error', info: 'not support indexedDB api' });
    }
    const dbManager = new IDB(idbApi, taskLimit);
    dbManager.init().then(
        () => {
            const event = {
                [eventNames.storeTask]: (data) => {
                    dbManager.storeTask(data.info);
                },
            };
            self.onmessage = (msg) => {
                const { data } = msg;
                typeof event[data.type] === 'function' && event[data.type](data);
            };
        },
        (err) => {
            console.log(err);
        },
    );
};
