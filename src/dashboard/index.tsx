import React, { useEffect, useRef, useState, useContext } from 'react';
import { GlobalContext } from '@/global-data';
import GridLayout from 'react-grid-layout';
import axios from '@/common/axios';
import { baseURL } from '@/common/api';
import { AllFrameData } from '@/common/interface';
import throttle from 'lodash/throttle';
import get from 'lodash/get';
import ResizeObserver from 'resize-observer-polyfill';
import './index.scss';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { PCDLoaderEx } from '@/engine';
import { BufferGeometry } from 'three';
import { STATE } from '@/engine/interface';

const layout = [
    { i: 'spo-2d-main', x: 0, y: 0, w: 6, h: 11 },
    { i: 'spo-3d-tools', x: 6, y: 0, w: 6, h: 1 },
    { i: 'spo-3d-main', x: 6, y: 2, w: 6, h: 10 },
    { i: 'spo-2d-list', x: 0, y: 6, w: 3, h: 7 },
    { i: 'spo-3d-front', x: 3, y: 6, w: 3, h: 7 },
    { i: 'spo-3d-top', x: 6, y: 6, w: 3, h: 7 },
    { i: 'spo-3d-side', x: 9, y: 6, w: 3, h: 7 },
];

export default function Dashboard(props: {
    contentHeight: number;
    contentWidth: number;
    changeSiderCollapsed: (bool: boolean) => void;
}) {
    const defaultLayoutOpt = {
        isDraggable: false,
        isResizable: false,
    };
    const { contentHeight, contentWidth, changeSiderCollapsed } = props;
    const rowHeight = Math.round(contentHeight / 18);
    const contentWidthI = Math.round(contentWidth);
    const [layoutI, setLayoutI] = useState(layout);
    const { manager } = useContext(GlobalContext);
    const currentFullScreenRef = useRef<string>('');

    const layoutRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        axios.get<never, AllFrameData>(baseURL).then((data) => {
            const loader = new PCDLoaderEx();
            loader.load(data.frameUrl, (geo: BufferGeometry) => {
                if (layoutRef.current && !manager.isInit) {
                    manager.initScene({
                        mainDiv: layoutRef.current?.children[2] as HTMLDivElement,
                        topDiv: layoutRef.current?.children[5] as HTMLDivElement,
                        frontDiv: layoutRef.current?.children[4] as HTMLDivElement,
                        sideDiv: layoutRef.current?.children[6] as HTMLDivElement,
                        pointCloud: geo,
                    });
                    const itemData = data.items;
                    itemData.forEach((item) => {
                        manager.addCubeCollection({
                            position: item.position,
                            rotation: item.rotation,
                            dimension: item.dimension,
                            name: item.id,
                            label: `${item.category} ${item.number}`,
                            active: false,
                        });
                    });
                    // setTimeout(() => {
                    //     manager.sceneRenderInstance.mainRendererInstance.changeState(STATE.DRAW_PICK);
                    // }, 5000);
                }
            });
        });
        return () => {
            manager.destroy();
        };
    }, [manager]);

    useEffect(() => {
        const children = get(layoutRef.current, 'children');
        const eventArray: ((event: KeyboardEvent) => void)[] = [];
        const getNewLayout = (id: string) => {
            return layout.map((item) => {
                if (item.i === id && id !== 'spo-3d-main') {
                    return {
                        x: 0,
                        y: 0,
                        w: 12,
                        h: 18,
                        i: item.i,
                    };
                } else if (id === 'spo-3d-main' && item.i === id) {
                    return {
                        x: 0,
                        y: 0,
                        w: 12,
                        h: 17,
                        i: item.i,
                    };
                } else if (id === 'spo-3d-main' && item.i === 'spo-3d-tools') {
                    return { x: 0, y: 0, w: 12, h: 1, i: item.i };
                } else {
                    return { x: 0, y: 0, w: 0, h: 0, i: item.i };
                }
            });
        };

        const toggleElementDisplay = (id?: string) => {
            if (children) {
                Array.prototype.forEach.call(children, (item) => {
                    if (!id) {
                        item.style.display = '';
                    } else if (
                        (id === 'spo-3d-main' && item.id !== 'spo-3d-main' && item.id !== 'spo-3d-tools') ||
                        (id !== 'spo-3d-main' && id !== item.id)
                    ) {
                        item.style.display = 'none';
                    }
                });
            }
        };
        const toggleLayout = (id: string, event: KeyboardEvent) => {
            event.preventDefault();
            switch (event.key) {
                case 'Tab': {
                    if (currentFullScreenRef.current) {
                        changeSiderCollapsed(false);
                        toggleElementDisplay();
                        setLayoutI(layout);
                        currentFullScreenRef.current = '';
                    } else {
                        changeSiderCollapsed(true);
                        const newLayout = getNewLayout(id);
                        toggleElementDisplay(id);
                        setLayoutI(newLayout);
                        currentFullScreenRef.current = id;
                    }
                    break;
                }
            }
        };

        const resizeObserver = new ResizeObserver(
            throttle(() => {
                manager.resize();
            }, 500),
        );
        if (children) {
            Array.prototype.forEach.call(children, (item) => {
                resizeObserver.observe(item);
                const eventHandler = toggleLayout.bind(null, item.id);
                eventArray.push(eventHandler);
                item.addEventListener('keydown', eventHandler);
            });
        }
        return () => {
            if (children) {
                Array.prototype.forEach.call(children, (item, i) => {
                    resizeObserver.unobserve(item);
                    item.removeEventListener('keydown', eventArray[i]);
                });
            }
        };
    }, [changeSiderCollapsed, manager]);

    return (
        <>
            <GridLayout
                className="spo-dashboard-wrapper"
                layout={layoutI}
                cols={12}
                margin={[0, 0]}
                rowHeight={rowHeight}
                width={contentWidthI}
                useCSSTransforms={false}
                innerRef={layoutRef}
                {...defaultLayoutOpt}
            >
                <div key="spo-2d-main" className="spo-dashboard-item" tabIndex={-1} id="spo-2d-main">
                    2D Canvas Main
                </div>
                <div key="spo-3d-tools" className="spo-dashboard-item" id="spo-3d-tools">
                    3D Canvas tools
                </div>
                <div key="spo-3d-main" className="spo-dashboard-item" id="spo-3d-main"></div>
                <div key="spo-2d-list" className="spo-dashboard-item" id="spo-2d-list">
                    2D Canvas List
                </div>
                <div key="spo-3d-front" className="spo-dashboard-item" id="spo-3d-front"></div>
                <div key="spo-3d-top" className="spo-dashboard-item" id="spo-3d-top"></div>
                <div key="spo-3d-side" className="spo-dashboard-item" id="spo-3d-side"></div>
            </GridLayout>
        </>
    );
}
