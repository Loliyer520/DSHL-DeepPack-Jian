#!/usr/bin/env node
// 从 lucide-static 的 icon-nodes.json 生成内置图标库 src/icons.ts（精选常用于幻灯片的图标，附中文名便于搜索）。
// 用法：node packages/engine/scripts/gen-icons.mjs <lucide-static 目录>
// 生成的文件随仓库提交；运行时不依赖 lucide 包。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = process.argv[2];
if (!src || !fs.existsSync(path.join(src, 'icon-nodes.json'))) {
  console.error('用法：node gen-icons.mjs <lucide-static 包目录>');
  process.exit(1);
}
const nodes = JSON.parse(fs.readFileSync(path.join(src, 'icon-nodes.json'), 'utf8'));
const version = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8')).version;

// [分类, [[lucide 名, 中文名], …]]
const CATALOG = [
  ['箭头', [['arrow-right', '右箭头'], ['arrow-left', '左箭头'], ['arrow-up', '上箭头'], ['arrow-down', '下箭头'], ['arrow-up-right', '右上箭头'], ['arrow-down-right', '右下箭头'], ['move-right', '长箭头'], ['chevron-right', '右尖角'], ['chevrons-right', '双右尖角'], ['circle-arrow-right', '圆形右箭头'], ['redo-2', '回转'], ['repeat', '循环'], ['refresh-cw', '刷新'], ['shuffle', '交换'], ['trending-up', '上升趋势'], ['trending-down', '下降趋势'], ['corner-down-right', '转折'], ['split', '分流'], ['merge', '合并'], ['git-branch', '分支']]],
  ['状态', [['check', '对勾'], ['circle-check', '圆形对勾'], ['square-check', '方形对勾'], ['x', '叉'], ['circle-x', '圆形叉'], ['circle-alert', '警示'], ['triangle-alert', '警告'], ['info', '信息'], ['circle-question-mark', '疑问'], ['plus', '加'], ['minus', '减'], ['ban', '禁止'], ['badge-check', '认证'], ['loader', '加载中'], ['circle-dot', '圆点'], ['star', '星'], ['heart', '心'], ['thumbs-up', '点赞'], ['thumbs-down', '点踩'], ['flag', '旗帜']]],
  ['人物', [['user', '用户'], ['users', '团队'], ['user-check', '已认证用户'], ['user-plus', '新增用户'], ['contact', '联系人'], ['baby', '婴儿'], ['face-slightly-smiling', '笑脸'], ['face-slightly-frowning', '难过'], ['hand-heart', '关怀'], ['handshake', '握手'], ['person-standing', '人物'], ['accessibility', '无障碍']]],
  ['商业', [['briefcase', '公文包'], ['building', '建筑'], ['factory', '工厂'], ['store', '商店'], ['landmark', '机构'], ['dollar-sign', '美元'], ['badge-dollar-sign', '收入'], ['coins', '硬币'], ['wallet', '钱包'], ['credit-card', '银行卡'], ['piggy-bank', '储蓄'], ['receipt', '账单'], ['shopping-cart', '购物车'], ['shopping-bag', '购物袋'], ['package', '包裹'], ['truck', '物流'], ['handshake', '合作'], ['scale', '天平'], ['gavel', '法槌'], ['target', '目标'], ['trophy', '奖杯'], ['award', '奖章'], ['crown', '皇冠'], ['gem', '钻石'], ['medal', '勋章'], ['presentation', '演示'], ['percent', '百分比']]],
  ['数据', [['chart-bar', '柱状图'], ['chart-column', '条形图'], ['chart-line', '折线图'], ['chart-pie', '饼图'], ['chart-area', '面积图'], ['chart-spline', '曲线图'], ['chart-no-axes-combined', '组合图'], ['activity', '活动'], ['gauge', '仪表盘'], ['sigma', '求和'], ['hash', '编号'], ['calculator', '计算器'], ['table', '表格'], ['database', '数据库'], ['list-checks', '清单'], ['list-ordered', '有序列表'], ['kanban', '看板'], ['funnel', '漏斗'], ['layers', '图层'], ['layout-grid', '网格']]],
  ['科技', [['cpu', '芯片'], ['server', '服务器'], ['cloud', '云'], ['cloud-upload', '上传云'], ['wifi', '无线'], ['bluetooth', '蓝牙'], ['code', '代码'], ['code-xml', '标签'], ['terminal', '终端'], ['bot', '机器人'], ['brain', '大脑'], ['brain-circuit', '神经网络'], ['sparkles', '闪光'], ['wand-sparkles', '魔法棒'], ['zap', '闪电'], ['rocket', '火箭'], ['satellite', '卫星'], ['atom', '原子'], ['dna', '基因'], ['flask-conical', '实验'], ['microscope', '显微镜'], ['smartphone', '手机'], ['laptop', '笔记本'], ['monitor', '显示器'], ['tablet', '平板'], ['keyboard', '键盘'], ['mouse-pointer-click', '点击'], ['plug', '插头'], ['battery-charging', '充电'], ['shield', '盾牌'], ['shield-check', '安全'], ['lock', '锁'], ['key-round', '钥匙'], ['fingerprint-pattern', '指纹'], ['scan-eye', '识别'], ['qr-code', '二维码'], ['link', '链接'], ['share-2', '分享'], ['puzzle', '拼图'], ['blocks', '模块'], ['component', '组件'], ['workflow', '工作流'], ['git-merge', '合并分支'], ['git-fork', '分叉'], ['settings', '设置'], ['wrench', '扳手'], ['hammer', '锤子'], ['bug', '缺陷']]],
  ['沟通', [['mail', '邮件'], ['send', '发送'], ['message-circle', '消息'], ['message-square', '对话'], ['messages-square', '多人对话'], ['phone', '电话'], ['bell', '通知'], ['megaphone', '喇叭'], ['mic', '麦克风'], ['quote', '引号'], ['at-sign', '@'], ['rss', '订阅'], ['radio', '广播'], ['languages', '翻译'], ['globe', '全球']]],
  ['媒体', [['play', '播放'], ['pause', '暂停'], ['circle-play', '圆形播放'], ['video', '视频'], ['film', '电影'], ['clapperboard', '场记板'], ['camera', '相机'], ['image', '图片'], ['images', '图集'], ['list-music', '音乐'], ['headphones', '耳机'], ['volume-2', '音量'], ['tv', '电视'], ['palette', '调色板'], ['pen-tool', '钢笔'], ['brush', '画笔'], ['pencil', '铅笔'], ['scissors', '剪刀'], ['ruler', '尺子'], ['type', '文字'], ['book-open', '书'], ['newspaper', '报纸'], ['file-text', '文档'], ['folder', '文件夹'], ['clipboard-list', '清单板'], ['bookmark', '书签'], ['notebook-pen', '笔记']]],
  ['时间地点', [['calendar', '日历'], ['calendar-check', '日程'], ['clock', '时钟'], ['timer', '计时器'], ['hourglass', '沙漏'], ['alarm-clock', '闹钟'], ['rotate-ccw-clock', '历史'], ['map', '地图'], ['map-pin', '定位'], ['navigation', '导航'], ['compass', '指南针'], ['house', '房子'], ['school', '学校'], ['graduation-cap', '学位帽'], ['hospital', '医院'], ['plane', '飞机'], ['car', '汽车'], ['bus', '巴士'], ['train-front', '火车'], ['ship', '轮船'], ['bike', '自行车'], ['earth', '地球'], ['mountain', '山'], ['tent', '帐篷']]],
  ['自然生活', [['sun', '太阳'], ['moon', '月亮'], ['cloud-sun', '多云'], ['cloud-rain', '下雨'], ['snowflake', '雪花'], ['wind', '风'], ['flame', '火焰'], ['droplet', '水滴'], ['leaf', '叶子'], ['sprout', '新芽'], ['tree-pine', '松树'], ['flower', '花'], ['recycle', '循环利用'], ['coffee', '咖啡'], ['utensils', '餐具'], ['cake', '蛋糕'], ['gift', '礼物'], ['party-popper', '庆祝'], ['gamepad-2', '游戏'], ['dumbbell', '健身'], ['heart-pulse', '健康'], ['stethoscope', '听诊器'], ['pill', '药丸'], ['paw-print', '爪印'], ['lightbulb', '灯泡'], ['eye', '眼睛'], ['search', '搜索'], ['infinity', '无限'], ['anchor', '锚'], ['key', '钥匙'], ['umbrella', '雨伞']]],
];

const out = [];
const missing = [];
const seen = new Set();
for (const [group, list] of CATALOG) {
  for (const [name, label] of list) {
    if (seen.has(name)) continue;
    const node = nodes[name];
    if (!node) { missing.push(name); continue; }
    seen.add(name);
    out.push({ name, label, group, node: node.map(([tag, attrs]) => [tag, Object.fromEntries(Object.entries(attrs).filter(([k]) => k !== 'key'))]) });
  }
}
if (missing.length) {
  console.error('lucide 中找不到这些图标：' + missing.join(', '));
  process.exit(1);
}

const header = `// 自动生成：node packages/engine/scripts/gen-icons.mjs（lucide-static ${version}）——请勿手改。
// 图标来自 Lucide（ISC 许可；部分源自 Feather，MIT 许可），许可全文见 packages/engine/licenses/lucide.txt。
// 每个图标是 24×24 视图下的描边节点列表：[标签名, 属性]。
`;
const body = `export type IconNode = [string, Record<string, string | number>][];
export interface IconDef { name: string; label: string; group: string; node: IconNode }

export const ICONS: IconDef[] = ${JSON.stringify(out)};

const byName = new Map(ICONS.map((i) => [i.name, i]));
export const iconByName = (name: string | undefined): IconDef | undefined => (name ? byName.get(name) : undefined);
export const ICON_GROUPS: string[] = [...new Set(ICONS.map((i) => i.group))];
`;
fs.writeFileSync(path.join(here, '../src/icons.ts'), header + body);
fs.mkdirSync(path.join(here, '../licenses'), { recursive: true });
fs.copyFileSync(path.join(src, 'LICENSE'), path.join(here, '../licenses/lucide.txt'));
console.log('生成 ' + out.length + ' 个图标 → src/icons.ts（' + Math.round(Buffer.byteLength(header + body) / 1024) + ' KB）');
