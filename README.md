# Agent Kanban

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Agent 技术路线图与技能管理系统 / Agent Tech Roadmap & Skill Management System

Agent Kanban is a dashboard for managing AI agent skill development, tracking tech debt, and maintaining technology roadmaps.

## Features

- 📊 **Tech Roadmap** — Maintain agent technology development roadmap
- 📋 **Skill Inventory** — Manage full lifecycle of agent skills
- 🔄 **Progress Tracking** — Track skills in development with Kanban board
- 💰 **Tech Debt** — Record and prioritize technical debt
- 🏥 **Post-mortem Reports** — Review and learn from incidents
- 🎯 **Agent Goals** — Agent-level objective tracking

## Project Structure

```
agent-kanban/
├── src/               # Vue + TypeScript frontend
├── memory/            # Kanban data (markdown)
│   ├── tech_roadmap.md
│   ├── skills_inventory.md
│   ├── tech_debt.md
│   └── best_practices.md
├── scripts/           # Automation scripts
├── dist/              # Build output
└── docs/              # Documentation
```

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build
```

## Tech Stack

- Vue 3 + TypeScript
- Vite
- Node.js

## License

[MIT](LICENSE)
