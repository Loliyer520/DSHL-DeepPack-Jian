import React from 'react';
import { useDialog } from './useDialog';

const shortcuts = [
  ['空格', '播放 / 暂停'],
  ['← / →', '前后移动一帧'],
  ['Shift + ← / →', '前后移动一秒'],
  ['S', '分割选中片段；主轨模式下可直接分割'],
  ['Enter', '打开选中片段属性'],
  ['Delete / Backspace', '删除选中片段'],
  ['Ctrl / ⌘ + Z', '撤销'],
  ['Ctrl / ⌘ + Shift + Z', '重做'],
  ['Esc', '取消拖动、输入草稿或当前选择'],
];

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const ref = useDialog(onClose);
  return <div className="djp-mask" onClick={onClose}>
    <div className="djp-dialog djp-shortcuts" ref={ref} role="dialog" aria-modal="true" aria-label="操作与快捷键" tabIndex={-1} onClick={(event) => event.stopPropagation()}>
      <div className="djp-shortcuts-head"><div className="djp-dialog-title">操作与快捷键</div><button className="djp-btn" onClick={onClose}>关闭</button></div>
      <p>先点击剪辑工作区。输入文字、调整控件或使用宿主其他区域时，保留该区域的键盘操作。</p>
      <dl>{shortcuts.map(([keys, action]) => <div key={keys}><dt><kbd>{keys}</kbd></dt><dd>{action}</dd></div>)}</dl>
      <p>点击片段选中，双击打开属性。点击播放时间可输入时间或帧数定位；再次点击当前轨道模式可展开工具。</p>
    </div>
  </div>;
}
