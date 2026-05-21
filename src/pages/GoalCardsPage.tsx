import { useEffect, useState } from 'react';
import {
  Avatar,
  Card,
  Col,
  Empty,
  Input,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Steps,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  getGoalCards,
  getGoalCardPipelines,
  type GoalCard,
  type MonthlyGoalGroup,
} from '../api/goals';

const { Text, Title, Paragraph } = Typography;

const pipelineColor: Record<string, string> = {
  main: '#1677ff',
  exploration: '#722ed1',
  life: '#52c41a',
  planning: '#fa8c16',
  devops: '#13c2c2',
  education: '#eb2f96',
  infra: '#2f54eb',
  cross_cutting: '#faad14',
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

function monthGoalPercent(group: MonthlyGoalGroup): number {
  if (!group.goals.length) return 0;
  const done = group.goals.filter(g => g.status === 'done').length;
  return Math.round((done / group.goals.length) * 100);
}

function GoalCardItem({ card }: { card: GoalCard }) {
  const stats = card.stats || { total: 0, done: 0, inProgress: 0 };
  const percent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const currentMonth = card.monthlyGoals?.[0];
  const prevMonth = card.monthlyGoals?.[1];

  return (
    <Card
      size="small"
      hoverable
      style={{ height: '100%' }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar src={card.agent.avatar} style={{ flexShrink: 0 }}>
            {initials(card.agent.displayName)}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text strong style={{ fontSize: 15 }}>{card.agent.displayName}</Text>
              <Tag color={pipelineColor[card.pipeline] || 'default'}>
                {card.pipeline}
              </Tag>
            </div>
            <Text type="secondary" ellipsis style={{ fontSize: 12, maxWidth: 260 }}>
              {card.longTermDirection?.slice(0, 60)}{card.longTermDirection?.length > 60 ? '...' : ''}
            </Text>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>目标进度</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{stats.done}/{stats.total} done</Text>
          </div>
          <Progress
            percent={percent}
            size="small"
            strokeColor={percent >= 80 ? '#52c41a' : percent >= 50 ? '#1677ff' : '#d48806'}
          />
        </div>

        {/* Current month goals */}
        {currentMonth && (
          <div style={{ background: '#fafafa', borderRadius: 6, padding: '8px 12px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {currentMonth.month} 目标:
            </Text>
            <div style={{ marginTop: 4 }}>
              {currentMonth.goals.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Tag
                    color={g.status === 'done' ? 'green' : g.status === 'in_progress' ? 'blue' : 'default'}
                    style={{ fontSize: 11, margin: 0, lineHeight: '18px', padding: '0 4px' }}
                  >
                    {g.status === 'done' ? '✓' : g.status === 'in_progress' ? '→' : '○'}
                  </Tag>
                  <Text style={{ fontSize: 13 }} delete={g.status === 'done'}>
                    {g.text}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upstream / Downstream */}
        {(card.upstreamAgentIds?.length > 0 || card.downstreamAgentIds?.length > 0) && (
          <div style={{ fontSize: 11 }}>
            {card.upstreamAgentIds?.length > 0 && (
              <Text type="secondary">↑ 上游: {card.upstreamAgentIds.length} 个 </Text>
            )}
            {card.downstreamAgentIds?.length > 0 && (
              <Text type="secondary">↓ 下游: {card.downstreamAgentIds.length} 个</Text>
            )}
          </div>
        )}
      </Space>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────

export default function GoalCardsPage() {
  const [cards, setCards] = useState<GoalCard[]>([]);
  const [pipelines, setPipelines] = useState<Array<{ value: string; label: string; count: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [pipelineFilter, setPipelineFilter] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadPipelines();
  }, []);

  useEffect(() => {
    loadData();
  }, [pipelineFilter]);

  async function loadPipelines() {
    try {
      const ps = await getGoalCardPipelines();
      setPipelines(ps);
    } catch {}
  }

  async function loadData() {
    setLoading(true);
    try {
      const res = await getGoalCards({ pipeline: pipelineFilter });
      setCards(res.goalCards);
    } catch (err: any) {
      message.error(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }

  const filteredCards = searchText
    ? cards.filter(c =>
        c.agent.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
        c.agent.name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.longTermDirection?.toLowerCase().includes(searchText.toLowerCase())
      )
    : cards;

  const pipelineOptions = [
    { label: `全部 (${cards.length})`, value: '' },
    ...pipelines.map(p => ({ label: `${p.label} (${p.count})`, value: p.value })),
  ];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Agent 目标卡系统</Title>
          <Text type="secondary">长期方向 · 月度目标 · 自检标准</Text>
        </div>
        <Space>
          <Input.Search
            placeholder="搜索 Agent"
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            placeholder="管道筛选"
            style={{ width: 180 }}
            value={pipelineFilter}
            onChange={(val) => setPipelineFilter(val || undefined)}
            options={pipelineOptions.map(o => ({ ...o, value: o.value || undefined }))}
            allowClear
          />
        </Space>
      </div>

      <div style={{ margin: '16px 0' }}>
        <Segmented
          block
          options={pipelineOptions.map(o => ({ label: o.label, value: o.value || '' }))}
          value={pipelineFilter || ''}
          onChange={(val) => setPipelineFilter(val || undefined)}
        />
      </div>

      {loading ? (
        <Spin style={{ display: 'block', margin: '60px auto' }} />
      ) : filteredCards.length === 0 ? (
        <Empty description="暂无目标卡数据" style={{ marginTop: 60 }} />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredCards.map(card => (
            <Col key={card.id} xs={24} sm={12} lg={8}>
              <GoalCardItem card={card} />
            </Col>
          ))}
        </Row>
      )}

      {/* Summary */}
      <Card size="small" style={{ marginTop: 16 }}>
        <Space size={24} wrap>
          <Text type="secondary">共 {filteredCards.length} 个目标卡</Text>
          <Text type="secondary">
            完成率: {cards.length ? Math.round(cards.reduce((sum, c) => sum + (c.stats?.done || 0), 0) / cards.reduce((sum, c) => sum + (c.stats?.total || 1), 0) * 100) : 0}%
          </Text>
        </Space>
      </Card>
    </div>
  );
}
