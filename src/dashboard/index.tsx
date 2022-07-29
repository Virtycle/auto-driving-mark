import React, { useEffect, useRef, useState, useContext } from 'react';
import Tools3D from '@/components/tool-3d';
import { GlobalContext } from '@/global-data';
import GridLayout from 'react-grid-layout';
import throttle from 'lodash/throttle';
import get from 'lodash/get';
import ResizeObserver from 'resize-observer-polyfill';
import './index.scss';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const layoutWith2d = [
    { i: 'spo-2d-main', x: 0, y: 0, w: 6, h: 11 },
    { i: 'spo-3d-main', x: 6, y: 2, w: 6, h: 11 },
    { i: 'spo-2d-list', x: 0, y: 6, w: 3, h: 7 },
    { i: 'spo-3d-front', x: 3, y: 6, w: 3, h: 7 },
    { i: 'spo-3d-top', x: 6, y: 6, w: 3, h: 7 },
    { i: 'spo-3d-side', x: 9, y: 6, w: 3, h: 7 },
];

const layoutWithout2d = [
    { i: 'spo-3d-main', x: 0, y: 0, w: 12, h: 10 },
    { i: 'spo-3d-front', x: 0, y: 10, w: 4, h: 8 },
    { i: 'spo-3d-top', x: 4, y: 10, w: 4, h: 8 },
    { i: 'spo-3d-side', x: 8, y: 10, w: 4, h: 8 },
];

// 判断权限 确定布局
const layoutToUse = layoutWithout2d;

function generateElements(layout: typeof layoutWith2d) {
    return layout.map((item) => {
        if (item.i === 'spo-3d-main') {
            return (
                <div key={item.i} className="spo-dashboard-item" tabIndex={-1} id={item.i}>
                    <Tools3D />
                </div>
            );
        } else {
            return <div key={item.i} className="spo-dashboard-item" tabIndex={-1} id={item.i} />;
        }
    });
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
    const [layoutI, setLayoutI] = useState(layoutToUse);
    const { manager, circleLimit } = useContext(GlobalContext);
    const currentFullScreenRef = useRef<string>('');

    const layoutRef = useRef<HTMLDivElement>(null);
    // 布局
    useEffect(() => {
        if (layoutToUse === layoutWith2d) {
            if (layoutRef.current && !manager.manager3DInstance.isInit && circleLimit.length) {
                manager.manager3DInstance.setCircleRadius(circleLimit);
                manager.manager3DInstance.initScene({
                    mainDiv: layoutRef.current?.children[1] as HTMLDivElement,
                    topDiv: layoutRef.current?.children[4] as HTMLDivElement,
                    frontDiv: layoutRef.current?.children[3] as HTMLDivElement,
                    sideDiv: layoutRef.current?.children[5] as HTMLDivElement,
                });
            }
        } else if (layoutToUse === layoutWithout2d) {
            if (layoutRef.current && !manager.manager3DInstance.isInit && circleLimit.length) {
                manager.manager3DInstance.setCircleRadius(circleLimit);
                manager.manager3DInstance.initScene({
                    mainDiv: layoutRef.current?.children[0] as HTMLDivElement,
                    topDiv: layoutRef.current?.children[2] as HTMLDivElement,
                    frontDiv: layoutRef.current?.children[1] as HTMLDivElement,
                    sideDiv: layoutRef.current?.children[3] as HTMLDivElement,
                });
            }
        }
    }, [manager, circleLimit]);

    useEffect(() => {
        const children = get(layoutRef.current, 'children');
        let eventMap: { [key: string]: (event: KeyboardEvent) => void } = {};

        const getNewLayout = (id: string) => {
            return layoutToUse.map((item) => {
                if (item.i === id) {
                    return {
                        x: 0,
                        y: 0,
                        w: 12,
                        h: 18,
                        i: item.i,
                    };
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
                    } else if (id !== item.id) {
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
                if (item.id !== 'spo-2d-list') {
                    resizeObserver.observe(item);
                    const eventHandler = toggleLayout.bind(null, item.id);
                    eventMap[item.id] = eventHandler;
                    item.addEventListener('keydown', eventHandler);
                }
            });
        }
        return () => {
            if (children) {
                Array.prototype.forEach.call(children, (item) => {
                    if (item.id !== 'spo-2d-list') {
                        resizeObserver.unobserve(item);
                        item.removeEventListener('keydown', eventMap[item.id]);
                    }
                });
                eventMap = {};
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
