/**
 * 模拟数据 — 三国人物传记数据
 * 使用固定 UUID 保证关联关系一致
 */

// ========== UUID 常量 ==========
export const UUIDS = {
  ZGL: 'a1b2c3d4-0001-4000-8000-000000000001',  // 诸葛亮
  CC: 'a1b2c3d4-0002-4000-8000-000000000002',    // 曹操
  LB: 'a1b2c3d4-0003-4000-8000-000000000003',    // 刘备
  SZ: 'a1b2c3d4-0004-4000-8000-000000000004',    // 孙权
  SMY: 'a1b2c3d4-0005-4000-8000-000000000005',   // 司马懿
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
  EVT_LBBIRTH: 'a1b2c3d4-0023-4000-8000-000000000023',   // 刘备出生
  EVT_LBDTH: 'a1b2c3d4-0024-4000-8000-000000000024',     // 刘备逝世
  EVT_ZGL_BIRTH: 'a1b2c3d4-0031-4000-8000-000000000031', // 诸葛亮出生
  EVT_ZGL_DEATH: 'a1b2c3d4-0032-4000-8000-000000000032', // 诸葛亮逝世
  EVT_CC_BIRTH: 'a1b2c3d4-0033-4000-8000-000000000033',  // 曹操出生
  EVT_TYJY: 'a1b2c3d4-0025-4000-8000-000000000025',   // 桃园结义
  EVT_RZYZ: 'a1b2c3d4-0026-4000-8000-000000000026',   // 入主益州
  EVT_CD: 'a1b2c3d4-0027-4000-8000-000000000027',     // 刘备称帝
  EVT_YLZ: 'a1b2c3d4-0028-4000-8000-000000000028',    // 夷陵之战
  EVT_BDCTG: 'a1b2c3d4-0029-4000-8000-000000000029',  // 白帝城托孤
  EVT_CBZZ_CC: 'a1b2c3d4-0030-4000-8000-000000000030', // 赤壁之战（曹操视角）
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
  PE_CC_CBZZ: 'b1b2c3d4-0030-4000-8000-000000000030',
  PE_CC_CCDTH: 'b1b2c3d4-0032-4000-8000-000000000032',
  PE_LB_TYJY: 'b1b2c3d4-0025-4000-8000-000000000025',
  PE_LB_SGML: 'b1b2c3d4-0026-4000-8000-000000000026',
  PE_LB_RZYZ: 'b1b2c3d4-0027-4000-8000-000000000027',
  PE_LB_CD: 'b1b2c3d4-0028-4000-8000-000000000028',
  PE_LB_YLZ: 'b1b2c3d4-0029-4000-8000-000000000029',
  PE_LB_BDCTG: 'b1b2c3d4-0031-4000-8000-000000000031',
  PE_ZGL_BIRTH: 'b1b2c3d4-0033-4000-8000-000000000033',
  PE_ZGL_DEATH: 'b1b2c3d4-0034-4000-8000-000000000034',
  PE_LB_BIRTH: 'b1b2c3d4-0035-4000-8000-000000000035',
  PE_LB_DEATH: 'b1b2c3d4-0036-4000-8000-000000000036',
  PE_CC_BIRTH: 'b1b2c3d4-0037-4000-8000-000000000037',
  BIO_01: 'c1b2c3d4-0001-4000-8000-000000000001',
  BIO_02: 'c1b2c3d4-0002-4000-8000-000000000002',
} as const

const NOW = new Date().toISOString()

// ========== 人物 ==========
export const MOCK_PERSONS = [
  {
    id: UUIDS.ZGL,
    name: '诸葛亮',
    birth_date: '181-01-01T00:00:00Z',
    death_date: '234-10-08T00:00:00Z',
    birth_display: '东汉光和四年（公元181年）',
    death_display: '蜀汉建兴十二年（公元234年）',
    avatar_url: null,
    summary: '字孔明，号卧龙，三国时期蜀汉丞相，杰出的政治家、军事家、文学家、发明家。辅佐刘备建立蜀汉政权，后受命托孤，尽心竭力辅佐后主刘禅。',
    status: 'published',
    event_count: 13,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: UUIDS.CC,
    name: '曹操',
    birth_date: '155-01-01T00:00:00Z',
    death_date: '220-03-15T00:00:00Z',
    birth_display: '东汉永寿元年（公元155年）',
    death_display: '东汉建安二十五年（公元220年）',
    avatar_url: null,
    summary: '字孟德，东汉末年杰出的政治家、军事家、文学家，曹魏政权的奠基人。以"挟天子以令诸侯"的策略统一北方。',
    status: 'published',
    event_count: 4,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: UUIDS.LB,
    name: '刘备',
    birth_date: '161-01-01T00:00:00Z',
    death_date: '223-06-10T00:00:00Z',
    birth_display: '东汉延熹四年（公元161年）',
    death_display: '蜀汉章武三年（公元223年）',
    avatar_url: null,
    summary: '字玄德，三国时期蜀汉开国皇帝。以仁德著称，三顾茅庐请诸葛亮出山，建立蜀汉政权。',
    status: 'published',
    event_count: 8,
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
    start_date: "207-01-01 00:00:00",
    end_date: "207-01-01 00:00:00",
    display_time: "建安十二年（公元207年）",
    time_type: "POINT",
    sort_date: "207-01-01 00:00:00",
    granularity: "YEAR",
    event_type: "CAREER",
    persons: ["诸葛亮", "刘备"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_LZD,
    title: "隆中对",
    description:
      '诸葛亮在隆中为刘备分析天下形势，提出"先取荆州为家，再取益州成鼎足之势，然后图中原"的战略规划。',
    start_date: "207-01-01 00:00:00",
    end_date: "207-12-01 00:00:00",
    display_time: "建安十二年（公元207年）",
    time_type: "POINT",
    sort_date: "207-06-01 00:00:00",
    granularity: "YEAR",
    event_type: "CAREER",
    persons: ["诸葛亮", "刘备"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_CBZZ,
    title: "赤壁之战",
    description:
      "孙刘联军在赤壁以少胜多，大破曹操大军。诸葛亮与周瑜共同策划，利用火攻战术。",
    start_date: "208-10-01 00:00:00",
    end_date: "208-11-01 00:00:00",
    display_time: "建安十三年（公元208年）冬",
    time_type: "POINT",
    sort_date: "208-10-01 00:00:00",
    granularity: "MONTH",
    event_type: "HISTORICAL",
    persons: ["诸葛亮", "刘备", "曹操"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_JJZ,
    title: "借荆州",
    description: "赤壁之战后，诸葛亮建议刘备趁机占据荆州。后孙权多次索要未果。",
    start_date: "209-01-01 00:00:00",
    end_date: "210-12-01 00:00:00",
    display_time: "建安十四至十五年（公元209-210年）",
    time_type: "POINT",
    sort_date: "209-01-01 00:00:00",
    granularity: "YEAR",
    event_type: "CAREER",
    persons: ["诸葛亮", "刘备", "孙权"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_PDNZ,
    title: "平定南中",
    description: "诸葛亮亲率大军南征，七擒孟获，平定南中叛乱，巩固蜀汉后方。",
    start_date: "225-03-01 00:00:00",
    end_date: "225-12-01 00:00:00",
    display_time: "建兴三年（公元225年）",
    time_type: "POINT",
    sort_date: "225-06-01 00:00:00",
    granularity: "YEAR",
    persons: ["诸葛亮"],
    event_type: "HISTORICAL",
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_BF,
    title: "北伐",
    description:
      "诸葛亮率军五次北伐中原，意图恢复汉室。虽未成功，但充分展现了其军事才能。",
    start_date: "228-01-01 00:00:00",
    end_date: "234-08-01 00:00:00",
    display_time: "建兴六年至十二年（公元228-234年）",
    time_type: "POINT",
    sort_date: "228-01-01 00:00:00",
    granularity: "YEAR",
    persons: ["诸葛亮"],
    event_type: "HISTORICAL",
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_KCJ,
    title: "空城计",
    description:
      "街亭失守后，司马懿大军兵临西城。诸葛亮大开城门，以空城之计吓退司马懿。",
    start_date: "228-05-01 00:00:00",
    end_date: "228-05-01 00:00:00",
    display_time: "建兴六年（公元228年）",
    time_type: "POINT",
    sort_date: "228-05-01 00:00:00",
    granularity: "YEAR",
    persons: ["诸葛亮", "司马懿"],
    event_type: "HISTORICAL",
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_ZSZJ,
    title: "挥泪斩马谡",
    description:
      "马谡违反军令导致街亭失守，诸葛亮虽爱惜其才，但为严明军纪，挥泪将其处斩。",
    start_date: "228-06-01 00:00:00",
    end_date: "228-06-01 00:00:00",
    display_time: "建兴六年（公元228年）夏",
    time_type: "POINT",
    sort_date: "228-06-01 00:00:00",
    granularity: "YEAR",
    event_type: "CAREER",
    persons: ["诸葛亮"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_CSS,
    title: "出师表",
    description:
      '诸葛亮在北伐前上呈《出师表》于后主刘禅，陈述北伐的必要性，表达对蜀汉的忠心。"鞠躬尽瘁，死而后已"即出于此。',
    start_date: "227-03-01 00:00:00",
    end_date: "227-03-01 00:00:00",
    display_time: "建兴五年（公元227年）",
    time_type: "POINT",
    sort_date: "227-03-01 00:00:00",
    granularity: "YEAR",
    event_type: "CREATION",
    persons: ["诸葛亮"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_MNLN,
    title: "木牛流马",
    description:
      "诸葛亮为提高北伐后勤运输效率，发明木牛和流马两种运输工具，极大地改善了蜀军的补给能力。",
    start_date: "230-01-01 00:00:00",
    end_date: "231-06-01 00:00:00",
    display_time: "建兴八至九年（公元230-231年）",
    time_type: "POINT",
    sort_date: "230-06-01 00:00:00",
    granularity: "YEAR",
    event_type: "CREATION",
    persons: ["诸葛亮"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_WZY,
    title: "五丈原",
    description:
      "诸葛亮最后一次北伐时，在五丈原病逝，享年五十四岁。出师未捷身先死，长使英雄泪满襟。",
    start_date: "234-08-01 00:00:00",
    end_date: "234-10-08 00:00:00",
    display_time: "建兴十二年（公元234年）秋",
    time_type: "POINT",
    sort_date: "234-09-01 00:00:00",
    granularity: "MONTH",
    event_type: "CAREER",
    persons: ["诸葛亮"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_GZDZ,
    title: "官渡之战",
    description: "曹操与袁绍在官渡决战，以少胜多，奠定了统一北方的基础。",
    start_date: "200-08-01 00:00:00",
    end_date: "200-10-01 00:00:00",
    display_time: "建安五年（公元200年）",
    time_type: "POINT",
    sort_date: "200-09-01 00:00:00",
    granularity: "MONTH",
    event_type: "HISTORICAL",
    persons: ["袁绍", "曹操"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_CCDTH,
    title: "曹操病逝",
    description: "曹操在洛阳病逝，享年六十六岁。临终前嘱咐丧事从简。",
    start_date: "220-03-15 00:00:00",
    end_date: "220-03-15 00:00:00",
    display_time: "建安二十五年（公元220年）",
    time_type: "POINT",
    sort_date: "220-03-15 00:00:00",
    granularity: "YEAR",
    event_type: "DEATH",
    persons: ["曹操"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_TYJY,
    title: "桃园结义",
    description:
      "刘备、关羽、张飞在桃园结为异姓兄弟，誓言「不求同年同月同日生，但求同年同月同日死」。",
    start_date: "184-01-01 00:00:00",
    end_date: "184-01-01 00:00:00",
    display_time: "东汉中平元年（公元184年）",
    time_type: "POINT",
    sort_date: "184-01-01 00:00:00",
    granularity: "YEAR",
    event_type: "HISTORICAL",
    persons: ["刘备", "关羽", "张飞"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_RZYZ,
    title: "入主益州",
    description: "刘备应刘璋之邀入蜀，后夺取益州，奠定蜀汉基业。",
    start_date: "211-01-01 00:00:00",
    end_date: "214-12-01 00:00:00",
    display_time: "建安十六至十九年（公元211-214年）",
    time_type: "PERIOD",
    sort_date: "214-06-01 00:00:00",
    granularity: "YEAR",
    event_type: "HISTORICAL",
    persons: ["刘备"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_CD,
    title: "刘备称帝",
    description: "刘备在成都称帝，国号汉（史称蜀汉），年号章武。",
    start_date: "221-04-01 00:00:00",
    end_date: "221-04-01 00:00:00",
    display_time: "蜀汉章武元年（公元221年）",
    time_type: "POINT",
    sort_date: "221-04-01 00:00:00",
    granularity: "YEAR",
    event_type: "CAREER",
    persons: ["刘备"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_YLZ,
    title: "夷陵之战",
    description:
      "刘备为关羽报仇，亲率大军东征孙吴。陆逊火烧连营七百里，刘备大败。",
    start_date: "222-01-01 00:00:00",
    end_date: "222-08-01 00:00:00",
    display_time: "章武二年（公元222年）",
    time_type: "POINT",
    sort_date: "222-06-01 00:00:00",
    granularity: "MONTH",
    event_type: "HISTORICAL",
    persons: ["刘备", "陆逊"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_BDCTG,
    title: "白帝城托孤",
    description:
      "刘备病危，在白帝城将刘禅和蜀汉江山托付给诸葛亮。嘱咐「如其不才，君可自取」。",
    start_date: "223-04-01 00:00:00",
    end_date: "223-06-10 00:00:00",
    display_time: "章武三年（公元223年）",
    time_type: "POINT",
    sort_date: "223-05-01 00:00:00",
    granularity: "MONTH",
    event_type: "CAREER",
    persons: ["刘备", "诸葛亮"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_CBZZ_CC,
    title: "赤壁之战",
    description:
      "曹操率大军南征，在赤壁遭遇孙刘联军火攻，大败北归。此战奠定了三国鼎立的基础。",
    start_date: "208-10-01 00:00:00",
    end_date: "208-11-01 00:00:00",
    display_time: "建安十三年（公元208年）冬",
    time_type: "POINT",
    sort_date: "208-10-01 00:00:00",
    granularity: "MONTH",
    event_type: "HISTORICAL",
    persons: ["曹操", "诸葛亮", "刘备"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_ZGL_BIRTH,
    title: "诸葛亮出生",
    description: "诸葛亮出生于琅琊郡阳都县（今山东临沂）。",
    start_date: "181-01-01 00:00:00",
    end_date: "181-01-01 00:00:00",
    display_time: "东汉光和四年（公元181年）",
    time_type: "POINT",
    sort_date: "181-01-01 00:00:00",
    granularity: "YEAR",
    event_type: "BIRTH",
    persons: ["诸葛亮"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_ZGL_DEATH,
    title: "诸葛亮逝世",
    description: "诸葛亮于五丈原病逝，享年五十四岁。",
    start_date: "234-10-08 00:00:00",
    end_date: "234-10-08 00:00:00",
    display_time: "建兴十二年（公元234年）秋",
    time_type: "POINT",
    sort_date: "234-10-08 00:00:00",
    granularity: "DAY",
    event_type: "DEATH",
    persons: ["诸葛亮"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_LBBIRTH,
    title: "刘备出生",
    description: "刘备出生于涿郡涿县（今河北涿州）。",
    start_date: "161-01-01 00:00:00",
    end_date: "161-01-01 00:00:00",
    display_time: "东汉延熹四年（公元161年）",
    time_type: "POINT",
    sort_date: "161-01-01 00:00:00",
    granularity: "YEAR",
    event_type: "BIRTH",
    persons: ["刘备"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_LBDTH,
    title: "刘备逝世",
    description: "刘备病逝于白帝城，享年六十三岁。临终托孤于诸葛亮。",
    start_date: "223-06-10 00:00:00",
    end_date: "223-06-10 00:00:00",
    display_time: "章武三年（公元223年）",
    time_type: "POINT",
    sort_date: "223-06-10 00:00:00",
    granularity: "DAY",
    event_type: "DEATH",
    persons: ["刘备"],
    ...EVT_BASE,
  },
  {
    id: UUIDS.EVT_CC_BIRTH,
    title: "曹操出生",
    description: "曹操出生于沛国谯县（今安徽亳州）。",
    start_date: "155-01-01 00:00:00",
    end_date: "155-01-01 00:00:00",
    display_time: "东汉永寿元年（公元155年）",
    time_type: "POINT",
    sort_date: "155-01-01 00:00:00",
    granularity: "YEAR",
    event_type: "BIRTH",
    persons: ["曹操"],
    ...EVT_BASE,
  },
];

// ========== 人物-事件关联 ==========
export const MOCK_PERSON_EVENTS: Record<string, any[]> = {
  [UUIDS.ZGL]: [
    { id: UUIDS.PE_ZGL_BIRTH, event_id: UUIDS.EVT_ZGL_BIRTH, title: '诸葛亮出生', personal_title: null, role: null, sort_order: 0, start_date: '181-01-01 00:00:00', end_date: '181-01-01 00:00:00', time_type: 'POINT', event_type: 'BIRTH', persons: ['诸葛亮'], person_ids: [UUIDS.ZGL] },
    { id: UUIDS.PE_ZGL_SGML, event_id: UUIDS.EVT_SGML, title: '三顾茅庐', personal_title: null, role: '被访者', sort_order: 1, start_date: '207-01-01 00:00:00', end_date: '207-01-01 00:00:00', time_type: 'POINT', event_type: 'CAREER', persons: ['诸葛亮', '刘备'], person_ids: [UUIDS.ZGL, UUIDS.LB] },
    { id: UUIDS.PE_ZGL_LZD, event_id: UUIDS.EVT_LZD, title: '隆中对', personal_title: '隆中献策', role: '献策者', sort_order: 2, start_date: '207-01-01 00:00:00', end_date: '207-12-01 00:00:00', time_type: 'PERIOD', event_type: 'CAREER', persons: ['诸葛亮', '刘备'], person_ids: [UUIDS.ZGL, UUIDS.LB] },
    { id: UUIDS.PE_ZGL_CBZZ, event_id: UUIDS.EVT_CBZZ, title: '赤壁之战', personal_title: null, role: '联军军师', sort_order: 3, start_date: '208-10-01 00:00:00', end_date: '208-11-01 00:00:00', time_type: 'PERIOD', event_type: 'HISTORICAL', persons: ['诸葛亮', '刘备', '曹操'], person_ids: [UUIDS.ZGL, UUIDS.LB, UUIDS.CC] },
    { id: UUIDS.PE_ZGL_JJZ, event_id: UUIDS.EVT_JJZ, title: '借荆州', personal_title: null, role: '策划者', sort_order: 4, start_date: '209-01-01 00:00:00', end_date: '210-12-01 00:00:00', time_type: 'PERIOD', event_type: 'CAREER', persons: ['诸葛亮', '刘备', '孙权'], person_ids: [UUIDS.ZGL, UUIDS.LB, UUIDS.SZ] },
    { id: UUIDS.PE_ZGL_PDNZ, event_id: UUIDS.EVT_PDNZ, title: '平定南中', personal_title: null, role: '统帅', sort_order: 5, start_date: '225-03-01 00:00:00', end_date: '225-12-01 00:00:00', time_type: 'PERIOD', event_type: 'HISTORICAL', persons: ['诸葛亮'], person_ids: [UUIDS.ZGL] },
    { id: UUIDS.PE_ZGL_BF, event_id: UUIDS.EVT_BF, title: '北伐中原', personal_title: '五次北伐', role: '统帅', sort_order: 6, start_date: '228-01-01 00:00:00', end_date: '234-08-01 00:00:00', time_type: 'PERIOD', event_type: 'HISTORICAL', persons: ['诸葛亮'], person_ids: [UUIDS.ZGL] },
    { id: UUIDS.PE_ZGL_KCJ, event_id: UUIDS.EVT_KCJ, title: '空城计', personal_title: null, role: '设计者', sort_order: 7, start_date: '228-05-01 00:00:00', end_date: '228-05-01 00:00:00Z', time_type: 'POINT', event_type: 'HISTORICAL', persons: ['诸葛亮', '司马懿'], person_ids: [UUIDS.ZGL, UUIDS.SMY] },
    { id: UUIDS.PE_ZGL_ZSZJ, event_id: UUIDS.EVT_ZSZJ, title: '挥泪斩马谡', personal_title: null, role: '执法者', sort_order: 8, start_date: '228-06-01 00:00:00', end_date: '228-06-01 00:00:00', time_type: 'POINT', event_type: 'CAREER', persons: ['诸葛亮'], person_ids: [UUIDS.ZGL] },
    { id: UUIDS.PE_ZGL_CSS, event_id: UUIDS.EVT_CSS, title: '出师表', personal_title: null, role: '作者', sort_order: 9, start_date: '227-03-01 00:00:00', end_date: '227-03-01 00:00:00', time_type: 'POINT', event_type: 'CREATION', persons: ['诸葛亮'], person_ids: [UUIDS.ZGL] },
    { id: UUIDS.PE_ZGL_MNLN, event_id: UUIDS.EVT_MNLN, title: '木牛流马', personal_title: null, role: '发明者', sort_order: 10, start_date: '230-01-01 00:00:00', end_date: '231-06-01 00:00:00', time_type: 'PERIOD', event_type: 'CREATION', persons: ['诸葛亮'], person_ids: [UUIDS.ZGL] },
    { id: UUIDS.PE_ZGL_WZY, event_id: UUIDS.EVT_WZY, title: '五丈原', personal_title: '病逝五丈原', role: '主角', sort_order: 11, start_date: '234-08-01 00:00:00', end_date: '234-10-08 00:00:00', time_type: 'PERIOD', event_type: 'CAREER', persons: ['诸葛亮'], person_ids: [UUIDS.ZGL] },
    { id: UUIDS.PE_ZGL_DEATH, event_id: UUIDS.EVT_ZGL_DEATH, title: '诸葛亮逝世', personal_title: null, role: null, sort_order: 12, start_date: '234-10-08 00:00:00', end_date: '234-10-08 00:00:00', time_type: 'POINT', event_type: 'DEATH', persons: ['诸葛亮'], person_ids: [UUIDS.ZGL] },
  ],
  [UUIDS.CC]: [
    { id: UUIDS.PE_CC_BIRTH, event_id: UUIDS.EVT_CC_BIRTH, title: '曹操出生', personal_title: null, role: null, sort_order: 0, start_date: '155-01-01 00:00:00', end_date: '155-01-01 00:00:00', time_type: 'POINT', event_type: 'BIRTH', persons: ['曹操'], person_ids: [UUIDS.CC] },
    { id: UUIDS.PE_CC_GZDZ, event_id: UUIDS.EVT_GZDZ, title: '官渡之战', personal_title: null, role: '统帅', sort_order: 1, start_date: '200-08-01 00:00:00', end_date: '200-10-01 00:00:00', time_type: 'PERIOD', event_type: 'HISTORICAL', persons: ['曹操'], person_ids: [UUIDS.CC] },
    { id: UUIDS.PE_CC_CBZZ, event_id: UUIDS.EVT_CBZZ, title: '赤壁之战', personal_title: '赤壁大败', role: '统帅', sort_order: 2, start_date: '208-10-01 00:00:00', end_date: '208-11-01 00:00:00', time_type: 'PERIOD', event_type: 'HISTORICAL', persons: ['诸葛亮', '刘备', '曹操'], person_ids: [UUIDS.ZGL, UUIDS.LB, UUIDS.CC] },
    { id: UUIDS.PE_CC_CCDTH, event_id: UUIDS.EVT_CCDTH, title: '曹操病逝', personal_title: null, role: '主角', sort_order: 3, start_date: '220-03-15 00:00:00', end_date: '220-03-15 00:00:00', time_type: 'POINT', event_type: 'DEATH', persons: ['曹操'], person_ids: [UUIDS.CC] },
  ],
  [UUIDS.LB]: [
    { id: UUIDS.PE_LB_BIRTH, event_id: UUIDS.EVT_LBBIRTH, title: '刘备出生', personal_title: null, role: null, sort_order: 0, start_date: '161-01-01 00:00:00', end_date: '161-01-01 00:00:00', time_type: 'POINT', event_type: 'BIRTH', persons: ['刘备'], person_ids: [UUIDS.LB] },
    { id: UUIDS.PE_LB_TYJY, event_id: UUIDS.EVT_TYJY, title: '桃园结义', personal_title: '桃园三结义', role: '结义兄长', sort_order: 1, start_date: '184-01-01 00:00:00', end_date: '184-01-01 00:00:00', time_type: 'POINT', event_type: 'HISTORICAL', persons: ['刘备'], person_ids: [UUIDS.LB] },
    { id: UUIDS.PE_LB_SGML, event_id: UUIDS.EVT_SGML, title: '三顾茅庐', personal_title: null, role: '拜访者', sort_order: 2, start_date: '207-01-01 00:00:00', end_date: '207-01-01 00:00:00', time_type: 'POINT', event_type: 'CAREER', persons: ['诸葛亮', '刘备'], person_ids: [UUIDS.ZGL, UUIDS.LB] },
    { id: UUIDS.PE_LB_RZYZ, event_id: UUIDS.EVT_RZYZ, title: '入主益州', personal_title: null, role: '君主', sort_order: 3, start_date: '211-01-01 00:00:00', end_date: '214-12-01 00:00:00', time_type: 'PERIOD', event_type: 'HISTORICAL', persons: ['刘备'], person_ids: [UUIDS.LB] },
    { id: UUIDS.PE_LB_CD, event_id: UUIDS.EVT_CD, title: '刘备称帝', personal_title: '登基称帝', role: '皇帝', sort_order: 4, start_date: '221-04-01 00:00:00', end_date: '221-04-01 00:00:00', time_type: 'POINT', event_type: 'CAREER', persons: ['刘备'], person_ids: [UUIDS.LB] },
    { id: UUIDS.PE_LB_YLZ, event_id: UUIDS.EVT_YLZ, title: '夷陵之战', personal_title: null, role: '统帅', sort_order: 5, start_date: '222-01-01 00:00:00', end_date: '222-08-01 00:00:00', time_type: 'PERIOD', event_type: 'HISTORICAL', persons: ['刘备'], person_ids: [UUIDS.LB] },
    { id: UUIDS.PE_LB_BDCTG, event_id: UUIDS.EVT_BDCTG, title: '白帝城托孤', personal_title: '白帝城托孤', role: '托孤者', sort_order: 6, start_date: '223-04-01 00:00:00', end_date: '223-06-10 00:00:00', time_type: 'PERIOD', event_type: 'CAREER', persons: ['诸葛亮', '刘备'], person_ids: [UUIDS.ZGL, UUIDS.LB] },
    { id: UUIDS.PE_LB_DEATH, event_id: UUIDS.EVT_LBDTH, title: '刘备逝世', personal_title: null, role: null, sort_order: 7, start_date: '223-06-10 00:00:00', end_date: '223-06-10 00:00:00', time_type: 'POINT', event_type: 'DEATH', persons: ['刘备'], person_ids: [UUIDS.LB] },
  ],
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
