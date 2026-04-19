# JotIt

JotIt 是一个给自己用、也准备长期开源维护的极简记账 App。

它的目标不是做成大而全的财务系统，而是把这条主链路做顺：

- 打开就能看最近记录
- 点一下就能快速记一笔
- 离线也能完整使用
- 月末和任意时间范围都能快速回顾

当前项目基于 `Expo + React Native + TypeScript`，优先支持 Android，本地使用 `SQLite` 持久化数据。

## 当前状态

- `v0.2` 已完成：在 `v0.1` 基础上补齐周期交易、搜索筛选、导出备份恢复、常用录入候选
- 后续版本会逐步接入 AI 自然语言、OCR 和 AI 总结

## v0.1 已有能力

- 一级导航：`记账 / 回顾 / 设置`
- 记账页列表 + 底部大弹窗快记
- 仅支持人民币 `CNY`
- 默认分类 + 自定义分类
- 本地 SQLite 存储，离线可用
- 软删除 + 短时撤销
- 回顾粒度支持 `周 / 月 / 季 / 年 / 自定义`
- 月末自动生成规则型总结

## v0.2 已有能力

- 周期交易规则与到期确认
- 记账页历史搜索与筛选
- `CSV` 导出 + `JSON` 备份
- `JSON` 本地恢复与校验
- 常用分类 / 常用金额候选
- 暂不做快捷模板管理

## 技术栈

- `Expo`
- `React Native`
- `TypeScript`
- `expo-sqlite`
- `zustand`
- `jest`

## 本地开发

### 环境要求

- `Node.js` 20+
- `npm` 10+
- 如需本机运行 Android：已安装 Android Studio 和 Android SDK

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run android
```

如只需启动 Expo 开发服务：

```bash
npm run start
```

### 测试与类型检查

```bash
npm test
npm run typecheck
```

## 项目结构

```text
app/          Expo Router 页面
components/   通用 UI 组件
constants/    主题与常量
data/         SQLite、migration、repository
domain/       核心类型与业务逻辑
features/     页面级数据组织
hooks/        复用 hooks
store/        全局状态
.kiro/specs/  路线、阶段设计与任务文档
sources/      需求与用户声音研究材料
```

## Roadmap

- `v0.1` 核心记账闭环
- `v0.2` 效率与数据安全补强
- `v0.3` AI 自然语言记账
- `v0.4` OCR 票据 / 截图识别
- `v0.5` AI 自动总结与消费洞察

## 开源说明

本项目使用 `MIT` License。

欢迎基于 issue 或 PR 继续迭代，但默认产品方向仍然保持：

- 极简
- 离线优先
- 本地优先
- 低打扰
- AI 为增强能力，而不是基础依赖
