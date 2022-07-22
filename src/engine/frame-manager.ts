import manager3D from '@/engine/content-manager';
import idbStore from '@/storage';
import { FrameResultData, ResouceRelation } from '@/common/interface';

export class FrameManager {
    private manager3D = manager3D;

    private idbStore = idbStore;
    // 当前帧
    private currentFrame = 0;

    private currentFrameData = null;

    get manager3DInstance() {
        return this.manager3D;
    }

    get idbStoreInstance() {
        return this.idbStore;
    }

    public init() {
        this.initEvents();
    }

    private initEvents() {
        this.idbStore.addEventHandler('pointIndexStored', (data) => {
            console.log(data);
        });
    }
    //todo
    public init2DCameras() {
        //
    }

    public loadFrame(frameNum: number, resource: ResouceRelation, data: FrameResultData): Promise<unknown> {
        return new Promise(() => {
            console.log('done');
        });
    }
}

export default new FrameManager();
