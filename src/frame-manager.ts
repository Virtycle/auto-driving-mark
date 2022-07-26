import manager3D from '@/engine';
import idbStore from '@/storage';
import { FrameResultData, ResouceRelation, ObjectInScene } from '@/common/interface';

enum PlayStatus {
    'play' = 1,
    'pause' = 2,
    'stop' = 0,
}

export class FrameManager {
    private manager3D = manager3D;

    private idbStore = idbStore;
    // 当前帧
    private currentFrame = -1;

    private status: PlayStatus = PlayStatus.stop;

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
        console.log(performance.now() + 'frame switch start');
        const { pcd_name, images } = resource;
        return new Promise((resolve, reject) => {
            this.idbStore.readPointData(pcd_name).then(
                (data) => {
                    const { items } = frameData;
                    this.manager3D.diffCubeCollections(items);
                    this.manager3D.updatePointCloud(data);
                    this.currentFrame = frameNum;
                    resolve(true);
                    console.log(performance.now() + 'frame switch end');
                },
                (err) => {
                    reject(err);
                },
            );
        });
    }
}

export default new FrameManager();
