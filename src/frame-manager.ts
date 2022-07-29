import manager3D from '@/engine';
import idbStore from '@/storage';
import { FrameResultData, ResouceRelation } from '@/common/interface';
import { envLogNow } from './common/log';

export class FrameManager {
    private manager3D = manager3D;

    private idbStore = idbStore;
    // 当前帧
    private currentFrame = -1;

    get manager3DInstance() {
        return this.manager3D;
    }

    get idbStoreInstance() {
        return this.idbStore;
    }

    get currentFrameNumber() {
        return this.currentFrame;
    }

    public init(params: { enableEdit3d: boolean; enableShow2d: boolean }) {
        const { enableEdit3d, enableShow2d } = params;
        this.manager3D.enableEdit = enableEdit3d;
        if (enableShow2d) {
            this.init2DCameras();
        }
        this.initEvents();
    }

    private initEvents() {
        //
    }
    //todo
    public init2DCameras() {
        //
    }

    public getCurrentFrame3dData() {
        return this.manager3D.getVisibleCubeCollectionData();
    }

    public loadFrame(frameNum: number, resource: ResouceRelation, frameData: FrameResultData): Promise<boolean> {
        if (frameNum === this.currentFrame) return Promise.reject('request frame is current');
        envLogNow('frame switch start');
        const { pcd_name } = resource;
        return new Promise((resolve, reject) => {
            this.idbStore.readPointData(pcd_name).then(
                (data) => {
                    const { items } = frameData;
                    this.manager3D.diffCubeCollections(items);
                    this.manager3D.updatePointCloud(data);
                    this.currentFrame = frameNum;
                    resolve(true);
                    envLogNow('frame switch end');
                },
                (err) => {
                    reject(err);
                },
            );
        });
    }
}

export default new FrameManager();
