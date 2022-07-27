import React from 'react';
import { Layout, Button, Space } from 'antd';
import { FullscreenOutlined } from '@ant-design/icons';

const { Header: HeaderAntD } = Layout;

type IProps = {
    toggleFullSceen: () => void;
};

export default function Header(props: IProps) {
    const { toggleFullSceen } = props;
    return (
        <HeaderAntD className="spo-header" style={{ background: '#474747', display: 'flex' }}>
            <div style={{ fontSize: '20px', color: '#ebebeb', width: '200px' }}>SpeechOcean</div>
            <Space size={10}>
                <Button type="text" style={{ color: '#ebebeb' }}>
                    undo
                </Button>
                <Button type="text" style={{ color: '#ebebeb' }}>
                    redo
                </Button>
                <Button type="text" style={{ color: '#ebebeb' }}>
                    keys
                </Button>
                <Button type="text" style={{ color: '#ebebeb' }}>
                    setting{' '}
                </Button>
                <Button
                    type="text"
                    style={{ color: '#ebebeb' }}
                    icon={<FullscreenOutlined />}
                    onClick={toggleFullSceen}
                >
                    全屏
                </Button>
            </Space>
        </HeaderAntD>
    );
}
