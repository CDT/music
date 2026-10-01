import chineseText from '../content/zh-CN.json';

const catalog: Record<string, string> = chineseText;
const normalizedCatalog = new Map(
  Object.entries(catalog).map(([english, chinese]) => [english.replace(/\s+/g, ' ').trim(), chinese]),
);
const textOriginals = new WeakMap<Text, { original: string; rendered: string }>();
const attributeOriginals = new WeakMap<Element, Map<string, { original: string; rendered: string }>>();
const translatedAttributes = ['aria-label', 'aria-description', 'title', 'placeholder', 'alt'];

const overrides: Record<string, string> = {
  'A minor': 'A 小调',
  'C major': 'C 大调',
  'G major': 'G 大调',
  'F major': 'F 大调',
  'D major': 'D 大调',
  'Understand': '理解',
  'Try it': '试一试',
  'A phrase': '乐句',
  'phrase': '乐句',
  'phrases': '乐句',
  'bar': '小节',
  'bars': '小节',
  'beat': '拍',
  'beats': '拍',
  'Home': '首页',
  'Course': '课程',
  'Practice': '练习',
  'Notebook': '笔记本',
  'Studies': '练习曲',
  'Harmony Lab': '和声实验室',
  'Reference': '参考资料',
  'Progress': '学习进度',
  'Settings': '设置',
  'Unassisted': '独立完成',
  'Comfortable': '熟练掌握',
  'Bar': '小节',
  'Chord': '和弦',
  'Notes': '音符',
  'Pickup': '弱起小节',
  'rest': '休止符',
};

export function translate(value: string): string {
  const match = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match) return value;
  const original = match[2];
  const translated = overrides[original] ?? catalog[original] ?? normalizedCatalog.get(original.replace(/\s+/g, ' '));
  if (!translated) {
    const courseSummary = original.match(/^12 modules, (\d+) lessons\. (\d+) completed\.$/);
    if (courseSummary) return `${match[1]}12 个单元，${courseSummary[1]} 节课。已完成 ${courseSummary[2]} 节。${match[3]}`;
    const lessonCount = original.match(/^(\d+) lessons? shown\.$/);
    if (lessonCount) return `${match[1]}显示 ${lessonCount[1]} 节课。${match[3]}`;
    const beats = original.match(/^([\d.]+) beats?$/);
    if (beats) return `${match[1]}${beats[1]} 拍${match[3]}`;
    const barRange = original.match(/^Bars (\d+)–(\d+)$/);
    if (barRange) return `${match[1]}第 ${barRange[1]}–${barRange[2]} 小节${match[3]}`;
    const chordLabel = original.match(/^Version ([AB]), bar (\d+) (second )?chord$/);
    if (chordLabel) return `${match[1]}版本 ${chordLabel[1]}，第 ${chordLabel[2]} 小节${chordLabel[3] ? '第二个' : ''}和弦${match[3]}`;
    const studyRange = original.match(/^(.+) bars (\d+)–(\d+)$/);
    if (studyRange) return `${match[1]}${translate(studyRange[1])} 第 ${studyRange[2]}–${studyRange[3]} 小节${match[3]}`;
    const invalidBar = original.match(/^Bar (\d+) does not add up to ([\d.]+) beats, so this is saved as a draft and full arrangement playback is disabled until it is repaired\.$/);
    if (invalidBar) return `${match[1]}第 ${invalidBar[1]} 小节的时值加起来不等于 ${invalidBar[2]} 拍，因此暂存为草稿。修正后才能播放完整编配。${match[3]}`;
    const notebookCount = original.match(/^(\d+) notebook entries$/);
    if (notebookCount) return `${match[1]}${notebookCount[1]} 个笔记本条目${match[3]}`;
    if (/^Changes are not being saved(?: on this browser)? \(/.test(original)) {
      return `${match[1]}此浏览器无法保存更改。你的操作暂存在本次会话中，仍可导出备份。${match[3]}`;
    }
    const moduleHeading = original.match(/^Module (\d+) — (.+)$/);
    if (moduleHeading) return `${match[1]}第 ${moduleHeading[1]} 单元 — ${translate(moduleHeading[2])}${match[3]}`;
    const reviewTask = original.match(/^Review task: (.+)$/);
    if (reviewTask) return `${match[1]}复习任务：${translate(reviewTask[1])}${match[3]}`;
    const readiness = original.match(/^Readiness: (.+)$/);
    if (readiness) return `${match[1]}掌握程度：${translate(readiness[1])}${match[3]}`;
    const scoreCaption = original.match(/^Beat grid for (.+): bars, chord symbols, note names and durations in quarter beats\.$/);
    if (scoreCaption) return `${match[1]}${translate(scoreCaption[1])} 的节拍表：显示小节、和弦、音名及以四分音符为单位的时值。${match[3]}`;
    const staff = original.match(/^Staff notation for (.+)\. (.+)$/);
    if (staff) return `${match[1]}${translate(staff[1])} 的五线谱。${staff[2]
      .replace(/Bar (\d+)(?: on ([A-G][#b]?\w*))?:/g, (_whole, bar: string, chord: string | undefined) => `第 ${bar} 小节${chord ? `，和弦 ${chord}` : ''}：`)
      .replaceAll('quarter', '四分音符').replaceAll('half', '二分音符')
      .replaceAll('eighth', '八分音符').replaceAll('whole', '全音符')
      .replaceAll('rest', '休止符')}${match[3]}`;
    const descriptionParts = original.split(' — ');
    if (descriptionParts.length > 1) {
      return `${match[1]}${descriptionParts.map(translate).join(' — ')}${match[3]}`;
    }
    const sentences = original.split(/(?<=\.)\s+(?=[A-Z])/);
    if (sentences.length > 1) {
      return `${match[1]}${sentences.map(translate).join(' ')}${match[3]}`;
    }
  }
  return translated ? `${match[1]}${translated}${match[3]}` : value;
}

function updateText(node: Text) {
  let entry = textOriginals.get(node);
  if (!entry || (node.data !== entry.original && node.data !== entry.rendered)) {
    entry = { original: node.data, rendered: node.data };
    textOriginals.set(node, entry);
  }
  const next = translate(entry.original);
  entry.rendered = next;
  if (node.data !== next) node.data = next;
}

function updateAttributes(element: Element) {
  let originals = attributeOriginals.get(element);
  if (!originals) {
    originals = new Map();
    attributeOriginals.set(element, originals);
  }
  for (const name of translatedAttributes) {
    const value = element.getAttribute(name);
    if (value === null) continue;
    const oldOriginal = originals.get(name);
    if (oldOriginal === undefined || (value !== oldOriginal.original && value !== oldOriginal.rendered)) {
      originals.set(name, { original: value, rendered: value });
    }
    const entry = originals.get(name)!;
    const next = translate(entry.original);
    entry.rendered = next;
    if (value !== next) element.setAttribute(name, next);
  }
}

function updateTree(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    updateText(node as Text);
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const element = node as Element;
  if (element.closest('[data-no-translate]')) return;
  updateAttributes(element);
  for (const child of element.childNodes) updateTree(child);
}

export function startTranslation() {
  document.documentElement.lang = 'zh-CN';
  document.title = '从心中旋律到钢琴';
  const observer = new MutationObserver((changes) => {
    for (const change of changes) {
      if (change.type === 'characterData') updateTree(change.target);
      if (change.type === 'attributes') updateTree(change.target);
      for (const node of change.addedNodes) updateTree(node);
    }
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: translatedAttributes,
  });
  updateTree(document.body);
}
