import { useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  ConfigProvider,
  Empty,
  Form,
  Input,
  Layout,
  List,
  Segmented,
  Space,
  Tabs,
  Tag,
  Typography,
  message,
  theme,
} from 'antd';
import type { TabsProps } from 'antd';
import {
  MOCK_AGENTS,
  STATUS_LABELS,
  TIER_LABELS,
  type Agent,
  type KeyResult,
  type OkrStatus,
  type Tier,
} from './data/mockAgents';
import WeeklyReportsPage from './pages/WeeklyReportsPage';
import './styles.css';

const { Content, Sider } = Layout;
const { Text, Title } = Typography;
const { TextArea } = Input;

type TierFilter = 'all' | Tier;

interface WeeklyReport {
  id: string;
  agentId: string;
  content: string;
  submittedAt: string;
}

const tierColorMap: Record<Tier, string> = {
  main: 'blue',
  exploration: 'purple',
  life: 'green',
  infra: 'geekblue',
  'cross-cutting': 'volcano',
};

const statusColorMap: Record<OkrStatus, string> = {
  'on-track': '#1f9d55',
  'at-risk': '#d48806',
  behind: '#cf1322',
  completed: '#1677ff',
};

const statusTagMap: Record<OkrStatus, string> = {
  'on-track': 'success',
  'at-risk': 'warning',
  behind: 'error',
  completed: 'processing',
};

const tierOptions = [
  { label: 'All', value: 'all' },
  ...Object.entries(TIER_LABELS).map(([value, label]) => ({ value, label })),
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function clampPercent(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

function AgentListItem({
  agent,
  active,
  onSelect,
}: {
  agent: Agent;
  active: boolean;
  onSelect: (agent: Agent) => void;
}) {
  return (
    <List.Item
      className={active ? 'agent-list-item agent-list-item-active' : 'agent-list-item'}
      onClick={() => onSelect(agent)}
    >
      <List.Item.Meta
        avatar={<Avatar src={agent.avatar}>{initials(agent.name)}</Avatar>}
        title={
          <Space size={8} wrap>
            <span>{agent.name}</span>
            <Tag color={tierColorMap[agent.tier]}>{TIER_LABELS[agent.tier]}</Tag>
          </Space>
        }
        description={agent.role}
      />
    </List.Item>
  );
}

function OkrProgress({ kr }: { kr: KeyResult }) {
  const current = clampPercent(kr.current);
  const target = clampPercent(kr.target);
  const achievedWidth = Math.min(current, target || current);
  const targetGapWidth = Math.max(target - achievedWidth, 0);
  const remainingWidth = Math.max(100 - achievedWidth - targetGapWidth, 0);
  const overTargetWidth = Math.max(current - target, 0);
  const achievedColor = statusColorMap[kr.status];

  return (
    <div className="okr-progress">
      <div className="okr-progress-header">
        <Text strong>{kr.title}</Text>
        <Space size={8}>
          <Tag color={statusTagMap[kr.status]}>{STATUS_LABELS[kr.status]}</Tag>
          <Text type="secondary">
            {kr.current}/{kr.target}
          </Text>
        </Space>
      </div>
      <div
        aria-label={`${kr.title} 当前 ${kr.current}，目标 ${kr.target}`}
        className="okr-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={current}
      >
        <div
          className="okr-progress-achieved"
          style={{ width: `${achievedWidth}%`, background: achievedColor }}
        />
        {overTargetWidth > 0 ? (
          <div
            className="okr-progress-over-target"
            style={{ width: `${Math.min(overTargetWidth, remainingWidth)}%` }}
          />
        ) : null}
        <div className="okr-progress-target" style={{ width: `${targetGapWidth}%` }} />
        <div className="okr-progress-remaining" style={{ width: `${remainingWidth}%` }} />
        <span className="okr-progress-marker" style={{ left: `${target}%` }} />
      </div>
      <div className="okr-progress-scale">
        <Text type="secondary">achieved {kr.current}%</Text>
        <Text type="secondary">target {kr.target}%</Text>
      </div>
    </div>
  );
}

function OkrTab({ agent }: { agent: Agent }) {
  const okr = agent.currentOKR;

  return (
    <Card className="section-card" title={`${okr.quarter} OKR`}>
      <Space direction="vertical" size={18} className="full-width">
        <div>
          <Text type="secondary">Objective</Text>
          <Title level={4} className="objective-title">
            {okr.objective}
          </Title>
        </div>
        <Space direction="vertical" size={16} className="full-width">
          {okr.keyResults.map((kr) => (
            <OkrProgress key={kr.title} kr={kr} />
          ))}
        </Space>
      </Space>
    </Card>
  );
}

function WeeklyReportTab({
  agent,
  reports,
  onSubmit,
}: {
  agent: Agent;
  reports: WeeklyReport[];
  onSubmit: (content: string) => void;
}) {
  const [form] = Form.useForm<{ content: string }>();

  return (
    <Space direction="vertical" size={16} className="full-width">
      <Card className="section-card" title="提交周报">
        <Form
          form={form}
          layout="vertical"
          onFinish={({ content }) => {
            onSubmit(content.trim());
            form.resetFields();
          }}
        >
          <Form.Item
            name="content"
            rules={[
              { required: true, message: '请输入周报内容' },
              {
                validator: (_, value?: string) =>
                  value?.trim() ? Promise.resolve() : Promise.reject(new Error('请输入周报内容')),
              },
            ]}
          >
            <TextArea rows={6} placeholder={`${agent.name} 本周进展、风险、下周计划`} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form>
      </Card>

      <Card className="section-card" title="已提交周报">
        {reports.length ? (
          <List
            dataSource={reports}
            renderItem={(report) => (
              <List.Item>
                <List.Item.Meta
                  title={<Text type="secondary">{report.submittedAt}</Text>}
                  description={<span className="report-content">{report.content}</span>}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无周报" />
        )}
      </Card>
    </Space>
  );
}

function AgentDetail({
  agent,
  reports,
  onSubmitReport,
}: {
  agent: Agent;
  reports: WeeklyReport[];
  onSubmitReport: (agentId: string, content: string) => void;
}) {
  const items: TabsProps['items'] = [
    {
      key: 'okr',
      label: 'OKR',
      children: <OkrTab agent={agent} />,
    },
    {
      key: 'weekly-report',
      label: '周报',
      children: (
        <WeeklyReportTab
          agent={agent}
          reports={reports}
          onSubmit={(content) => onSubmitReport(agent.id, content)}
        />
      ),
    },
  ];

  return (
    <Space direction="vertical" size={18} className="detail-panel">
      <Card className="agent-summary">
        <Space align="center" size={16} wrap>
          <Avatar size={64} src={agent.avatar}>
            {initials(agent.name)}
          </Avatar>
          <div>
            <Space size={8} wrap>
              <Title level={3} className="agent-title">
                {agent.name}
              </Title>
              <Tag color={tierColorMap[agent.tier]}>{TIER_LABELS[agent.tier]}</Tag>
            </Space>
            <Text type="secondary">{agent.role}</Text>
          </div>
        </Space>
      </Card>
      <Tabs defaultActiveKey="okr" items={items} />
    </Space>
  );
}

function AgentKanbanView({
  onNavigateWeekly,
}: {
  onNavigateWeekly?: () => void;
}) {
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [selectedAgentId, setSelectedAgentId] = useState(MOCK_AGENTS[0]?.id);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  const filteredAgents = useMemo(
    () => MOCK_AGENTS.filter((agent) => tierFilter === 'all' || agent.tier === tierFilter),
    [tierFilter],
  );

  const selectedAgent = useMemo(() => {
    const currentVisible = filteredAgents.find((agent) => agent.id === selectedAgentId);
    return currentVisible ?? filteredAgents[0] ?? MOCK_AGENTS[0];
  }, [filteredAgents, selectedAgentId]);

  const selectedReports = weeklyReports.filter((report) => report.agentId === selectedAgent.id);

  function handleTierChange(value: TierFilter) {
    setTierFilter(value);
    const nextAgents = MOCK_AGENTS.filter((agent) => value === 'all' || agent.tier === value);
    if (!nextAgents.some((agent) => agent.id === selectedAgentId)) {
      setSelectedAgentId(nextAgents[0]?.id);
    }
  }

  function handleSubmitReport(agentId: string, content: string) {
    const report: WeeklyReport = {
      id: `${agentId}-${Date.now()}`,
      agentId,
      content,
      submittedAt: new Date().toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setWeeklyReports((current) => [report, ...current]);
    messageApi.success('周报已保存到当前页面状态');
  }

  return (
    <>
      {contextHolder}
      <Layout className="app-shell">
        <Sider width={360} theme="light" className="agent-sider">
          <Space direction="vertical" size={18} className="full-width">
            <div>
              <Title level={2} className="page-title">
                Agent 团队管理看板
              </Title>
              <Text type="secondary">MVP / mock YAML data in code</Text>
            </div>

            <Segmented
              block
              className="tier-filter"
              options={tierOptions}
              value={tierFilter}
              onChange={(value) => handleTierChange(value as TierFilter)}
            />

            <Button block type="dashed" onClick={onNavigateWeekly}>
              📋 周报系统
            </Button>

            <List
              className="agent-list"
              dataSource={filteredAgents}
              locale={{ emptyText: '没有匹配的 Agent' }}
              renderItem={(agent) => (
                <AgentListItem
                  agent={agent}
                  active={agent.id === selectedAgent.id}
                  onSelect={(nextAgent) => setSelectedAgentId(nextAgent.id)}
                />
              )}
            />
          </Space>
        </Sider>

        <Content className="content">
          {selectedAgent ? (
            <AgentDetail
              agent={selectedAgent}
              reports={selectedReports}
              onSubmitReport={handleSubmitReport}
            />
          ) : (
            <Empty description="请选择 Agent" />
          )}
        </Content>
      </Layout>
    </>
  );
}

export default function App() {
  const [page, setPage] = useState<'kanban' | 'weekly'>('kanban');

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          borderRadius: 6,
          colorPrimary: '#2563eb',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif, "Apple Color Emoji"',
        },
      }}
    >
      <div className="app-root">
        {/* Top Navigation */}
        <div className="app-nav">
          <Space size={0}>
            <Button
              type={page === 'kanban' ? 'primary' : 'text'}
              onClick={() => setPage('kanban')}
            >
              📊 管理看板
            </Button>
            <Button
              type={page === 'weekly' ? 'primary' : 'text'}
              onClick={() => setPage('weekly')}
            >
              📋 周报系统
            </Button>
          </Space>
        </div>

        {page === 'kanban' ? (
          <AgentKanbanView onNavigateWeekly={() => setPage('weekly')} />
        ) : (
          <WeeklyReportsPage onNavigateKanban={() => setPage('kanban')} />
        )}
      </div>
    </ConfigProvider>
  );
}
