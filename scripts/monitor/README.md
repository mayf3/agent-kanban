# Agent Monitor Service

实时监控 OpenClaw Agent 会话状态的 Web 服务。

## 功能特性

- ✅ **实时监控**: 每 10 秒自动获取最新的 Agent 会话数据
- ✅ **WebSocket 推送**: 通过 WebSocket 实时推送状态更新
- ✅ **REST API**: 提供 RESTful API 接口查询状态
- ✅ **可视化界面**: 美观的 Web 界面展示会话统计和详情
- ✅ **统计分析**: 自动计算活跃会话、Agent 数量等统计信息

## 技术栈

- **后端**: Node.js + Express
- **实时通信**: WebSocket (ws)
- **命令行**: child_process.exec 调用 openclaw 命令
- **前端**: 原生 HTML + CSS + JavaScript（无框架依赖）

## 安装

```bash
# 进入项目目录
cd /home/user/projects/agent-kanban/scripts/monitor

# 安装依赖
npm install
```

## 使用

### 启动服务

```bash
npm start
```

服务启动后：
- HTTP 服务运行在 `http://localhost:3000`
- WebSocket 服务运行在 `ws://localhost:3001`

### 访问界面

在浏览器中打开: http://localhost:3000

### 停止服务

按 `Ctrl + C` 停止服务

## API 接口

### GET /api/state
获取完整状态（包括会话列表和统计摘要）

**响应示例:**
```json
{
  "sessions": [
    {
      "id": "agent:agent-dev-engineer:feishu:group:xxx",
      "agent": "agent-dev-engineer",
      "type": "feishu",
      "model": "zai/glm-4.7",
      "modified": "2026-03-21T14:30:00Z",
      "messageCount": 42,
      "isActive": true
    }
  ],
  "summary": {
    "total": 15,
    "active": 8,
    "agents": 5,
    "byType": {
      "feishu": 10,
      "discord": 5
    },
    "byModel": {
      "zai/glm-4.7": 12,
      "openai/gpt-4": 3
    },
    "lastUpdate": "2026-03-21T14:30:00Z"
  }
}
```

### GET /api/sessions
获取会话列表

**响应示例:**
```json
[
  {
    "id": "agent:agent-dev-engineer:feishu:group:xxx",
    "agent": "agent-dev-engineer",
    "type": "feishu",
    "model": "zai/glm-4.7",
    "modified": "2026-03-21T14:30:00Z",
    "messageCount": 42,
    "isActive": true
  }
]
```

### GET /api/summary
获取统计摘要

**响应示例:**
```json
{
  "total": 15,
  "active": 8,
  "agents": 5,
  "byType": {
    "feishu": 10,
    "discord": 5
  },
  "byModel": {
    "zai/glm-4.7": 12,
    "openai/gpt-4": 3
  },
  "lastUpdate": "2026-03-21T14:30:00Z"
}
```

### GET /health
健康检查

**响应示例:**
```json
{
  "status": "ok",
  "uptime": 123.456,
  "lastUpdate": "2026-03-21T14:30:00Z"
}
```

## WebSocket 消息

### 连接
```javascript
const ws = new WebSocket('ws://localhost:3001');
```

### 消息格式

#### 状态更新
```json
{
  "type": "state-update",
  "data": {
    "sessions": [...],
    "summary": {...}
  }
}
```

#### 错误消息
```json
{
  "type": "error",
  "message": "Error details..."
}
```

## 项目结构

```
scripts/monitor/
├── package.json       # 项目配置和依赖
├── server.js          # 主服务文件
├── public/
│   └── index.html     # 前端界面
└── README.md          # 使用文档
```

## 配置

### 端口配置
在 `server.js` 中修改以下常量：

```javascript
const HTTP_PORT = 3000;   // HTTP 服务端口
const WS_PORT = 3001;     // WebSocket 服务端口
const POLL_INTERVAL = 10000; // 轮询间隔（毫秒）
```

### 活跃会话判断
默认定义：最后修改时间在 5 分钟内的会话视为活跃。

可在 `calculateSummary()` 函数中修改：

```javascript
const diffMins = diffMs / 1000 / 60;
if (diffMins < 5) {  // 修改这个值
  active++;
}
```

## 故障排除

### 服务无法启动
- 检查端口 3000 和 3001 是否被占用
- 运行 `lsof -i :3000` 和 `lsof -i :3001` 查看端口占用情况

### 无法获取会话数据
- 确保 `openclaw` 命令在 PATH 中
- 尝试手动运行 `openclaw sessions list --json --limit 50` 测试

### WebSocket 连接失败
- 检查防火墙设置
- 确认 WebSocket 服务已启动（查看控制台日志）

## 开发说明

### 添加新 API 端点
在 `server.js` 中添加 Express 路由：

```javascript
app.get('/api/your-endpoint', (req, res) => {
  res.json({ key: 'value' });
});
```

### 修改前端界面
编辑 `public/index.html` 文件。

### 调试
启动服务后，控制台会输出详细日志：
- 服务启动信息
- WebSocket 连接状态
- 数据更新日志
- 错误信息

## 许可证

MIT

## 作者

Agent Dev Engineer

## 更新日志

### v1.0.0 (2026-03-21)
- ✅ 初始版本
- ✅ REST API 接口
- ✅ WebSocket 实时推送
- ✅ Web 界面
- ✅ 统计分析功能
