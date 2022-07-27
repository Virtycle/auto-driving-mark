import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Layout, Progress, Button } from 'antd';
import {
    LeftOutlined,
    RightOutlined,
    CaretRightOutlined,
    DoubleLeftOutlined,
    DoubleRightOutlined,
    PauseOutlined,
} from '@ant-design/icons';
import { GlobalContext } from '@/global-data';
import { FrameResultData } from '@/common/interface';
import './index.scss';

const { Footer } = Layout;

// enum PlayStatus {
//     'play' = 1,
//     'stop' = 2,
//     'pause' = 3,
// }

export default function FooterControl() {
    const { manager, frameResultData, resouceRelation } = useContext(GlobalContext);

    const [currentFrame, setFrame] = useState<number>(0);

    const [loadFrame, setLoadFrame] = useState<number>(0);

    const [playStatus, setPlayStatus] = useState<boolean>(false);

    const loadingFrameState = useRef<boolean>(false);

    function generateFrameList(list: FrameResultData[]): JSX.Element[] {
        return list.map((frameData, index) => {
            return (
                <div className="spo-footer-frame-list-item" key={frameData.data_source_id}>
                    <div
                        className={`spo-footer-frame-list-item-num${currentFrame === index ? ' current' : ''}`}
                        onClick={() => {
                            changeFrame(frameData.data_source_id);
                        }}
                    >
                        {index + 1}
                    </div>
                    <div className="spo-footer-frame-list-item-mark" />
                </div>
            );
        });
    }

    const changeFrame = useCallback(
        (frameNum: number) => {
            let frameNumI = frameNum;
            if (frameNum < 0) frameNumI = 0;
            if (frameNum > frameResultData.length - 1) frameNumI = frameResultData.length - 1;
            if (manager.currentFrameNumber === frameNumI) return;
            loadingFrameState.current = true;
            manager
                .loadFrame(frameNumI, resouceRelation[frameNumI], frameResultData[frameNumI])
                .then(() => {
                    setFrame(frameNumI);
                })
                .finally(() => {
                    loadingFrameState.current = false;
                });
        },
        [frameResultData, manager, resouceRelation],
    );

    const autoPlay = () => {
        setPlayStatus((bool) => !bool);
    };

    // 进度条 effect
    useEffect(() => {
        function fixNumberToPercent(num: number): number {
            return parseFloat((num * 100).toFixed(2));
        }
        function setCurrentLoaded(): void {
            const num = manager.idbStoreInstance.checkPointStoreProgress();
            setLoadFrame(fixNumberToPercent(num));
        }
        setCurrentLoaded();
        manager.idbStoreInstance.addEventHandler('pointIndexStored', () => {
            setCurrentLoaded();
        });
    }, [manager]);

    // play effect
    useEffect(() => {
        if (playStatus) {
            if (currentFrame >= frameResultData.length - 1) {
                setPlayStatus(false);
            } else {
                changeFrame(currentFrame + 1);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playStatus, currentFrame, changeFrame]);

    return (
        <Footer className="spo-footer" id="spo-footer" style={{ height: '95px', background: '#696969' }}>
            <div className="spo-footer-frame-controls">
                <div className="spo-footer-frame-current-select">
                    <span style={{ paddingRight: '25px' }}>name: </span>
                    <span style={{ paddingRight: '25px' }}>id: </span>
                </div>
                <div className="spo-footer-frame-progress-label">
                    <span style={{ paddingRight: '5px' }}>帧</span>
                    {currentFrame + 1} / {frameResultData.length}
                </div>
                <div id="spo-footer-frame-play-group">
                    <Button
                        className="spo-footer-frame-play-group-item"
                        type="text"
                        disabled={playStatus || currentFrame === 0}
                        size="small"
                        icon={<DoubleLeftOutlined />}
                        onClick={() => {
                            if (!loadingFrameState.current) {
                                changeFrame(currentFrame - 10);
                            }
                        }}
                    />
                    <Button
                        className="spo-footer-frame-play-group-item"
                        type="text"
                        disabled={playStatus || currentFrame === 0}
                        size="small"
                        icon={<LeftOutlined />}
                        onClick={() => {
                            if (!loadingFrameState.current) {
                                changeFrame(currentFrame - 1);
                            }
                        }}
                    />
                    <Button
                        className="spo-footer-frame-play-group-item"
                        type="text"
                        size="small"
                        disabled={currentFrame === frameResultData.length - 1}
                        icon={playStatus ? <PauseOutlined /> : <CaretRightOutlined />}
                        onClick={() => {
                            autoPlay();
                        }}
                    />
                    <Button
                        className="spo-footer-frame-play-group-item"
                        type="text"
                        disabled={playStatus || currentFrame === frameResultData.length - 1}
                        size="small"
                        icon={<RightOutlined />}
                        onClick={() => {
                            if (!loadingFrameState.current) {
                                changeFrame(currentFrame + 1);
                            }
                        }}
                    />
                    <Button
                        className="spo-footer-frame-play-group-item"
                        type="text"
                        disabled={playStatus || currentFrame === frameResultData.length - 1}
                        size="small"
                        icon={<DoubleRightOutlined />}
                        onClick={() => {
                            if (!loadingFrameState.current) {
                                changeFrame(currentFrame + 10);
                            }
                        }}
                    />
                </div>
                <div className="spo-footer-frame-progress-show">
                    <Progress percent={loadFrame} />
                </div>
            </div>
            <div className="spo-footer-frame-list-out">
                <div className="spo-footer-frame-list-inner">{generateFrameList(frameResultData)}</div>
            </div>
        </Footer>
    );
}
