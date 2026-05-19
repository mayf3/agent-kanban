export type Tier = 'main' | 'exploration' | 'life' | 'infra' | 'cross-cutting';

export type OkrStatus = 'on-track' | 'at-risk' | 'behind' | 'completed';

export interface KeyResult {
  title: string;
  current: number;
  target: number;
  status: OkrStatus;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  tier: Tier;
  avatar: string | null;
  currentOKR: {
    quarter: string;
    objective: string;
    keyResults: KeyResult[];
  };
}

export const TIER_LABELS: Record<Tier, string> = {
  main: 'Main',
  exploration: 'Exploration',
  life: 'Life',
  infra: 'Infra',
  'cross-cutting': 'Cross-cutting',
};

export const STATUS_LABELS: Record<OkrStatus, string> = {
  'on-track': 'on-track',
  'at-risk': 'at-risk',
  behind: 'behind',
  completed: 'completed',
};

export const MOCK_AGENTS: Agent[] = [
  {
    id: 'ceo-agent',
    name: 'CEO Agent',
    role: '首席执行官',
    tier: 'main',
    avatar: null,
    currentOKR: {
      quarter: '2026-Q2',
      objective: '提升团队整体产出效率 30%',
      keyResults: [
        { title: '完成 P0 需求交付率 >= 90%', current: 75, target: 90, status: 'at-risk' },
        { title: '建立自动化测试覆盖率达到 60%', current: 35, target: 60, status: 'behind' },
        { title: '团队技能提升计划执行率 100%', current: 90, target: 100, status: 'on-track' },
      ],
    },
  },
  {
    id: 'product-agent',
    name: 'Product Agent',
    role: '产品负责人',
    tier: 'main',
    avatar: null,
    currentOKR: {
      quarter: '2026-Q2',
      objective: '把需求发现到验收链路压缩到 5 天内',
      keyResults: [
        { title: '核心需求澄清一次通过率 >= 85%', current: 82, target: 85, status: 'on-track' },
        { title: '完成 12 个用户访谈样本沉淀', current: 9, target: 12, status: 'at-risk' },
        { title: 'PRD 变更返工率 <= 10%', current: 10, target: 10, status: 'completed' },
      ],
    },
  },
  {
    id: 'research-agent',
    name: 'Research Agent',
    role: '探索研究员',
    tier: 'exploration',
    avatar: null,
    currentOKR: {
      quarter: '2026-Q2',
      objective: '验证 3 个高潜 Agent 协作场景',
      keyResults: [
        { title: '完成 3 个可演示原型', current: 2, target: 3, status: 'at-risk' },
        { title: '产出探索报告 5 篇', current: 5, target: 5, status: 'completed' },
        { title: '沉淀评估样例 80 条', current: 48, target: 80, status: 'behind' },
      ],
    },
  },
  {
    id: 'user-life-agent',
    name: 'Life Agent',
    role: '用户生活助理',
    tier: 'life',
    avatar: null,
    currentOKR: {
      quarter: '2026-Q2',
      objective: '提升日程、提醒、生活任务的可依赖性',
      keyResults: [
        { title: '日程任务识别准确率 >= 92%', current: 88, target: 92, status: 'at-risk' },
        { title: '提醒履约延迟 P95 <= 2 分钟', current: 2, target: 2, status: 'completed' },
        { title: '覆盖 20 个常见生活工作流', current: 16, target: 20, status: 'on-track' },
      ],
    },
  },
  {
    id: 'platform-agent',
    name: 'Platform Agent',
    role: '平台基础设施',
    tier: 'infra',
    avatar: null,
    currentOKR: {
      quarter: '2026-Q2',
      objective: '建立稳定可观测的 Agent 运行底座',
      keyResults: [
        { title: '关键链路可观测覆盖率 >= 95%', current: 70, target: 95, status: 'behind' },
        { title: '任务执行失败自动恢复率 >= 80%', current: 66, target: 80, status: 'at-risk' },
        { title: '部署回滚时间 <= 10 分钟', current: 10, target: 10, status: 'completed' },
      ],
    },
  },
  {
    id: 'qa-agent',
    name: 'QA Agent',
    role: '质量保障',
    tier: 'cross-cutting',
    avatar: null,
    currentOKR: {
      quarter: '2026-Q2',
      objective: '降低跨团队交付缺陷和验收成本',
      keyResults: [
        { title: 'P0/P1 缺陷逃逸数 <= 3', current: 2, target: 3, status: 'on-track' },
        { title: '自动回归用例覆盖 120 条', current: 74, target: 120, status: 'behind' },
        { title: '每周风险巡检覆盖率 100%', current: 100, target: 100, status: 'completed' },
      ],
    },
  },
  {
    id: 'ops-agent',
    name: 'Ops Agent',
    role: '运营协同',
    tier: 'cross-cutting',
    avatar: null,
    currentOKR: {
      quarter: '2026-Q2',
      objective: '让团队节奏、周报和阻塞同步可追踪',
      keyResults: [
        { title: '周报提交率 >= 95%', current: 86, target: 95, status: 'at-risk' },
        { title: '阻塞项平均响应时间 <= 4 小时', current: 4, target: 4, status: 'completed' },
        { title: '维护 1 份月度复盘与行动清单', current: 1, target: 1, status: 'completed' },
      ],
    },
  },
];
