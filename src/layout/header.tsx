import React from 'react';
import { Layout } from 'antd';

const { Header: HeaderAntD } = Layout;

export default function Header() {
    return (
        <HeaderAntD className="spo-header" style={{ background: '#474747' }}>
            <div className="logo" />
            <div style={{ fontSize: '20px', color: '#ebebeb' }}>SpeechOcean</div>
        </HeaderAntD>
    );
}
