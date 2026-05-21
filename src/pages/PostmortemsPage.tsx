import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Steps,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  getPostmortems,
  getPostmortem,
  createPostmortem,
  updatePostmortem,
  getPostmortemStats,
  type Postmortem,
  type PostmortemStats,
} from '../api/postmortems';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const statusConfig: Record<string, { color: string; label: string; step: number }> = {
  pending: { color: 'orange', label: '待处理', step: 0 },
  implemented: { color: 'blue', label: '已实施', step: 1 },
  verified: { color: 'green', label: '已验证', step: 2 },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Detail Modal ──────────────────────────────────────────

function DetailModal({
  report,
  open,
  onClose,
  onUpdate,
}: {
  report: Postmortem | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}) {
  if (!report) return null;

  const cfg = statusConfig[report.status];

  return (
    <Modal
      title={report.title}
      open={open}
      onCancel={onClose}
      width={720}
      footer={[
        <Button key="close" onClick={onClose}>关闭</Button>,
        report.status === 'pending' && (
          <Button key="impl" type="primary" onClick={async () => {
            try {
              await updatePostmortem(report.id, { status: 'implemented' });
              message.success('已标记为已实施');
              onUpdate?.();
              onClose();
            } catch (err: any) {
              message.error(err.message);
            }
          }}>
            标记已实施
          </Button>
        ),
        report.status === 'implemented' && (
          <Button key="verify" type="primary" style={{ background: '#52c41a' }} onClick={async () => {
            try {
              await updatePostmortem(report.id, { status: 'verified' });
              message.success('已标记为已验证');
              onUpdate?.();
              onClose();
            } catch (err: any) {
              message.error(err.message);
            }
          }}>
            标记已验证
          </Button>
        ),
      ].filter(Boolean)}
    >
      <Steps
        size="small"
        current={cfg.step}
        items={[
          { title: '待处理' },
          { title: '已实施' },
          { title: '已验证' },
        ]}
        style={{ marginBottom: 24 }}
      />

      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="状态">
          <Tag color={cfg.color}>{cfg.label}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="负责人">
          <Text strong>{report.responsiblePerson}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {formatDate(report.createdAt)}
        </Descriptions.Item>
        <Descriptions.Item label="已过天数">
          <Text type={daysSince(report.createdAt) > 3 ? 'danger' : 'secondary'}>
            {daysSince(report.createdAt)} 天
          </Text>
        </Descriptions.Item>
        {report.requirement && (
          <Descriptions.Item label="关联需求" span={2}>
            <Tag>{report.requirement.priority}</Tag>
            <Text>{report.requirement.title}</Text>
          </Descriptions.Item>
        )}
      </Descriptions>

      <Divider />

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Text strong style={{ color: '#cf1322' }}>🔥 现象 (Phenomenon)</Text>
          <Paragraph style={{ marginTop: 4, background: '#fff2f0', padding: 12, borderRadius: 6 }}>
            {report.phenomenon}
          </Paragraph>
        </div>
        <div>
          <Text strong style={{ color: '#d48806' }}>🎯 根因 (Root Cause)</Text>
          <Paragraph style={{ marginTop: 4, background: '#fffbe6', padding: 12, borderRadius: 6 }}>
            {report.rootCause}
          </Paragraph>
        </div>
        {report.whyExistingProcess && (
          <div>
            <Text strong>❓ 为何现有流程没防住</Text>
            <Paragraph style={{ marginTop: 4 }}>{report.whyExistingProcess}</Paragraph>
          </div>
        )}
        {report.longTermPrinciple && (
          <div>
            <Text strong style={{ color: '#1677ff' }}>📐 长期原则</Text>
            <Paragraph style={{ marginTop: 4 }}>{report.longTermPrinciple}</Paragraph>
          </div>
        )}
        <div>
          <Text strong style={{ color: '#1f9d55' }}>🛡️ 预防措施</Text>
          <Paragraph style={{ marginTop: 4, whiteSpace: 'pre-wrap', background: '#f6ffed', padding: 12, borderRadius: 6 }}>
            {report.preventionMeasures}
          </Paragraph>
        </div>
      </Space>
    </Modal>
  );
}

// ─── Create Modal ──────────────────────────────────────────

function CreateModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await createPostmortem(values);
      message.success('验尸报告已创建');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.message) message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="创建验尸报告"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      width={640}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="例: ADC 后端崩溃验尸分析" />
        </Form.Item>
        <Form.Item name="responsiblePerson" label="负责人" rules={[{ required: true, message: '请输入负责人' }]}>
          <Input placeholder="例: itops-agent" />
        </Form.Item>
        <Form.Item name="phenomenon" label="🔥 现象" rules={[{ required: true, message: '请描述现象' }]}>
          <TextArea rows={3} placeholder="发生了什么？" />
        </Form.Item>
        <Form.Item name="rootCause" label="🎯 根因" rules={[{ required: true, message: '请分析根因' }]}>
          <TextArea rows={3} placeholder="为什么发生？" />
        </Form.Item>
        <Form.Item name="whyExistingProcess" label="❓ 为何现有流程没防住">
          <TextArea rows={2} placeholder="为什么当前的检查/流程没拦住？" />
        </Form.Item>
        <Form.Item name="longTermPrinciple" label="📐 长期原则">
          <TextArea rows={2} placeholder="应该遵循什么原则来避免？" />
        </Form.Item>
        <Form.Item name="preventionMeasures" label="🛡️ 预防措施" rules={[{ required: true, message: '请列出预防措施' }]}>
          <TextArea rows={4} placeholder="1. ...\n2. ...\n3. ..." />
        </Form.Item>
        <Form.Item name="requirementId" label="关联需求ID（可选）">
          <Input placeholder="UUID，可留空" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────

export default function PostmortemsPage() {
  const [reports, setReports] = useState<Postmortem[]>([]);
  const [stats, setStats] = useState<PostmortemStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selected, setSelected] = useState<Postmortem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [reportsRes, statsRes] = await Promise.all([
        getPostmortems({ status: statusFilter, pageSize: 50 }),
        getPostmortemStats(),
      ]);
      setReports(reportsRes.postmortems);
      setStats(statsRes);
    } catch (err: any) {
      message.error(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }

  function handleRowClick(record: Postmortem) {
    setSelected(record);
    setDetailOpen(true);
  }

  const columns: ColumnsType<Postmortem> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record) => (
        <a onClick={() => handleRowClick(record)}>{text}</a>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const cfg = statusConfig[status] || { color: 'default', label: status };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: '负责人',
      dataIndex: 'responsiblePerson',
      key: 'responsiblePerson',
      width: 140,
    },
    {
      title: '关联需求',
      key: 'requirement',
      width: 200,
      ellipsis: true,
      render: (_, record) =>
        record.requirement ? (
          <Space>
            <Tag>{record.requirement.priority}</Tag>
            <Text ellipsis>{record.requirement.title}</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (date: string) => <Text type="secondary">{formatDate(date)}</Text>,
    },
    {
      title: '天数',
      key: 'days',
      width: 80,
      render: (_, record) => {
        const days = daysSince(record.createdAt);
        return (
          <Text type={days > 3 && record.status === 'pending' ? 'danger' : 'secondary'}>
            {days}d
          </Text>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>验尸报告 (Postmortem)</Title>
          <Text type="secondary">事故复盘追踪与知识沉淀</Text>
        </div>
        <Space>
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            + 创建报告
          </Button>
        </Space>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="总计" value={stats.total} suffix="份" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="本月新增" value={stats.thisMonth} suffix="份" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="待处理"
                value={stats.byStatus.find(s => s.status === 'pending')?.count || 0}
                valueStyle={{ color: '#d48806' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="逾期 (>3天)"
                value={stats.overdue}
                valueStyle={{ color: stats.overdue > 0 ? '#cf1322' : undefined }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Space style={{ marginBottom: 12 }}>
        <Select
          allowClear
          placeholder="状态筛选"
          style={{ width: 140 }}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          options={[
            { label: '待处理', value: 'pending' },
            { label: '已实施', value: 'implemented' },
            { label: '已验证', value: 'verified' },
          ]}
        />
        <Button onClick={loadData} loading={loading}>刷新</Button>
      </Space>

      <Table
        columns={columns}
        dataSource={reports}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: <Empty description="暂无验尸报告" /> }}
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        size="middle"
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: 'pointer' },
        })}
      />

      <DetailModal
        report={selected}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelected(null); }}
        onUpdate={loadData}
      />

      <CreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
