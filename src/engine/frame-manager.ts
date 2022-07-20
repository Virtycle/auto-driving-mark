import manager3D from '@/engine/content-manager';
import idbStore from '@/storage';

export class FrameManager {
    private manager3D = manager3D;

    private idbStore = idbStore;

    get manager3DInstance() {
        return this.manager3D;
    }

    get idbStoreInstance() {
        return this.idbStore;
    }
}

export default new FrameManager();
