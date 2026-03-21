# 最佳实践

## 技能开发规范

### 目录结构

```
skill-name/
├── SKILL.md           # 技能描述（必需）
├── scripts/           # 脚本
│   └── *.sh
├── references/        # 参考文档
└── tests/            # 测试用例
```

### SKILL.md 模板

```markdown
---
name: skill-name
description: 简短描述
---

# 技能名称

## 功能描述
详细描述...

## 使用方法
...

## 技术架构
...

## 依赖项
...
```

## 代码质量标准

### 1. 可读性
- 代码清晰易懂
- 变量命名有意义
- 避免魔法数字

### 2. 模块化
- 单一职责原则
- 高内聚低耦合
- 函数长度 < 50 行

### 3. 可测试
- 提供测试用例
- 避免全局状态
- 依赖注入

### 4. 可维护
- 有完整文档
- 有错误处理
- 有日志记录

### 5. 性能
- 避免不必要的计算
- 合理使用缓存
- 注意资源释放

## Git 工作流

### 分支策略

- `main` - 稳定版本
- `develop` - 开发版本
- `feature/*` - 功能分支
- `fix/*` - 修复分支

### Commit 规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)**:
- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `style`: 格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建

**示例**:
```
feat(kanban): 添加技术债务追踪功能

- 实现 T001-T005 债务项
- 添加优先级排序
- 添加趋势统计

Closes #1
```

### Pull Request 检查清单

- [ ] 代码符合规范
- [ ] 有测试覆盖
- [ ] 文档已更新
- [ ] 无性能问题
- [ ] 通过 Code Review

## 文档规范

### README.md 结构

1. 项目简介
2. 核心功能
3. 项目结构
4. 快速开始
5. 使用文档
6. 开发指南
7. 许可证

### 代码注释

- 复杂逻辑必须注释
- 公共 API 必须 JSDoc
- 注释解释"为什么"，不是"是什么"

## 错误处理

### Shell Script

```bash
set -euo pipefail  # 严格模式
trap 'echo "Error on line $LINENO"; exit 1' ERR  # 错误捕获
```

### JavaScript

```javascript
try {
  // 操作
} catch (error) {
  console.error('操作失败:', error.message);
  process.exit(1);
}
```

## 安全规范

- 不要硬编码密钥
- 使用环境变量
- 验证用户输入
- 最小权限原则

## 性能优化

- 避免重复计算
- 使用缓存
- 异步处理
- 资源复用

## 工具推荐

### 开发工具
- VS Code - 编辑器
- Git - 版本控制
- npm - 包管理

### 代码质量
- ESLint - 代码检查
- Prettier - 代码格式
- Jest - 测试框架

### 文档工具
- Markdown - 文档编写
- Mermaid - 流程图

---

*持续更新中...*

**最后更新: 2026-03-21*
