import React, { useEffect, useRef, useState, useContext } from 'react';
import { GlobalContext } from '@/global-data';
import GridLayout from 'react-grid-layout';
import throttle from 'lodash/throttle';
import get from 'lodash/get';
import ResizeObserver from 'resize-observer-polyfill';
import { ObjectInScene, ObjectCategory } from '@/common/interface';
import { Color } from 'three';
import './index.scss';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const layoutWith2d = [
    { i: 'spo-2d-main', x: 0, y: 0, w: 6, h: 11 },
    { i: 'spo-3d-tools', x: 6, y: 0, w: 6, h: 1 },
    { i: 'spo-3d-main', x: 6, y: 2, w: 6, h: 10 },
    { i: 'spo-2d-list', x: 0, y: 6, w: 3, h: 7 },
    { i: 'spo-3d-front', x: 3, y: 6, w: 3, h: 7 },
    { i: 'spo-3d-top', x: 6, y: 6, w: 3, h: 7 },
    { i: 'spo-3d-side', x: 9, y: 6, w: 3, h: 7 },
];

// 判断权限 确定布局
const layoutToUse = layoutWith2d;

function generateElements(layout: typeof layoutWith2d) {
    return layout.map((item) => <div key={item.i} className="spo-dashboard-item" tabIndex={-1} id={item.i} />);
}
// function BuildObjectTree(frames: FrameResultData[], category: ObjectCategory[]) {
//     category.sort((a, b) => a.order - b.order);
//     frames.forEach((frame) => {
//         const { items, images } = frame;
//     });

//     return {};
// }

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
    const [layoutI, setLayoutI] = useState(layoutWith2d);
    const { manager, frameResultData, objectCategoryAll, resouceRelation } = useContext(GlobalContext);
    const currentFullScreenRef = useRef<string>('');

    const layoutRef = useRef<HTMLDivElement>(null);
    // 布局
    useEffect(() => {
        if (layoutRef.current && !manager.manager3DInstance.isInit) {
            manager.manager3DInstance.initScene({
                mainDiv: layoutRef.current?.children[2] as HTMLDivElement,
                topDiv: layoutRef.current?.children[5] as HTMLDivElement,
                frontDiv: layoutRef.current?.children[4] as HTMLDivElement,
                sideDiv: layoutRef.current?.children[6] as HTMLDivElement,
            });
        }
        return () => {
            manager.manager3DInstance.destroy();
        };
    }, [manager]);
    // 添加所有帧的所有3d object
    useEffect(() => {
        if (frameResultData.length && objectCategoryAll.length) {
            const mapForCheck: { [k: string]: ObjectInScene } = {};
            // 从后向前覆盖重复
            for (let index = frameResultData.length - 1; index >= 0; index--) {
                const frame3dItems = frameResultData[index].items || [];
                frame3dItems.forEach((item3d) => {
                    mapForCheck[item3d.id] = item3d;
                });
            }
            Object.values(mapForCheck).forEach((object3D) => {
                const category =
                    objectCategoryAll.find((item) => item.id === object3D.categoryId) ||
                    ({ show_color: '#00ff00', show_name: 'car' } as ObjectCategory);
                manager.manager3DInstance.addCubeCollection(
                    {
                        position: object3D.position,
                        rotation: object3D.rotation,
                        dimension: object3D.dimension,
                        name: object3D.id,
                        label: `${category.show_name} ${object3D.number}`,
                        dash: object3D.isEmpty,
                        pointsNum: object3D.pointsNum,
                        color: new Color(category.show_color),
                    },
                    false,
                );
            });
        }

        // setTimeout(() => {
        //     manager.idbStoreInstance.readPointData('052_1591240197426.pcd').then((data) => {
        //         console.log(data);
        //     });
        // }, 5000);
        // setTimeout(() => {
        // manager.sceneRenderInstance.mainRendererInstance.changeState(STATE.DRAW_PICK);
        // manager.switchPointCloudColorType(2);
        // }, 3000);
    }, [frameResultData, objectCategoryAll, manager]);

    useEffect(() => {
        const children = get(layoutRef.current, 'children');
        const eventArray: ((event: KeyboardEvent) => void)[] = [];

        const getNewLayout = (id: string) => {
            return layoutToUse.map((item) => {
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
                        setLayoutI(layoutToUse);
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
                manager.manager3DInstance.resize();
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
                {generateElements(layoutToUse)}
            </GridLayout>
        </>
    );
}
