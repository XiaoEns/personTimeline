/**
 * 模拟数据 — 三国人物传记数据
 * 使用固定 UUID 保证关联关系一致
 */

// ========== UUID 常量 ==========
export const UUIDS = {
  ZGL: 'a1b2c3d4-0001-4000-8000-000000000001',  // 诸葛亮
  CC: 'a1b2c3d4-0002-4000-8000-000000000002',    // 曹操
  LB: 'a1b2c3d4-0003-4000-8000-000000000003',    // 刘备
  EVT_SGML: 'a1b2c3d4-0010-4000-8000-000000000010',  // 三顾茅庐
  EVT_LZD: 'a1b2c3d4-0011-4000-8000-000000000011',   // 隆中对
  EVT_CBZZ: 'a1b2c3d4-0012-4000-8000-000000000012',  // 赤壁之战
  EVT_JJZ: 'a1b2c3d4-0013-4000-8000-000000000013',   // 借荆州
  EVT_PDNZ: 'a1b2c3d4-0014-4000-8000-000000000014',  // 平定南中
  EVT_BF: 'a1b2c3d4-0015-4000-8000-000000000015',    // 北伐
  EVT_KCJ: 'a1b2c3d4-0016-4000-8000-000000000016',   // 空城计
  EVT_ZSZJ: 'a1b2c3d4-0017-4000-8000-000000000017',  // 斩马谡
  EVT_CSS: 'a1b2c3d4-0018-4000-8000-000000000018',   // 出师表
  EVT_MNLN: 'a1b2c3d4-0019-4000-8000-000000000019',  // 木牛流马
  EVT_WZY: 'a1b2c3d4-0020-4000-8000-000000000020',   // 五丈原
  EVT_GZDZ: 'a1b2c3d4-0021-4000-8000-000000000021',  // 官渡之战
  EVT_CCDTH: 'a1b2c3d4-0022-4000-8000-000000000022', // 曹操之死
  EVT_LBBIRTH: 'a1b2c3d4-0023-4000-8000-000000000023',
  EVT_LBDTH: 'a1b2c3d4-0024-4000-8000-000000000024',
  PE_ZGL_SGML: 'b1b2c3d4-0010-4000-8000-000000000010',
  PE_ZGL_LZD: 'b1b2c3d4-0011-4000-8000-000000000011',
  PE_ZGL_CBZZ: 'b1b2c3d4-0012-4000-8000-000000000012',
  PE_ZGL_JJZ: 'b1b2c3d4-0013-4000-8000-000000000013',
  PE_ZGL_PDNZ: 'b1b2c3d4-0014-4000-8000-000000000014',
  PE_ZGL_BF: 'b1b2c3d4-0015-4000-8000-000000000015',
  PE_ZGL_KCJ: 'b1b2c3d4-0016-4000-8000-000000000016',
  PE_ZGL_ZSZJ: 'b1b2c3d4-0017-4000-8000-000000000017',
  PE_ZGL_CSS: 'b1b2c3d4-0018-4000-8000-000000000018',
  PE_ZGL_MNLN: 'b1b2c3d4-0019-4000-8000-000000000019',
  PE_ZGL_WZY: 'b1b2c3d4-0020-4000-8000-000000000020',
  PE_CC_GZDZ: 'b1b2c3d4-0021-4000-8000-000000000021',
  BIO_01: 'c1b2c3d4-0001-4000-8000-000000000001',
  BIO_02: 'c1b2c3d4-0002-4000-8000-000000000002',
} as const

const NOW = new Date().toISOString()

// ========== 人物 ==========
export const MOCK_PERSONS = [
  {
    id: UUIDS.ZGL,
    name: '诸葛亮',
    birth_date: '0181-01-01T00:00:00Z',
    death_date: '0234-10-08T00:00:00Z',
    birth_display: '东汉光和四年（公元181年）',
    death_display: '蜀汉建兴十二年（公元234年）',
    avatar_url: null,
    summary: '字孔明，号卧龙，三国时期蜀汉丞相，杰出的政治家、军事家、文学家、发明家。辅佐刘备建立蜀汉政权，后受命托孤，尽心竭力辅佐后主刘禅。',
    status: 'published',
    event_count: 11,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: UUIDS.CC,
    name: '曹操',
    birth_date: '0155-01-01T00:00:00Z',
    death_date: '0220-03-15T00:00:00Z',
    birth_display: '东汉永寿元年（公元155年）',
    death_display: '东汉建安二十五年（公元220年）',
    avatar_url: null,
    summary: '字孟德，东汉末年杰出的政治家、军事家、文学家，曹魏政权的奠基人。以"挟天子以令诸侯"的策略统一北方。',
    status: 'published',
    event_count: 2,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: UUIDS.LB,
    name: '刘备',
    birth_date: '0161-01-01T00:00:00Z',
    death_date: '0223-06-10T00:00:00Z',
    birth_display: '东汉延熹四年（公元161年）',
    death_display: '蜀汉章武三年（公元223年）',
    avatar_url: null,
    summary: '字玄德，三国时期蜀汉开国皇帝。以仁德著称，三顾茅庐请诸葛亮出山，建立蜀汉政权。',
    status: 'published',
    event_count: 0,
    created_at: NOW,
    updated_at: NOW,
  },
]

export const MOCK_PERSON_DETAILS: Record<string, any> = {
  [UUIDS.ZGL]: {
    ...MOCK_PERSONS[0],
    aliases: ['孔明', '卧龙', '诸葛武侯', '诸葛丞相'],
  },
  [UUIDS.CC]: {
    ...MOCK_PERSONS[1],
    aliases: ['孟德', '魏武帝', '曹孟德'],
  },
  [UUIDS.LB]: {
    ...MOCK_PERSONS[2],
    aliases: ['玄德', '刘玄德', '蜀汉昭烈帝', '刘皇叔'],
  },
}

// ========== 事件 ==========
const EVT_BASE = {
  location: {},
  is_inferred: false,
  source: '三国志',
  created_at: NOW,
  updated_at: NOW,
}

export const MOCK_EVENTS = [
  {
    id: UUIDS.EVT_SGML,
    title: "三顾茅庐",
    description: "刘备三次前往隆中拜访诸葛亮，恳请其出山辅佐。",
    start_date: "0207-01-01T00:00:00Z",
    end_date: "0207-01-01T00:00:00Z",
    display_time: "建安十二年（公元207年）",
    time_type: "POINT",
    sort_date: "0207-01-01T00:00:00Z",
    granularity: "YEAR",
    event_type: "CAREER",
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_LZD,
    title: "隆中对",
    description: '诸葛亮在隆中为刘备分析天下形势，提出"先取荆州为家，再取益州成鼎足之势，然后图中原"的战略规划。',
    start_date: "0207-01-01T00:00:00Z",
    end_date: "0207-12-01T00:00:00Z",
    display_time: "建安十二年（公元207年）",
    time_type: "POINT",
    sort_date: "0207-06-01T00:00:00Z",
    granularity: "YEAR",
    event_type: "CAREER",
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_CBZZ,
    title: "赤壁之战",
    description:
      "孙刘联军在赤壁以少胜多，大破曹操大军。诸葛亮与周瑜共同策划，利用火攻战术。",
    start_date: "0208-10-01T00:00:00Z",
    end_date: "0208-11-01T00:00:00Z",
    display_time: "建安十三年（公元208年）冬",
    time_type: "POINT",
    sort_date: "0208-10-01T00:00:00Z",
    granularity: "MONTH",
    event_type: "HISTORICAL",
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_JJZ,
    title: "借荆州",
    description: "赤壁之战后，诸葛亮建议刘备趁机占据荆州。后孙权多次索要未果。",
    start_date: "0209-01-01T00:00:00Z",
    end_date: "0210-12-01T00:00:00Z",
    display_time: "建安十四至十五年（公元209-210年）",
    time_type: "POINT",
    sort_date: "0209-01-01T00:00:00Z",
    granularity: "YEAR",
    event_type: "CAREER",
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_PDNZ,
    title: "平定南中",
    description: "诸葛亮亲率大军南征，七擒孟获，平定南中叛乱，巩固蜀汉后方。",
    start_date: "0225-03-01T00:00:00Z",
    end_date: "0225-12-01T00:00:00Z",
    display_time: "建兴三年（公元225年）",
    time_type: "POINT",
    sort_date: "0225-06-01T00:00:00Z",
    granularity: "YEAR",
    event_type: "HISTORICAL",
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_BF,
    title: "北伐",
    description:
      "诸葛亮率军五次北伐中原，意图恢复汉室。虽未成功，但充分展现了其军事才能。",
    start_date: "0228-01-01T00:00:00Z",
    end_date: "0234-08-01T00:00:00Z",
    display_time: "建兴六年至十二年（公元228-234年）",
    time_type: "POINT",
    sort_date: "0228-01-01T00:00:00Z",
    granularity: "YEAR",
    event_type: "HISTORICAL",
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_KCJ,
    title: "空城计",
    description:
      "街亭失守后，司马懿大军兵临西城。诸葛亮大开城门，以空城之计吓退司马懿。",
    start_date: "0228-05-01T00:00:00Z",
    end_date: "0228-05-01T00:00:00Z",
    display_time: "建兴六年（公元228年）",
    time_type: "POINT",
    sort_date: "0228-05-01T00:00:00Z",
    granularity: "YEAR",
    event_type: "HISTORICAL",
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_ZSZJ,
    title: "挥泪斩马谡",
    description:
      "马谡违反军令导致街亭失守，诸葛亮虽爱惜其才，但为严明军纪，挥泪将其处斩。",
    start_date: "0228-06-01T00:00:00Z",
    end_date: "0228-06-01T00:00:00Z",
    display_time: "建兴六年（公元228年）夏",
    time_type: "POINT",
    sort_date: "0228-06-01T00:00:00Z",
    granularity: "YEAR",
    event_type: "CAREER",
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_CSS,
    title: "出师表",
    description:
      '诸葛亮在北伐前上呈《出师表》于后主刘禅，陈述北伐的必要性，表达对蜀汉的忠心。"鞠躬尽瘁，死而后已"即出于此。',
    start_date: "0227-03-01T00:00:00Z",
    end_date: "0227-03-01T00:00:00Z",
    display_time: "建兴五年（公元227年）",
    time_type: "POINT",
    sort_date: "0227-03-01T00:00:00Z",
    granularity: "YEAR",
    event_type: "CREATION",
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_MNLN,
    title: "木牛流马",
    description:
      "诸葛亮为提高北伐后勤运输效率，发明木牛和流马两种运输工具，极大地改善了蜀军的补给能力。",
    start_date: "0230-01-01T00:00:00Z",
    end_date: "0231-06-01T00:00:00Z",
    display_time: "建兴八至九年（公元230-231年）",
    time_type: "POINT",
    sort_date: "0230-06-01T00:00:00Z",
    granularity: "YEAR",
    event_type: "CREATION",
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_WZY,
    title: "五丈原",
    description:
      "诸葛亮最后一次北伐时，在五丈原病逝，享年五十四岁。出师未捷身先死，长使英雄泪满襟。",
    start_date: "0234-08-01T00:00:00Z",
    end_date: "0234-10-08T00:00:00Z",
    display_time: "建兴十二年（公元234年）秋",
    time_type: "POINT",
    sort_date: "0234-09-01T00:00:00Z",
    granularity: "MONTH",
    event_type: "CAREER",
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_GZDZ,
    title: "官渡之战",
    description: "曹操与袁绍在官渡决战，以少胜多，奠定了统一北方的基础。",
    start_date: "0200-08-01T00:00:00Z",
    end_date: "0200-10-01T00:00:00Z",
    display_time: "建安五年（公元200年）",
    time_type: "POINT",
    sort_date: "0200-09-01T00:00:00Z",
    granularity: "MONTH",
    event_type: "HISTORICAL",
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_CCDTH,
    title: "曹操病逝",
    description: "曹操在洛阳病逝，享年六十六岁。临终前嘱咐丧事从简。",
    start_date: "0220-03-15T00:00:00Z",
    end_date: "0220-03-15T00:00:00Z",
    display_time: "建安二十五年（公元220年）",
    time_type: "POINT",
    sort_date: "0220-03-15T00:00:00Z",
    granularity: "YEAR",
    event_type: "DEATH",
    ...EVT_BASE,
  },
];

// ========== 人物-事件关联 ==========
export const MOCK_PERSON_EVENTS: Record<string, any[]> = {
  [UUIDS.ZGL]: [
    { id: UUIDS.PE_ZGL_SGML, event_id: UUIDS.EVT_SGML, title: '三顾茅庐', personal_title: null, role: '被访者', sort_order: 1, start_date: '0207-01-01T00:00:00Z', end_date: '0207-01-01T00:00:00Z', time_type: 'POINT', event_type: 'CAREER' },
    { id: UUIDS.PE_ZGL_LZD, event_id: UUIDS.EVT_LZD, title: '隆中对', personal_title: '隆中献策', role: '献策者', sort_order: 2, start_date: '0207-01-01T00:00:00Z', end_date: '0207-12-01T00:00:00Z', time_type: 'PERIOD', event_type: 'CAREER' },
    { id: UUIDS.PE_ZGL_CBZZ, event_id: UUIDS.EVT_CBZZ, title: '赤壁之战', personal_title: null, role: '联军军师', sort_order: 3, start_date: '0208-10-01T00:00:00Z', end_date: '0208-11-01T00:00:00Z', time_type: 'PERIOD', event_type: 'HISTORICAL' },
    { id: UUIDS.PE_ZGL_JJZ, event_id: UUIDS.EVT_JJZ, title: '借荆州', personal_title: null, role: '策划者', sort_order: 4, start_date: '0209-01-01T00:00:00Z', end_date: '0210-12-01T00:00:00Z', time_type: 'PERIOD', event_type: 'CAREER' },
    { id: UUIDS.PE_ZGL_PDNZ, event_id: UUIDS.EVT_PDNZ, title: '平定南中', personal_title: null, role: '统帅', sort_order: 5, start_date: '0225-03-01T00:00:00Z', end_date: '0225-12-01T00:00:00Z', time_type: 'PERIOD', event_type: 'HISTORICAL' },
    { id: UUIDS.PE_ZGL_BF, event_id: UUIDS.EVT_BF, title: '北伐中原', personal_title: '五次北伐', role: '统帅', sort_order: 6, start_date: '0228-01-01T00:00:00Z', end_date: '0234-08-01T00:00:00Z', time_type: 'PERIOD', event_type: 'HISTORICAL' },
    { id: UUIDS.PE_ZGL_KCJ, event_id: UUIDS.EVT_KCJ, title: '空城计', personal_title: null, role: '设计者', sort_order: 7, start_date: '0228-05-01T00:00:00Z', end_date: '0228-05-01T00:00:00Z', time_type: 'POINT', event_type: 'HISTORICAL' },
    { id: UUIDS.PE_ZGL_ZSZJ, event_id: UUIDS.EVT_ZSZJ, title: '挥泪斩马谡', personal_title: null, role: '执法者', sort_order: 8, start_date: '0228-06-01T00:00:00Z', end_date: '0228-06-01T00:00:00Z', time_type: 'POINT', event_type: 'CAREER' },
    { id: UUIDS.PE_ZGL_CSS, event_id: UUIDS.EVT_CSS, title: '出师表', personal_title: null, role: '作者', sort_order: 9, start_date: '0227-03-01T00:00:00Z', end_date: '0227-03-01T00:00:00Z', time_type: 'POINT', event_type: 'CREATION' },
    { id: UUIDS.PE_ZGL_MNLN, event_id: UUIDS.EVT_MNLN, title: '木牛流马', personal_title: null, role: '发明者', sort_order: 10, start_date: '0230-01-01T00:00:00Z', end_date: '0231-06-01T00:00:00Z', time_type: 'PERIOD', event_type: 'CREATION' },
    { id: UUIDS.PE_ZGL_WZY, event_id: UUIDS.EVT_WZY, title: '五丈原', personal_title: '病逝五丈原', role: '主角', sort_order: 11, start_date: '0234-08-01T00:00:00Z', end_date: '0234-10-08T00:00:00Z', time_type: 'PERIOD', event_type: 'CAREER' },
  ],
  [UUIDS.CC]: [
    { id: UUIDS.PE_CC_GZDZ, event_id: UUIDS.EVT_GZDZ, title: '官渡之战', personal_title: null, role: '统帅', sort_order: 1, start_date: '0200-08-01T00:00:00Z', end_date: '0200-10-01T00:00:00Z', time_type: 'PERIOD', event_type: 'HISTORICAL' },
  ],
  [UUIDS.LB]: [],
}

// ========== 传记文本 ==========
export const MOCK_BIOGRAPHIES: Record<string, any[]> = {
  [UUIDS.ZGL]: [
    { id: UUIDS.BIO_01, source_file: '三国志_诸葛亮传.txt', text_length: 12850, created_at: '2026-04-15T10:30:00Z' },
    { id: UUIDS.BIO_02, source_file: '出师表原文.txt', text_length: 3240, created_at: '2026-04-20T14:00:00Z' },
  ],
  [UUIDS.CC]: [],
  [UUIDS.LB]: [],
}

// ========== 工具：分页包裹 ==========
export function paginate<T>(items: T[], page = 1, pageSize = 20) {
  const total = items.length
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    page_size: pageSize,
  }
}
