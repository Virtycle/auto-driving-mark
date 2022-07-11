import React, { useEffect, useRef, useState, useContext } from 'react';
import { GlobalContext } from '@/global-data';
import GridLayout from 'react-grid-layout';
import axios from '@/common/axios';
import { baseURL } from '@/common/api';
import { AllFrameData } from '@/common/interface';
import throttle from 'lodash/throttle';
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

export default function Dashboard(props: { contentHeight: number; contentWidth: number }) {
    const defaultLayoutOpt = {
        isDraggable: false,
        isResizable: false,
    };
    const { contentHeight, contentWidth } = props;
    const rowHeight = Math.round(contentHeight / 18);
    const contentWidthI = Math.round(contentWidth);
    const [layoutI, setLayoutI] = useState(layout);
    const { manager } = useContext(GlobalContext);

    const ref3 = useRef<HTMLDivElement>(null);

    useEffect(() => {
        axios.get<never, AllFrameData>(baseURL).then((data) => {
            const loader = new PCDLoaderEx();
            loader.load(data.frameUrl, (geo: BufferGeometry) => {
                if (ref3.current && !manager.isInit) {
                    manager.initScene({
                        mainDiv: ref3.current?.children[2] as HTMLDivElement,
                        topDiv: ref3.current?.children[5] as HTMLDivElement,
                        frontDiv: ref3.current?.children[4] as HTMLDivElement,
                        sideDiv: ref3.current?.children[6] as HTMLDivElement,
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
                    //     manager.sceneRenderInstance.mainRendererInstance.changeState(STATE.DRAW_DRAG);
                    // }, 5000);
                }
            });
        });
        return () => {
            manager.destroy();
        };
    }, []);

    useEffect(() => {
        // const toggleLayout = (id: string) => {
        //     const newLayout = layout
        //         .filter((item) => item.i === id)
        //         .map((item) => {
        //             return {
        //                 i: item.i,
        //                 x: 0,
        //                 y: 0,
        //                 w: 12,
        //                 h: 18,
        //             };
        //         });
        //     console.log(newLayout);

        //     setLayoutI(newLayout);
        // };
        const resizeObserver = new ResizeObserver(
            throttle(() => {
                manager.resize();
            }, 500),
        );
        if (ref3.current) {
            Array.prototype.forEach.call(ref3.current.children, (item) => {
                resizeObserver.observe(item);
                // item.addEventListener('keydown', (event: KeyboardEvent) => {
                //     switch (event.key) {
                //         case 'Tab':
                //             toggleLayout(item.id);
                //             break;
                //     }
                // });
            });
        }
        return () => {
            if (ref3.current) {
                Array.prototype.forEach.call(ref3.current.children, (item) => {
                    resizeObserver.unobserve(item);
                });
            }
        };
    }, []);

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
                innerRef={ref3}
                // onResizeStop={() => {}}
                {...defaultLayoutOpt}
            >
                <div key="spo-2d-main" className="spo-dashboard-item" id="spo-2d-main">
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
