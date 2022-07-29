import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { GlobalContext } from '@/global-data';
import { Tooltip, Dropdown, Menu } from 'antd';
import { SelectOutlined, FormOutlined } from '@ant-design/icons';
import './index.scss';
import { STATE, MainRendererEvent } from '@/engine';

export default function Tools3D() {
    const rootRef = useRef<HTMLDivElement>(null);
    const { manager, setShowDraw } = useContext(GlobalContext);
    const [mainRenderState, setRenderState] = useState<STATE>(STATE.NONE);

    const changeDrawType = useCallback(
        (type: STATE) => {
            if (type !== mainRenderState) {
                manager.manager3DInstance.sceneRenderInstance.mainRendererInstance.changeState(type);
                setRenderState(type);
            }
        },
        [mainRenderState, manager],
    );

    const menu = (
        <Menu
            onClick={(e) => {
                changeDrawType(Number(e.key));
            }}
            items={[
                {
                    label: '点击绘制',
                    key: STATE.DRAW_PICK,
                },
                {
                    label: '拖拽绘制',
                    key: STATE.DRAW_DRAG,
                },
                {
                    label: '多边形绘制',
                    key: STATE.DRAW_AREA,
                    disabled: true,
                },
            ]}
        />
    );

    useEffect(() => {
        const syncState = (state: unknown) => {
            setRenderState(state as STATE);
        };
        if (manager) {
            manager.manager3DInstance.sceneRenderInstance.mainRendererInstance.addEventHandler(
                MainRendererEvent.StateChanged,
                syncState,
            );
        }
        return () => {
            if (manager) {
                manager.manager3DInstance.sceneRenderInstance.mainRendererInstance.removeEventHandler(
                    MainRendererEvent.StateChanged,
                    syncState,
                );
            }
        };
    }, [manager]);

    return (
        <>
            <div className="spo-3d-main-tools" ref={rootRef}>
                <Tooltip title="选择" placement="bottom">
                    <span
                        className={`spo-3d-main-tools-item${mainRenderState === STATE.NONE ? ' current' : ''}`}
                        onClick={() => {
                            changeDrawType(STATE.NONE);
                        }}
                    >
                        <i className="iconfont iconyidong" style={{ display: 'inline-block' }} />
                        {/* <SelectOutlined /> */}
                    </span>
                </Tooltip>
                {/* <Tooltip title="绘制" placement="top"> */}
                <Dropdown overlay={menu}>
                    <span
                        className={`spo-3d-main-tools-item${
                            mainRenderState === STATE.DRAW_DRAG ||
                            mainRenderState === STATE.DRAW_PICK ||
                            mainRenderState === STATE.DRAW_AREA
                                ? ' current'
                                : ''
                        }`}
                    >
                        <FormOutlined />
                    </span>
                </Dropdown>
                {/* </Tooltip> */}
            </div>
            <div
                className="spo-3d-main-tools-right"
                onClick={() => {
                    setShowDraw(true);
                }}
            >
                <span>属性列表</span>
            </div>
        </>
    );
}
