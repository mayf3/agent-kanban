import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Collapse,
  DatePicker,
  Descriptions,
  Divider,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Segmented,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  getWeeklyReports,
  getPendingReports,
  getWeeklySummary,
  submitWeeklyReport,
  reviewWeeklyReport,
  getAgents,
  type WeeklyReport,
  type WeeklyReportSummary,
} from '../api/weeklyReports';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

// ─── Helpers ─────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getWeekLabel(start: string) {
  const d = new Date(start);
  const mon = d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  const end = new Date(d.getTime() + 6 * 24 * 60 * 60 * 1000);
  const sun = end.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  return `${mon} - ${sun}`;
}

const statusColorMap: Record<string, string> = {
  draft: 'default',
  submitted: 'blue',
  reviewed: 'green',
  needs_revision: 'red',
};

const statusLabelMap: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  reviewed: '已审阅',
  needs_revision: '需修改',
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ─── Summary Card ─────────────────────────────────────────

function SummarySection({
  summary,
  loading,
}: {
  summary: WeeklyReportSummary | null;
  loading: boolean;
}) {
  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;
  if (!summary) return <Empty description="暂无数据" />;

  return (
    <Space direction="vertical" size={16} className="full-width">
      <Card>
        <Space size={24} wrap>
          <Statistic
            title="本周报告数"
            value={summary.totalReports}
            suffix="份"
          />
          <Statistic
            title="完成任务数"
            value={summary.totalTasksCompleted}
            suffix="个"
          />
          <Statistic
            title="已审阅"
            value={summary.statusDistribution.reviewed || 0}
            suffix={`/ ${summary.totalReports}`}
            valueStyle={{ color: '#1f9d55' }}
          />
          <Statistic
            title="待审批"
            value={summary.statusDistribution.submitted || 0}
            valueStyle={{ color: summary.statusDistribution.submitted > 0 ? '#d48806' : undefined }}
          />
        </Space>
      </Card>

      <Collapse
        items={[
          {
            key: 'agents',
            label: `Agent 周报详情 (${summary.agents.length})`,
            children: (
              <List
                dataSource={summary.agents}
                renderItem={(agent) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar>{initials(agent.agentName)}</Avatar>}
                      title={
                        <Space>
                          <Text strong>{agent.agentName}</Text>
                          <Tag color={statusColorMap[agent.status]}>
                            {statusLabelMap[agent.status]}
                          </Tag>
                          <Text type="secondary">
                            {getWeekLabel(agent.weekStart)}
                          </Text>
                        </Space>
                      }
                      description={
                        <div>
                          <Text>{agent.summary}</Text>
                          {agent.metrics?.tasksCompleted != null && (
                            <Text type="secondary" style={{ marginLeft: 12 }}>
                              完成任务: {agent.metrics.tasksCompleted}
                            </Text>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ),
          },
        ]}
      />
    </Space>
  );
}

// ─── Reports Table ─────────────────────────────────────────

function ReportsTable({
  reports,
  loading,
  onReview,
  isAdmin,
  onRefresh,
}: {
  reports: WeeklyReport[];
  loading: boolean;
  onReview: (report: WeeklyReport) => void;
  isAdmin: boolean;
  onRefresh: () => void;
}) {
  const columns: ColumnsType<WeeklyReport> = [
    {
      title: 'Agent',
      dataIndex: ['agent', 'displayName'],
      key: 'agent',
      width: 130,
      render: (name, record) => (
        <Space>
          <Avatar size="small">{initials(name)}</Avatar>
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: '周次',
      key: 'week',
      width: 120,
      render: (_, record) => getWeekLabel(record.weekStart),
    },
    {
      title: '总结',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
      render: (text: string) => (
        <Text ellipsis style={{ maxWidth: 300 }}>{text}</Text>
      ),
    },
    {
      title: '完成任务',
      key: 'tasks',
      width: 100,
      render: (_, record) => (
        <Text>{record.metrics?.tasksCompleted ?? record.completedTasks?.length ?? 0}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColorMap[status]}>{statusLabelMap[status]}</Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => <Text type="secondary">{formatDateTime(date)}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => onReview(record)}>
            详情
          </Button>
          {isAdmin && record.status === 'submitted' && (
            <Button type="link" size="small" onClick={() => onReview(record)}>
              审批
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={reports}
      rowKey="id"
      loading={loading}
      locale={{ emptyText: <Empty description="暂无周报" /> }}
      pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      size="middle"
    />
  );
}

// ─── Submit Form Modal ─────────────────────────────────────

function SubmitModal({
  open,
  agents,
  onClose,
  onSuccess,
}: {
  open: boolean;
  agents: Array<{ id: string; name: string; displayName: string }>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      await submitWeeklyReport({
        agentId: values.agentId,
        weekStart: monday.toISOString(),
        weekEnd: sunday.toISOString(),
        summary: values.summary,
        completedTasks: values.completedTasks
          ? values.completedTasks
              .split('\n')
              .filter(Boolean)
              .map((line: string) => {
                const match = line.match(/^(\[([\w-]+)\])?\s*(.+)/);
                return {
                  title: match?.[3] || line,
                  status: match?.[2] || 'done',
                };
              })
          : [],
        nextWeekPlan: values.nextWeekPlan || '',
        blockers: values.blockers || '',
        metrics: {
          tasksCompleted: values.completedTasks
            ? values.completedTasks.split('\n').filter(Boolean).length
            : 0,
        },
      });

      message.success('周报提交成功');
      form.resetFields();
      onSuccess();
    } catch (err: any) {
      if (err.message) message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="提交周报"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      width={640}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="agentId"
          label="Agent"
          rules={[{ required: true, message: '请选择 Agent' }]}
        >
          <Select
            placeholder="选择提交周报的 Agent"
            options={agents.map((a) => ({ label: a.displayName || a.name, value: a.id }))}
          />
        </Form.Item>
        <Form.Item
          name="summary"
          label="本周总结"
          rules={[{ required: true, message: '请输入本周总结' }]}
        >
          <TextArea rows={3} placeholder="本周主要工作内容..." />
        </Form.Item>
        <Form.Item
          name="completedTasks"
          label="完成任务（每行一个，可选标记 [done] [in-progress]）"
        >
          <TextArea
            rows={4}
            placeholder={`[done] Agent 列表页开发\n[done] OKR 目标卡组件\n[in-progress] API 对接`}
          />
        </Form.Item>
        <Form.Item name="nextWeekPlan" label="下周计划">
          <TextArea rows={3} placeholder="下周计划..." />
        </Form.Item>
        <Form.Item name="blockers" label="阻塞项">
          <TextArea rows={2} placeholder="需要协调的问题..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ─── Review Modal ──────────────────────────────────────────

function ReviewModal({
  report,
  open,
  isAdmin,
  onClose,
  onSuccess,
}: {
  report: WeeklyReport | null;
  open: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!report) return null;

  const handleReview = async (status: 'reviewed' | 'needs_revision') => {
    setSubmitting(true);
    try {
      await reviewWeeklyReport(report.id, { status, reviewComment: reviewComment || undefined });
      message.success(status === 'reviewed' ? '已审阅通过' : '已标记为需修改');
      onSuccess();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={`周报详情 - ${report.agent.displayName}`}
      open={open}
      onCancel={onClose}
      footer={
        isAdmin && report.status === 'submitted'
          ? [
              <Button key="back" onClick={onClose}>取消</Button>,
              <Button
                key="revision"
                danger
                loading={submitting}
                onClick={() => handleReview('needs_revision')}
              >
                需修改
              </Button>,
              <Button
                key="approve"
                type="primary"
                loading={submitting}
                onClick={() => handleReview('reviewed')}
              >
                审阅通过
              </Button>,
            ]
          : [
              <Button key="close" type="primary" onClick={onClose}>
                关闭
              </Button>,
            ]
      }
      width={640}
    >
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Agent">
          <Space>
            <Avatar size="small">{initials(report.agent.displayName)}</Avatar>
            {report.agent.displayName}
            <Tag>{report.agent.name}</Tag>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="周次">
          {getWeekLabel(report.weekStart)}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={statusColorMap[report.status]}>
            {statusLabelMap[report.status]}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="提交人">{report.submittedBy}</Descriptions.Item>
        <Descriptions.Item label="提交时间">
          {formatDateTime(report.createdAt)}
        </Descriptions.Item>
        {report.reviewedBy && (
          <Descriptions.Item label="审阅人">{report.reviewedBy}</Descriptions.Item>
        )}
        {report.reviewedAt && (
          <Descriptions.Item label="审阅时间">
            {formatDateTime(report.reviewedAt)}
          </Descriptions.Item>
        )}
      </Descriptions>

      <Divider />

      <Space direction="vertical" size={12} className="full-width">
        <div>
          <Text strong>本周总结</Text>
          <div style={{ marginTop: 4 }}>{report.summary}</div>
        </div>

        {report.completedTasks?.length > 0 && (
          <div>
            <Text strong>完成任务</Text>
            <List
              size="small"
              dataSource={report.completedTasks}
              renderItem={(task) => (
                <List.Item>
                  <Space>
                    <Tag color={task.status === 'done' ? 'green' : 'processing'}>
                      {task.status === 'done' ? '已完成' : '进行中'}
                    </Tag>
                    <span>{task.title}</span>
                    {task.description && (
                      <Text type="secondary">- {task.description}</Text>
                    )}
                  </Space>
                </List.Item>
              )}
            />
          </div>
        )}

        {report.nextWeekPlan && (
          <div>
            <Text strong>下周计划</Text>
            <div style={{ marginTop: 4 }}>{report.nextWeekPlan}</div>
          </div>
        )}

        {report.blockers && (
          <div>
            <Text strong>阻塞项</Text>
            <div style={{ marginTop: 4 }}>{report.blockers}</div>
          </div>
        )}

        {report.reviewComment && (
          <Card size="small" title="审阅意见" style={{ background: '#fff7e6' }}>
            {report.reviewComment}
          </Card>
        )}

        {isAdmin && report.status === 'submitted' && (
          <div>
            <Text strong>审阅意见</Text>
            <TextArea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="输入审阅意见（可选）"
              style={{ marginTop: 4 }}
            />
          </div>
        )}
      </Space>
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────

const TABS = [
  { label: '📊 汇总', value: 'summary' as const },
  { label: '📋 周报列表', value: 'list' as const },
  { label: '⏳ 待审批', value: 'pending' as const },
];

export default function WeeklyReportsPage({
  onNavigateKanban,
}: {
  onNavigateKanban?: () => void;
}) {
  const [activeTab, setActiveTab] = useState('summary');
  const [summary, setSummary] = useState<WeeklyReportSummary | null>(null);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [pendingReports, setPendingReports] = useState<WeeklyReport[]>([]);
  const [agents, setAgents] = useState<Array<{ id: string; name: string; displayName: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [reviewReport, setReviewReport] = useState<WeeklyReport | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  // Is current user admin?
  const isAdmin = true; // frontend-react-engineer has developer role, can't approve via API
  // We'll handle the 403 gracefully

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    if (activeTab === 'summary') loadSummary();
    else if (activeTab === 'list') loadReports();
    else if (activeTab === 'pending') loadPending();
  }, [activeTab]);

  async function loadAgents() {
    try {
      const res = await getAgents();
      setAgents(res.data);
    } catch {
      // fallback: empty
    }
  }

  async function loadSummary() {
    setLoading(true);
    try {
      const res = await getWeeklySummary();
      setSummary(res.data);
    } catch (err: any) {
      message.error(err.message || '加载汇总失败');
    } finally {
      setLoading(false);
    }
  }

  async function loadReports() {
    setLoading(true);
    try {
      const res = await getWeeklyReports({ status: statusFilter });
      setReports(res.data);
    } catch (err: any) {
      message.error(err.message || '加载周报列表失败');
    } finally {
      setLoading(false);
    }
  }

  async function loadPending() {
    setLoading(true);
    try {
      const res = await getPendingReports();
      setPendingReports(res.data);
    } catch (err: any) {
      // 403 is expected for non-admin
      if (err.message?.includes('无权')) {
        message.warning('当前角色无权查看待审批列表');
      } else {
        message.error(err.message || '加载待审批列表失败');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleOpenReview(report: WeeklyReport) {
    setReviewReport(report);
    setReviewOpen(true);
  }

  function handleRefresh() {
    if (activeTab === 'summary') loadSummary();
    else if (activeTab === 'list') loadReports();
    else if (activeTab === 'pending') {
      loadPending();
      loadReports();
    }
    loadSummary();
  }

  return (
    <div className="weekly-reports-page">
      <div className="page-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Agent 周报系统
          </Title>
          <Text type="secondary">周报提交、汇总与审批</Text>
        </div>
        <Space>
          {onNavigateKanban && (
            <Button onClick={onNavigateKanban}>← 管理看板</Button>
          )}
          <Button type="primary" onClick={() => setSubmitOpen(true)}>
            + 提交周报
          </Button>
        </Space>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <Segmented
        block
        options={TABS}
        value={activeTab}
        onChange={(val) => setActiveTab(val as string)}
        style={{ marginBottom: 16 }}
      />

      <div className="tab-content">
        {activeTab === 'summary' && (
          <SummarySection summary={summary} loading={loading} />
        )}

        {activeTab === 'list' && (
          <Space direction="vertical" size={12} className="full-width">
            <Space wrap>
              <Select
                allowClear
                placeholder="状态筛选"
                style={{ width: 140 }}
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setTimeout(loadReports, 0);
                }}
                options={Object.entries(statusLabelMap).map(([value, label]) => ({
                  label,
                  value,
                }))}
              />
              <Button onClick={loadReports} loading={loading}>
                刷新
              </Button>
            </Space>
            <ReportsTable
              reports={reports}
              loading={loading}
              onReview={handleOpenReview}
              isAdmin={isAdmin}
              onRefresh={loadReports}
            />
          </Space>
        )}

        {activeTab === 'pending' && (
          <Space direction="vertical" size={12} className="full-width">
            <Text>
              <Badge count={pendingReports.length} style={{ backgroundColor: '#d48806' }} />
              <span style={{ marginLeft: 8 }}>份待审批周报</span>
            </Text>
            <ReportsTable
              reports={pendingReports}
              loading={loading}
              onReview={handleOpenReview}
              isAdmin={isAdmin}
              onRefresh={loadPending}
            />
          </Space>
        )}
      </div>

      <SubmitModal
        open={submitOpen}
        agents={agents}
        onClose={() => setSubmitOpen(false)}
        onSuccess={() => {
          setSubmitOpen(false);
          handleRefresh();
        }}
      />

      <ReviewModal
        report={reviewReport}
        open={reviewOpen}
        isAdmin={isAdmin}
        onClose={() => {
          setReviewOpen(false);
          setReviewReport(null);
        }}
        onSuccess={() => {
          setReviewOpen(false);
          setReviewReport(null);
          handleRefresh();
        }}
      />
    </div>
  );
}
