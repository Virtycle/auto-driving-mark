import React, { useEffect, useRef, useState } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import './index.scss';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import ContentManager3D, { PCDLoaderEx } from '@/engine';
import { BufferGeometry } from 'three';

const ReactGridLayout = WidthProvider(RGL);

export default function Dashboard() {
    const defaultLayoutOpt = {
        isDraggable: false,
        isResizable: false,
    };

    const ref2 = useRef<ContentManager3D | null>(null);
    const ref3 = useRef<HTMLDivElement>(null);

    const layout = [
        { i: '2d-main', x: 0, y: 0, w: 6, h: 11 },
        { i: '3d-tools', x: 6, y: 0, w: 6, h: 1 },
        { i: '3d-main', x: 6, y: 2, w: 6, h: 10 },
        { i: '2d-list', x: 0, y: 6, w: 3, h: 7 },
        { i: '3d-front', x: 3, y: 6, w: 3, h: 7 },
        { i: '3d-top', x: 6, y: 6, w: 3, h: 7 },
        { i: '3d-side', x: 9, y: 6, w: 3, h: 7 },
    ];

    useEffect(() => {
        if (!ref2.current) {
            const loader = new PCDLoaderEx();
            const manager = new ContentManager3D();
            ref2.current = manager;
            loader.load('./052_1591240197426.pcd', (data: BufferGeometry) => {
                // loader.load('./1635923800089062.pcd', (data) => {
                if (ref3.current) {
                    manager.initScene({
                        mainDiv: ref3.current?.children[2] as HTMLDivElement,
                        topDiv: ref3.current?.children[5] as HTMLDivElement,
                        frontDiv: ref3.current?.children[4] as HTMLDivElement,
                        sideDiv: ref3.current?.children[6] as HTMLDivElement,
                        pointCloud: data,
                    });
                    manager.addCubeCollection({
                        position: {
                            x: 12.91,
                            y: 8.0357,
                            z: 0,
                        },
                        rotation: {
                            x: 0,
                            y: 0,
                            z: 120,
                        },
                        dimension: {
                            x: 2.153,
                            y: 4.127,
                            z: 1.69,
                        },
                        name: 'car1',
                        active: false,
                    });
                    setTimeout(() => {
                        manager.activeCube('car1');
                    }, 5000);
                    setTimeout(() => {
                        manager.inActiveCube();
                    }, 10000);
                    // build point cloud
                }
            });
        }
        // return () => {
        //     scene.stopAnimate();
        // };
    }, []);
    return (
        <>
            <ReactGridLayout
                className="spo-dashboard-wrapper"
                layout={layout}
                cols={12}
                margin={[0, 0]}
                rowHeight={43}
                useCSSTransforms={false}
                innerRef={ref3}
                {...defaultLayoutOpt}
            >
                <div key="2d-main" className="spo-dashboard-item" id="spo-2d-main">
                    2D Canvas Main
                </div>
                <div key="3d-tools" className="spo-dashboard-item" id="spo-3d-tools">
                    3D Canvas tools
                </div>
                <div key="3d-main" className="spo-dashboard-item" id="spo-3d-main"></div>
                <div key="2d-list" className="spo-dashboard-item" id="spo-2d-list">
                    2D Canvas List
                </div>
                <div key="3d-front" className="spo-dashboard-item" id="spo-3d-front"></div>
                <div key="3d-top" className="spo-dashboard-item" id="spo-3d-top"></div>
                <div key="3d-side" className="spo-dashboard-item" id="spo-3d-side"></div>
            </ReactGridLayout>
        </>
    );
}
