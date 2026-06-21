'use client';
import { useState } from 'react';

export default function TestPage() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ padding: 50, background: '#FFFDF7', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Click Test</h1>
      <button onClick={() => setCount(count + 1)} style={{ padding: '20px 40px', fontSize: 20, borderRadius: 12, background: '#C4956A', color: 'white', border: 'none', cursor: 'pointer' }}>
        Clicked {count} times
      </button>
      <p style={{ marginTop: 20, fontSize: 16 }}>如果按鈕可以點擊增加數字, 代表 React 正常運作。</p>
      <p style={{ fontSize: 16 }}>If button works, then the issue is with the explore page code.</p>
    </div>
  );
}
