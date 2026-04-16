# MemexFlow 2026 Q2 Strategy

更新时间：2026-04-15

这份文档不是对 `KnowledgeClaw.md` 的否定，而是基于 2026 年 3-4 月的最新行业信号，对项目定位、信息架构和技术路线做一次重构。

## 1. 先给结论

MemexFlow 不应该继续被包装成：

- AI 收藏夹增强版
- OpenClaw 式个人万能助手的轻量变体
- 主要卖点是“自动发现内容”的 PKM 工具

MemexFlow 更适合被重构成：

**一个面向长期项目与长期学习目标的 agent-native personal research OS。**

更具体一点：

**它是个人的记忆层 + 研究层 + 工作流层，而不是单纯的知识库。**

这意味着项目重心要从：

- 收藏
- 推荐
- 入库
- 回顾

升级为：

- 围绕项目组织上下文
- 持续沉淀可追溯的长期记忆
- 让 agent 基于这些记忆做研究、整理、比较、复盘
- 在合适时机把知识重新推回到当前任务中

## 2. 为什么现在要这样改

截至 2026 年 4 月，外部趋势已经很明确：

### 2.1 Agent 热点已经从“能不能调工具”转向“能不能跨会话积累经验”

Hermes Agent 的核心卖点不再只是工具调用，而是：

- built-in learning loop
- 从经验中生成和改进 skills
- 搜索过去会话
- 跨 session 建立用户模型

这和你原来方案里“知识会回来”“系统记住关注主题”的方向高度一致，但比 OpenClaw 式“全能消息入口 + 设备侧控制”更贴近知识系统。

### 2.2 协议层已经快速标准化，说明产品设计要考虑可插拔和跨生态

MCP 到 2025 年 12 月已经进入 Agentic AI Foundation，官方披露数据是：

- 97M+ monthly SDK downloads
- 10,000 active servers
- ChatGPT、Claude、Gemini、Copilot、VS Code 等已有一线支持

进入 2026 年后，MCP 又继续往几个方向推进：

- 2026 roadmap 明确提到 transport scalability、agent communication、enterprise readiness
- 2026-01-26 正式发布 MCP Apps，工具可以直接返回交互式 UI

这意味着如果你现在做一个新项目，不应该把自己绑死在某一个 agent runtime 上，而应该做成：

- memory-first 的上层产品
- MCP-first 的工具接入层
- 后续可兼容 A2A / A2UI / MCP Apps 的 UI 与 agent 通信方式

### 2.3 PKM 产品本身也在“知识库”之外扩展为研究工作台

过去一年很明显的变化：

- Google 在 2026-04-08 把 notebooks 带进 Gemini，并与 NotebookLM 同步，说明“聊天 + 资料集 + 研究任务”开始合流
- Notion 的 Research Mode 已经能搜 Notion、连接器和 Web，并生成可保存报告
- Readwise 在 2026-03 直接推出 Readwise MCP、CLI、Skills，开始把阅读库变成 agent 可调用的外部记忆
- Capacities 在 2026-03 的更新里强调 richer context、clearer sources、grounding in your own notes

这说明今天的用户已经不满足于：

- 我把东西存起来
- AI 帮我总结

而是更关心：

- 我的资料能否形成长期上下文
- agent 是否真的理解我手头项目
- 输出是否可追溯到原文
- 是否能跨多轮、多来源持续工作

### 2.4 最新研究也在证明“长期记忆”不是锦上添花，而是核心能力

2026 年 3-4 月的几篇论文很能说明问题：

- `MemX` 强调 local-first long-term memory
- `LifeBench` 证明 long-horizon multi-source memory 仍然很难
- `MemMachine` 强调 ground-truth-preserving memory，不再迷信只靠摘要抽取

结论很直接：

**MemexFlow 的护城河不该是“又一个 RAG 笔记工具”，而应该是“更适合个人长期项目的记忆工程”。**

### 2.5 OpenClaw 仍然很活跃，但它已经暴露出另一套产品代价

截至 2026-04-14，OpenClaw 仍在持续发版，所以不能简单理解成“已经过气”。

但它的问题是：

- 更像个人 assistant control plane
- 更重消息渠道与设备连接
- 运行面更复杂
- 安全成本更高

2026 年 2 月还出现过高危 RCE 相关事件，这类项目天然要求：

- 权限隔离
- 可审计执行
- 明确审批
- 更强的运行安全

如果你的目标是做一个适合作为实习求职项目的作品，Hermes 这类 memory-first、learning-first 的叙事，对你更有利，也更容易讲清楚产品逻辑。

## 3. 对原版 KnowledgeClaw 的保留与替换

原方案里最应该保留的部分：

- `Inbox / Radar / Library` 的候选池机制
- “AI 降低判断成本，用户做最终判断”
- “知识不会沉底，会重新回到工作现场”
- 围绕长期主题持续工作的产品理念

最应该替换的部分：

### 3.1 把“主题”升级为“项目上下文”

原来是：

- AI 产品经理
- Agent / MCP
- PKM
- 暑期实习准备

现在更适合改成：

- 项目 / Goal / Track
- 每个项目有资料、问题、输出物、例行回顾、监测规则

主题是静态分类。
项目上下文是动态工作单元。

这会直接让产品从“知识整理工具”变成“研究工作台”。

### 3.2 把 `Radar` 从推荐流改为 `Watchlist / Monitor`

`Radar` 这个名字延续了 OpenClaw 气质，但在 2026 年会显得偏泛化推荐。

更好的做法：

- `Watchlist`
- `Project Monitor`
- `Signals`

它不是推荐信息流，而是：

- 针对某个项目监测新论文、新产品更新、新行业信号
- 给出变化点、影响判断、是否值得纳入当前项目

推荐逻辑应该从“你可能感兴趣”
改成“这会影响你现在做的事”

### 3.3 把 `Library` 从资料库升级为证据化记忆库

Library 不应只存：

- 摘要
- 标签
- 主题

而应显式区分三层记忆：

- `Episodic Memory`：原始事件、对话、网页、PDF、会议记录、聊天记录
- `Semantic Memory`：抽取后的观点、事实、概念、结论、关联
- `Procedural Memory`：用户常用 workflow、提示模板、判断规则、自动化技能

这样一来，MemexFlow 不只是“存内容”，而是在做 agent 可用的 memory substrate。

### 3.4 把 `Review` 从回顾页升级为 `Recall + Briefing`

2026 年用户对 AI 复盘的期待已经不只是“提醒我看旧内容”，而是：

- 在当前项目里，我应该先读哪几条旧资料
- 过去两周这个话题发生了什么变化
- 这些变化会不会影响我的判断
- 帮我生成 briefing / weekly memo / interview prep pack

所以 Review 更适合拆成两个结果层：

- `Recall`：在正确时机把旧知识拉回来
- `Briefing`：把多源材料压成可执行的研究产物

## 4. 新定位建议

### 产品一句话

**MemexFlow 是一个围绕长期项目持续积累记忆、组织研究上下文、并驱动 agent 输出结果的个人研究操作系统。**

### 更适合的副标题

可选版本：

- Memory-first research workspace for agent-native work
- 一个让 AI 真正记住你项目上下文的个人研究系统
- 把资料、记忆、监测和研究工作流连成闭环的个人 AI 工作台

### 与现有产品的差异化

#### 相比 NotebookLM / Gemini notebooks

- 它们更强在“基于一组资料做问答和生成”
- MemexFlow 更强调跨时间、跨项目、跨来源的长期记忆与工作流

#### 相比 Notion Research Mode

- Notion 更偏团队知识空间 + 搜索 + 报告
- MemexFlow 更偏个人长期记忆、学习轨迹、项目演进与 agent 化操作

#### 相比 Readwise

- Readwise 更偏阅读输入与回顾
- MemexFlow 更偏把阅读、网页、对话、项目问题和输出任务编织成一个可执行研究系统

#### 相比 OpenClaw

- OpenClaw 更像 general-purpose personal assistant runtime
- MemexFlow 更像垂直在 personal knowledge / research 的 memory OS

#### 相比 Hermes

- Hermes 更偏通用 agent substrate
- MemexFlow 可以把 Hermes 式 memory / skills / learning 思路，压缩成一个更聚焦、产品叙事更完整的知识研究应用

## 5. 与成熟 PKM 产品的差异点

这一部分很重要，因为 MemexFlow 最容易犯的错误不是“方向不对”，而是：

- 和 Notion 拼大而全 workspace
- 和 Obsidian 拼 local-first 与可定制
- 和 Cubox 拼采集与阅读体验

这三个方向都不是最优战场。

### 5.1 比较方法：按“核心工作单元”来比

如果只按功能表比较，几乎所有产品都会出现：

- AI 摘要
- 搜索
- 标签
- 收藏 / 笔记

这种比较方法没有意义。

更有效的方法是比较它们各自的核心工作单元：

- `Notion`：`page / database / workspace`
- `Obsidian`：`file / vault / link / plugin`
- `Cubox`：`card / article / highlight / inbox`
- `MemexFlow`：`project / question / claim / brief / memory`

核心工作单元决定了一个产品最擅长解决什么问题，也决定了它的自然边界。

### 5.2 与 Notion 的差异点

Notion 目前的中心仍然是 `workspace`。

它擅长的东西非常明确：

- 页面和数据库组织
- 团队协作与共享
- 文档、项目、知识库统一在一个空间里
- 用 Research Mode 跨 workspace、连接器和 Web 搜索并生成报告

这类能力的结果是：

- `Notion` 更像团队工作空间和 AI 信息中枢

MemexFlow 不该和它正面竞争的部分：

- 通用文档编辑器
- 通用数据库 / 项目管理
- 团队 wiki
- 企业级跨应用搜索

MemexFlow 更该切入的空白：

- 围绕个人项目维护长期上下文
- 把新资料和旧判断做比较
- 把内容沉淀成 `claim`、`evidence`、`brief`
- 在正确时机触发 recall 和更新判断

一句话总结：

- `Notion` 管的是工作区里的页面和数据库
- `MemexFlow` 管的是项目演进过程里的记忆和证据

### 5.3 与 Obsidian 的差异点

Obsidian 的中心是 `vault` 和 `file`。

它强在：

- 本地优先
- Markdown 文件所有权
- 双链和知识网络
- 插件生态
- 可高度定制
- Canvas 这种偏思考和表达的工作区

这意味着 Obsidian 本质上是：

- 一个高度灵活的个人思考和写作环境

MemexFlow 不该和它正面竞争的部分：

- Markdown 写作体验
- 本地文件控制权
- 无限可定制性
- 社区插件生态

MemexFlow 更该切入的空白：

- 结构化候选池
- 项目级信号监测
- 多来源证据比较
- 自动生成研究 brief
- 围绕当前项目的 recall loop

一句话总结：

- `Obsidian` 更适合“我如何表达和组织自己的知识”
- `MemexFlow` 更适合“AI 如何围绕我的项目持续维护研究上下文”

如果未来要做生态关系，最合理的不是替代 Obsidian，而是：

- MemexFlow 负责持续摄入、监测、比较、brief
- Obsidian 负责深度写作、长期笔记表达和最终沉淀

### 5.4 与 Cubox 的差异点

Cubox 的中心是 `article / card / highlight`。

它强在一整条低摩擦链路：

- 收得快
- 读得顺
- AI 帮你先消化
- 搜索和整理足够轻
- 可以回流到 Notion / Readwise / Obsidian

所以它本质上不是“传统笔记软件”，而是：

- 一个以采集、阅读、轻整理、轻回顾为核心的内容消费与吸收系统

MemexFlow 不该和它正面竞争的部分：

- 稍后读体验
- Reader 细节
- 一键保存体验
- 高亮和轻注释体验
- 轻量整理和搜索体验

MemexFlow 更该切入的空白：

- 不只问“这篇文章值不值得读”
- 而是问“它会不会改变我当前项目的判断”

更具体地说，MemexFlow 应该把单位从：

- 文章
- 高亮
- 收藏项

升级成：

- 项目
- 问题
- 证据
- claim
- 变化判断
- brief

一句话总结：

- `Cubox` 优化的是内容采集和阅读消化
- `MemexFlow` 优化的是项目研究中的记忆演进和判断更新

### 5.5 MemexFlow 最合理的站位

真正合理的位置不是替代这些成熟产品，而是站在它们上面一层，负责：

- 项目上下文
- 长期记忆
- 新旧信息比较
- 研究产物生成
- recall loop

可以把这种关系理解成：

- `Cubox`：采集入口和阅读缓冲层
- `Obsidian`：深度写作和长期表达层
- `Notion`：协作、展示和团队空间
- `MemexFlow`：项目型研究记忆层

如果面试时只讲一句话，最合适的是：

**Notion 管工作区，Obsidian 管知识表达，Cubox 管采集与阅读，MemexFlow 管围绕项目持续演化的研究记忆。**

## 6. 新的信息架构建议

不建议继续停留在原来的五页结构。

更适合的第一版信息架构：

### 6.1 Home

展示的不是“系统有多少条知识”，而是：

- 当前活跃项目
- 最近新增信号
- 待处理候选
- 今日建议回忆
- 本周生成的 brief / memo

### 6.2 Projects

这是新的核心页。

每个 Project 包含：

- goal
- 当前问题清单
- 关键来源
- 最近新增信号
- 已沉淀记忆
- 相关 brief
- 自动监测规则

### 6.3 Capture

统一输入层：

- link
- pdf
- note
- web clip
- chat transcript
- imported docs

所有内容先进入候选池，不直接入库。

### 6.4 Signals

原 `Radar` 的升级版。

按项目展示：

- 新发现内容
- 为什么重要
- 与现有记忆冲突还是补充
- 建议动作

动作不只包括“入库”，还包括：

- attach to project
- compare with existing evidence
- generate brief
- ignore

### 6.5 Memory

这是正式的长期记忆层。

建议提供多个视图：

- timeline
- source view
- concept / entity view
- claim view
- relation graph

### 6.6 Briefs

这是原方案没有单独拎出来，但在 2026 年很该独立的一层。

可生成的产物：

- weekly research brief
- topic landscape
- interview prep pack
- literature scan
- compare memo
- contradiction report

### 6.7 Recall

单独承担知识回流：

- 今日 recall
- 项目相关旧资料提醒
- 长期未复习但高价值内容
- 基于遗忘曲线的轻量复习

## 7. 关键产品机制重写

### 7.1 从“三层知识池”升级为“四层记忆流”

原版：

- Inbox
- Radar
- Library

新版建议：

- `Capture Queue`
- `Signal Queue`
- `Memory Store`
- `Derived Outputs`

解释：

- `Capture Queue`：用户主动收集的候选
- `Signal Queue`：系统围绕项目主动监测到的候选
- `Memory Store`：确认后进入长期记忆系统
- `Derived Outputs`：从记忆中生成的 brief、review、checklist、专题页

这样比单纯入库更符合现在 agent 产品的价值链。

### 7.2 引入“证据优先”的沉淀机制

每条沉淀内容不只保留摘要，还要保留：

- source
- quote / evidence span
- extracted claim
- project relevance
- confidence
- related memories

原因很简单：

2026 年用户已经不满足于“AI 说了一个总结”，而更关心“它是从哪来的”。

### 7.3 引入“主动比较”而不是只做“主动推荐”

系统自动发现一条新内容时，不应只说：

- 推荐给你

而应尽量说：

- 它补充了哪条旧记忆
- 它和你之前的判断是否冲突
- 它是否改变当前项目的方向

这会让产品明显从内容消费工具升级为研究辅助工具。

### 7.4 引入“技能沉淀”

Hermes 给出的一个重要启发是：

**agent 的价值不仅来自记住资料，也来自记住做事方式。**

所以 MemexFlow 可以有轻量版 `Skills`：

- 读论文流程
- 周报生成流程
- 面试资料整理流程
- 产品竞品扫描流程

开始时不需要让系统自动发明复杂技能，
但至少要允许：

- 保存 workflow 模板
- 在项目中复用
- 通过历史表现持续改进

## 8. 获取渠道策略

渠道设计是这个项目里非常关键的一部分。

原因不是“接得越多越好”，而是：

- 渠道会直接决定候选内容的信噪比
- 渠道会直接决定抽取和结构化的稳定性
- 渠道会直接决定产品最后看起来像“研究工作台”还是“信息推荐流”

所以第一原则应该不是追求全覆盖，而是优先接入：

- 高信噪比
- 高信息密度
- 可解析
- 可归档
- 与项目目标强相关

### 8.1 渠道分成两类，不要混做一个入口

第一类是 `Capture Channels`，也就是用户主动带进系统的内容：

- URL / article links
- PDF
- quick notes
- web clips
- chat transcripts
- imported docs

第二类是 `Signal Channels`，也就是系统围绕项目主动监测的内容：

- RSS / blog feeds
- GitHub releases / repo watch
- arXiv / Semantic Scholar
- official docs / changelog updates
- newsletters

这两类在产品上都叫“获取渠道”，但背后的任务完全不同：

- `Capture` 解决的是低摩擦输入
- `Signals` 解决的是围绕项目的持续监测

如果把两者混在一起，用户会很难理解为什么有些内容是自己收进来的，有些是系统主动推来的。

### 8.2 第一梯队渠道：MVP 必做

这几类渠道最适合做第一版，因为它们既高频，又能体现产品闭环。

#### 1. URL

为什么优先：

- 适配面最广
- 用户习惯成熟
- 演示最直观
- 能覆盖文章、博客、公告、帖子、文档页

建议抽取字段：

- canonical URL
- title
- site / author
- publish time
- raw content
- summary
- key claims
- quoted evidence spans
- related project

#### 2. PDF

为什么优先：

- 论文、报告、课程资料、面经、简历材料都依赖它
- 最能体现“研究系统”而非“收藏夹”

建议抽取字段：

- file metadata
- parsed text
- section structure
- figures / tables references
- summary
- claims
- citations / evidence spans
- project relevance

#### 3. Quick Note

为什么优先：

- 没有用户自己的判断，就没有真正的 personal memory
- 这是区分“资料库”和“个人研究系统”的关键

建议抽取字段：

- note title
- body
- author
- created at
- project
- explicit takeaway
- open questions
- linked sources

#### 4. Web Clipper

为什么优先：

- 比单纯 URL 更适合“证据优先”沉淀
- 支持只截取真正重要的片段

建议抽取字段：

- source URL
- page title
- selected snippet
- surrounding context
- screenshot optional
- user note
- related claim
- project binding

#### 5. RSS / Feed

为什么优先：

- 主动监测里最稳定
- 适合 AI、产品、研究博客和 changelog
- 技术实现成本远低于高噪音社媒抓取

建议抽取字段：

- feed source
- item URL
- title
- published at
- short summary
- novelty reason
- matched project / rule

#### 6. GitHub Releases / Repo Watch

为什么优先：

- 对 AI、Agent、工具链跟踪价值极高
- 很容易从“新动态”进一步转成“对项目的影响”

建议抽取字段：

- repo
- release tag / commit ref
- release time
- release notes
- matched keywords
- impact on project
- related memories

### 8.3 第二梯队渠道：很值得做，但可以晚一个版本

#### 1. arXiv / Semantic Scholar

适合：

- 学术研究
- 模型 / agent / memory / PKM 领域追踪

价值很高，但建议第二阶段做，原因是：

- 需要更好的去重
- 需要更好的摘要与 claim 抽取
- 最好同时做 paper-to-project relevance 判断

#### 2. Readwise Import / Readwise MCP

适合：

- 快速接入历史高质量阅读数据
- 把现成 highlights 变成长期记忆

很适合做增强项，但第一版不一定必须，因为它依赖外部生态和授权链路。

#### 3. Newsletter Forwarding

适合：

- AI 行业动态
- 工具更新
- 产品分析

价值在于内容质量通常高于社媒，但解析邮件和去重会增加系统复杂度。

#### 4. Chat Transcript Import

适合：

- 与 ChatGPT / Claude / Gemini 的长对话
- 项目讨论记录
- 中间判断过程沉淀

这类数据很有价值，但需要更谨慎的分段、摘要和隐私处理，所以适合第二阶段。

### 8.4 第三梯队渠道：不要在第一版过早投入

#### 1. 高噪音社媒流

例如：

- X
- Reddit
- 小红书
- 即刻

不是说完全没价值，而是第一版风险太大：

- 噪音高
- 重复多
- 结构化差
- 很容易把产品带向“推荐信息流”

#### 2. 全量邮箱接管

问题在于：

- 权限重
- 噪音大
- 内容类型过杂
- 很快会偏离项目型研究产品

#### 3. 全渠道 IM 同步

例如 Slack / Telegram / Discord 全量接入。

这类能力更像 assistant platform，不适合第一版的求职项目范围。

### 8.5 推荐的 MVP 接入顺序

如果你要控制范围，同时又保住演示效果，我建议按这个顺序做：

1. `URL`
2. `PDF`
3. `Quick Note`
4. `RSS / Feed`
5. `GitHub Releases / Repo Watch`
6. `Web Clipper`

这个顺序的逻辑是：

- 先完成最基础的项目输入闭环
- 再完成最有说服力的主动监测闭环
- 最后再补强证据化沉淀体验

如果只能做 4 个渠道，就做：

- URL
- PDF
- Quick Note
- RSS

这已经足够支撑完整 demo。

### 8.6 每个渠道都要统一进入同一个候选模型

无论来自哪种渠道，第一版都建议统一收敛成一个 `candidate` 实体，再由后续流程处理。

`candidate` 最少应包含：

- `id`
- `channel_type`
- `source_type`
- `source_uri`
- `project_id`
- `title`
- `raw_content`
- `ingested_at`
- `published_at`
- `summary`
- `claims`
- `evidence_spans`
- `relevance_reason`
- `status`

这里最重要的不是字段多少，而是：

- 不要为每个渠道造一套完全不同的处理链
- 要尽快统一到候选池
- 让后续的 compare / brief / recall 逻辑能够复用

### 8.7 渠道策略如何服务产品定位

这部分很重要，因为它决定你在面试时讲出来像不像一个有判断的产品。

MemexFlow 不应该说：

- 我支持很多导入方式

而应该说：

- 我优先支持最适合长期项目研究的输入与监测渠道

这两种说法差别很大。

前者是功能堆叠。
后者是产品判断。

## 9. 技术架构建议

如果你把这个项目作为实习求职作品，最好的策略不是做一个特别重的 agent runtime，而是做一个：

- 结构清晰
- 可演示
- 有现代 agent 基础设施意识
- 又不至于把时间都烧在运维上

### 9.1 建议的总体架构

- `Frontend`: Web app
- `Backend API`: app server + auth + orchestration endpoints
- `Worker`: ingestion / extraction / summarization / retrieval / briefing jobs
- `Database`: relational DB + vector search + full-text search
- `Blob Storage`: PDFs, screenshots, raw pages

### 9.2 存储层不要一上来上图数据库

推荐起步做法：

- Postgres
- `pgvector`
- 原生全文搜索
- 关系表显式建模 entities / claims / sources / projects / memories

不要第一版就上 Neo4j。
因为对求职项目来说，清晰的数据结构比“我用了知识图谱”更重要。

### 9.3 Retrieval 不要只做简单 RAG

建议做成：

- lexical search
- vector retrieval
- project-scoped retrieval
- citation assembly
- memory-type aware retrieval

也就是检索时区分：

- 原文证据
- 过去摘要
- 已抽取 claim
- 用户自己的判断笔记

### 9.4 Agent 层尽量做“监督式异步”，不要一开始追求全自动自治

更合适的第一版 agent 设计：

- 用户发起任务
- agent 在后台分步骤执行
- 每一步有可见状态
- 涉及写入、外部调用或高成本任务时需要确认

不要把第一版做成：

- 无边界自动跑
- 自己乱改库
- 自己对外发消息

这是吸取 OpenClaw 类产品在运行安全和复杂度上的经验教训。

### 9.5 集成层优先走 MCP-first

第一版可以先做少量高价值连接器：

- Web search
- URL / article parser
- PDF parser
- local files
- Readwise MCP

原因：

- 这比自建一堆 ad-hoc connector 更现代
- 更容易讲“项目兼容最新 agent 生态”
- 后面扩展到其他工具也顺手

### 9.6 UI 层要准备好走 agent-native 方向

2026 年一个很新的信号是：

- MCP Apps 已经把交互式 UI 带进协议层
- Google A2UI 也在推动 agent-driven interfaces

对 MemexFlow 的实际启发是：

- 不要把 UI 只理解成传统 dashboard
- 要预留“agent 产出一个可交互卡片 / 表单 / brief 面板”的设计空间

也就是说，未来某些页面本身可以视作 agent 输出的工作界面。

### 9.7 是否应该引入 harness 思想

短结论：

**应该吸收 harness 思想，但不应该在第一版把 Anthropic Managed Agents 本身作为产品的核心依赖。**

这里说的 `harness`，不是单指某一个 API，而是一整套 agent runtime 设计思想。

从 Claude Managed Agents 官方文档来看，这套思想至少包括：

- `Agent`：模型、system prompt、tools、MCP servers、skills 的版本化定义
- `Environment`：独立配置的执行环境，负责 packages、networking、mounted files
- `Session`：围绕单个任务运行的 agent 实例
- `Events`：事件流式驱动的执行与可观测性
- `Permission policies`：工具执行的审批边界
- `Memory stores`：跨 session 持续记忆
- `Outcomes`：把任务从“对话”提升为“带验收标准的工作”

这些设计对 MemexFlow 是有启发的，因为它本来就不是一个聊天产品，而是一个：

- 长任务
- 异步执行
- 需要可追踪过程
- 需要跨轮累积记忆
- 需要生成产物

的研究系统。

#### 9.7.1 最值得吸收的 5 个 harness 思想

##### 1. 把 agent 从“一个 prompt”升级成“一个可版本化的工作单元”

Anthropic 的 agent 定义是独立资源，session 启动时可以引用最新版本，也可以 pin 到特定版本。

这对 MemexFlow 很有价值，因为你后面很可能会出现多类 agent：

- signal analyst
- claim extractor
- brief writer
- compare memo reviewer
- recall planner

如果这些能力都只是散落在代码里的 prompt 模板，后面会非常难维护。

更合理的做法是：

- 把 agent spec 单独建模
- 明确 version
- 明确可用工具、skills、权限策略
- 把每次任务运行都和具体 agent version 绑定

这样做最大的好处不是炫技，而是可复盘。

##### 2. 把任务执行建模成 session，而不是一次性请求

Claude Managed Agents 的 session 是状态机，事件推动执行。

这很适合 MemexFlow，因为它大量任务都不是“一问一答”：

- 跑一轮项目资料整理
- 监测新信号并比较旧证据
- 生成 weekly brief
- 根据 rubric 检查输出是否满足要求

对 MemexFlow 来说，这意味着产品层也应该有自己的：

- `job`
- `session`
- `run`

抽象，而不是只有 `POST /generate` 这种薄接口。

##### 3. 事件流和可观测性应该是一等公民

Anthropic 的 session event stream 把：

- user events
- agent events
- session status
- tool use
- span / outcome events

都变成可观察的事件流。

对 MemexFlow 的直接启发是：

- 不要把 agent 过程藏在一个 loading spinner 后面
- 应该让用户能看到“它查了什么、比较了什么、为什么停下来、哪里需要确认”

这和 MemexFlow 想强调的 `evidence-backed`、`reviewable`、`not fully autonomous` 完全一致。

##### 4. 权限策略应该进产品设计，而不是事后补安全

Anthropic 在 permission policies 里把工具调用分成：

- `always_allow`
- `always_ask`

并且对 MCP toolset 默认是 `always_ask`。

这背后的思想很值得直接吸收：

- 默认不要让高风险工具自动执行
- 新接入的外部工具默认要经过确认
- 工具权限应该按 toolset 和单个工具细分

对 MemexFlow 来说，最合理的映射是：

- 搜索、抓取、解析类操作：可自动执行
- 写入外部系统、发送消息、修改数据：默认 ask
- 高成本长任务：需要预算或显式确认

##### 5. `Outcome` 比“让模型随便写一份总结”更适合研究型产物

Anthropic 的 `outcome` 设计有一个很重要的思想：

- 先定义 done 是什么
- 再让 agent 迭代直到满足 rubric 或到达迭代上限

这比普通 prompt 直接生成摘要更适合 MemexFlow 的输出层。

因为 MemexFlow 真正想生成的东西不是闲聊式回答，而是：

- weekly brief
- compare memo
- interview prep pack
- contradiction report

这些产物都天然适合：

- description
- rubric
- iteration limit
- evaluation result

的工作流。

#### 9.7.2 哪些地方不应该直接照搬

##### 1. 不要把 Anthropic memory stores 当成主知识库

官方文档明确说：

- sessions 默认是 ephemeral
- memory store 是 workspace-scoped 的 text documents
- 它更适合 user preferences、project conventions、prior mistakes、domain context

这类 memory 很有用，但它不是 MemexFlow 的 canonical memory model。

MemexFlow 自己的主存储仍然应该是：

- projects
- sources
- evidence spans
- claims
- briefs
- recalls

也就是说：

- Anthropic memory 更适合做 `agent working memory / procedural memory`
- MemexFlow database 才应该是 `product source of truth`

##### 2. 不要把 provider-specific harness 直接写死到核心架构

Claude Managed Agents 目前仍然是 beta，memory / outcomes / multiagent 还是 research preview。

如果第一版就把整个产品绑在 Anthropic 的 managed runtime 上，会有几个问题：

- vendor lock-in 太重
- beta 行为仍可能变化
- 你的项目差异化会被 runtime 供应商吞掉
- 本来该自己掌握的数据模型会被外部执行模型牵着走

所以更好的做法是：

- 在产品层定义自己的 task/session abstraction
- 在 provider 层做 Anthropic adapter
- 把 Managed Agents 作为一种可插拔 backend，而不是产品本体

##### 3. 不要一上来追求 multiagent

Anthropic 的 multiagent 很强，但它本质上适合：

- 多个边界清晰的子任务
- 并行工作
- 明确分工

这对 MemexFlow 未来有价值，但不应成为 MVP 前提。

第一版更合理的是：

- 单 agent + 明确 session flow
- 必要时再加一个 reviewer / verifier agent

如果一开始就上 orchestrator + subagents，复杂度会远超项目收益。

#### 9.7.3 对 MemexFlow 最合理的落地方式

最适合的不是“把 Anthropic Managed Agents 接进来”，而是：

**把 MemexFlow 设计成 harness-compatible 的产品。**

具体来说：

##### 产品层

- `Project` 仍然是核心对象
- `Memory Store` 仍然由产品数据库掌管
- `Brief`、`Recall`、`Signals` 仍然是一级对象

##### 执行层

- 引入 `agent_spec`
- 引入 `task_run / session_run`
- 每次运行都记录事件流、工具调用、输入材料和输出产物
- 支持 interrupt、resume、approval

##### provider 层

- 默认先用你自己的 worker orchestration
- 预留 Anthropic Managed Agents adapter
- 后续如果有需要，再把某些长任务切到托管 harness 上

#### 9.7.4 最适合用 harness 思想的功能

如果只选 4 类最适合的场景，我会选：

##### 1. Brief generation

最适合 outcome + rubric + iteration。

##### 2. Signals triage

最适合 session + events + approval。

##### 3. Compare memo / contradiction analysis

最适合 evidence-aware agent run + traceable outputs。

##### 4. Workflow skills

最适合吸收 Anthropic `skills` 的思想，把常用研究流程做成可复用 workflow。

#### 9.7.5 不适合用 harness 思想主导的功能

这几类更应该保持确定性 pipeline，而不是交给 agent runtime 主导：

- URL / PDF ingestion
- parsing
- chunking
- metadata extraction
- canonical source storage
- deterministic indexing

原因很简单：

- 这些环节追求稳定、便宜、可重复
- 不需要重型 agent runtime

#### 9.7.6 最终判断

如果要一句话定性：

**MemexFlow 应该吸收 harness 的架构思想，但把它限制在“任务执行层”，而不是“产品核心层”或“知识主存储层”。**

再说得更直接一点：

- 应该学习 Anthropic Managed Agents 的 `agent/environment/session/events/permissions/outcomes` 思路
- 不应该在第一版把 MemexFlow 做成 Anthropic Managed Agents 的皮肤层

前者会增强你的产品结构成熟度。
后者会削弱你的独立产品判断。

### 9.8 横向调研：harness 已经成为 agent 运行层共识

Anthropic 不是唯一在推动 harness 思想的公司，但它目前是表达得最完整、概念边界最清晰的一家。

更准确地说，截至 2026 年 4 月，行业的真实趋势不是：

- 大家都在使用同一个词

而是：

- 大家都在补同一层能力

也就是 agent 的运行层、控制层和可观测层。

有的体系叫：

- `managed agents`
- `agent runtime`
- `app server`
- `durable execution`
- `stateful agents`
- `flows`

但它们处理的其实是同一类问题：

- agent 如何持续运行
- agent 如何跨轮保持状态
- agent 如何安全调用工具
- agent 如何暂停、恢复、等待审批
- agent 如何留下可调试、可评估的执行轨迹

#### 9.8.1 OpenAI：已经明确开始使用 harness 语言

OpenAI 在 2026 年 Q1 的几篇官方文章里，已经直接把 `harness` 从内部工程概念抬到了公开叙事层。

最典型的是：

- `Unlocking the Codex harness`
- `Harness engineering`

从这些资料里可以看出，OpenAI 所说的 harness 不只是“模型调工具”，而是一整层：

- thread lifecycle and persistence
- config and auth
- tool execution and extensions
- bidirectional event stream
- approval pause / client response

这套设计和 Anthropic Managed Agents 的差异主要不在能力边界，而在暴露方式：

- Anthropic 更像托管 agent runtime
- OpenAI 更强调 harness 如何通过 App Server 暴露给不同 client surfaces

对 MemexFlow 的启发是：

- harness 不只是 server 端执行逻辑
- 还包括 client protocol、thread primitives、artifact/event 表达方式

也就是说，如果你未来希望：

- Web 前端
- 可能的桌面端
- 可能的浏览器扩展

共享同一套 agent 能力，那么 `thread / turn / item / event` 这类原语会比单纯的 REST endpoint 更稳。

#### 9.8.2 Google ADK：虽然少说 harness，但本质上就是 harness primitives 框架

Google ADK 的官方文档没有强推 `harness` 这个词，但它提供的能力已经非常典型：

- agent runtime
- event loop
- sessions
- state
- memory
- artifacts
- callbacks
- evaluation
- API server

它的风格和 Anthropic / OpenAI 不太一样：

- Anthropic 偏托管产品
- OpenAI 偏 App Server + client protocol
- Google ADK 更像一套结构化、强组件化的 agent 开发框架

ADK 这条路线最重要的启发是：

**一个成熟的 harness 不只要处理消息和工具，还要显式处理 artifacts、callbacks、evaluation。**

这对 MemexFlow 很 relevant，因为：

- PDF
- 图片
- brief 文档
- 对比报告

这些东西都更像 artifacts，而不是单纯文本消息。

#### 9.8.3 LangGraph：把 harness 明确讲成 durable execution

LangGraph 很少高频使用 harness 这个词，但它实际上是在回答一个很关键的问题：

**长任务 agent 如何可靠运行。**

它的官方文档把重点放在：

- persistence
- durable execution
- interrupts
- memory
- subgraphs
- time travel

它强调的是：

- agent 不是一次请求
- agent 是可暂停、可恢复、可追溯的长期工作流

和 Anthropic 的 session/event 模型相比：

- Anthropic 更像 managed harness
- LangGraph 更像 self-hosted runtime framework

对 MemexFlow 的启发非常直接：

- `Signals triage`
- `Brief generation`
- `Compare memo`
- `Recall planning`

这些都不是一发即得的请求，而更像 durable workflows。

所以如果你要在技术上表达成熟度，最值得吸收的不是“图式编排”本身，而是：

- checkpoint / persistence
- interrupt / resume
- human-in-the-loop
- replay / traceability

#### 9.8.4 AutoGen：更像多 agent 协作 runtime

Microsoft AutoGen 这条线更偏：

- agent teams
- handoff
- human-in-the-loop
- state management
- tracing / observability
- code executors
- MCP tools

它和 Anthropic / LangGraph 的差异在于：

- 它更强调多 agent 协作与执行器

这条路线对 MemexFlow 的启发是：

- future-facing 地说，确实可以存在 analyst / reviewer / planner 这种角色分工
- 但 MVP 没必要先做 team runtime

更值得吸收的是：

- execution sandbox
- tool adapters
- paused-for-feedback 的交互模型

而不是一开始就追求复杂的 multi-agent mesh。

#### 9.8.5 Letta：memory-first harness 的代表

Letta 这条线特别值得关注，因为它几乎把“为什么要有 harness”解释成了“为什么要有 stateful agents”。

它的核心不是 orchestration，而是：

- memory blocks
- shared memory
- archival memory
- long-running executions
- MCP tools
- agent file

Letta 官方对 memory blocks 的定义非常清晰：

- 它们是 agent context window 里的结构化部分
- persist across all interactions
- always visible
- 不需要 retrieval

这让 Letta 更像：

- 一个 memory-first 的 stateful agent runtime

对 MemexFlow 来说，这条线尤其重要，因为你的产品核心就是：

- 长期记忆
- 项目上下文
- 用户偏好与判断累积

不过也要注意边界：

- Letta 更适合做 agent 的工作记忆与状态编排
- MemexFlow 仍然需要自己的 canonical product memory model

#### 9.8.6 CrewAI：把 harness 能力包装成 workflow 层

CrewAI 的路线更偏产品化和 workflow 化。

它在官方文档里强调：

- flows
- state management
- event-driven architecture
- event listeners
- memory
- MCP integration

这条路线的启发是：

- 并不是每个项目都需要自己发明一套底层 runtime
- 很多时候，一个“可观察的、带状态的 workflow layer”就足够承担 harness 职责

对 MemexFlow 来说，这意味着：

- 一部分 agent 能力完全可以先实现成 workflow
- 不一定一上来就要做通用 runtime

#### 9.8.7 横向对比后的结论

如果把这些体系抽象到同一层，你会发现它们正在快速收敛到一组共享 primitives：

- `Agent spec`
- `Execution environment`
- `Thread / Session / Run`
- `State / Memory`
- `Event / Trace`
- `Tool execution`
- `Approval / HITL`
- `Artifacts / Files`
- `Evaluation / Outcomes`
- `Interrupt / Resume`

这也是为什么我认为：

**harness 不是一个短期 buzzword，而是 agent 产品正在补的运行层基础设施。**

#### 9.8.8 对 MemexFlow 的实际建议

这轮横向调研之后，建议可以更明确一些：

##### 应该吸收的

- Anthropic 的 managed agent primitives
- OpenAI 的 harness / app-server / thread-turn-item-event 思路
- Google ADK 对 sessions、artifacts、evaluation 的显式建模
- LangGraph 的 durable execution 与 interrupt / resume
- Letta 的 memory-first state abstraction
- CrewAI 的 workflow + event-listener 实践

##### 不应该去做的

- 不做通用 harness 平台
- 不做 provider-specific 托管壳子
- 不做第一版就过重的 multi-agent orchestration
- 不做和产品主存储混在一起的 provider memory

##### 最合理的定位

MemexFlow 最适合做的是：

- 一个 `harness-aware` 的 personal research system

也就是：

- 产品有自己的 project / memory / brief / recall 数据模型
- 执行层吸收 harness primitives
- provider 层保持可替换

如果只保留一句话：

**MemexFlow 不需要自己成为下一个 harness 产品，但必须拥有一层现代 harness 思维下的执行架构。**

### 9.9 对 Linux.do harness 实践主贴的判断

除了官方材料之外，社区里也已经出现了一批把 harness 思想转成具体工程套路的经验帖。

其中一个典型样本，是 Linux.do 上那篇围绕 Claude Code 展开的 harness 实践主贴。

这类材料的价值不在于定义新概念，而在于：

- 它把官方文章里较抽象的思路，翻译成可执行的工程结构
- 它能帮助我们判断哪些想法在真实开发流程里是“可跑”的

但也必须明确：

**这类帖子是二手实践样本，不是产品架构的最终依据。**

#### 9.9.1 这篇主贴最值得吸收的地方

如果把主贴内容压缩成最有价值的部分，我认为主要是 4 点：

##### 1. 它正确地把 harness 理解为“长期运行壳”，而不是单个 prompt

这点和 Anthropic、OpenAI 的官方表达是一致的。

主贴强调的不是：

- 再写一个更强的系统提示词

而是：

- 用外部记忆、流程编排、验证闭环把 agent 包起来

这个方向本身是对的。

##### 2. 它正确地把“共识记忆”当成一等公民

主贴用 `.web-builder/` 目录去承载：

- spec
- feature list
- sprint plan
- progress
- design tokens

这和 Anthropic 在早期 harness 文章里强调的：

- progress file
- feature list
- clean handoff materials

是同一类思想。

对 MemexFlow 的启发是：

- agent 不应只靠上下文窗口维持连续性
- 必须有外部、结构化、可持久化的共享记忆

##### 3. 它把 `planner / generator / evaluator` 讲成了一个可执行闭环

主贴最强的地方不是“三层角色”本身，而是它明确构造了：

- 规划
- 实现
- 验收
- 失败回流

的循环。

这对 MemexFlow 很有启发，因为你的产物也不是一次性文本，而是：

- brief
- compare memo
- recall pack

这类需要反复检查是否满足标准的结果。

##### 4. 它抓住了“可执行验证”比“协议纯度”更重要

主贴用 Playwright 去做端到端验证，而后续讨论里又补充说明，实际落地时未必一定是 MCP，也可能是直接写 Playwright 脚本。

这说明它真正抓住的是：

- 验收闭环必须可执行

而不是：

- 是否使用某种最时髦的协议

这点很务实，也很值得保留。

#### 9.9.2 这篇主贴不能直接照搬的地方

主贴的局限也很明显。

如果不加区分地把它当成方法论，很容易把 Claude Code 场景下的局部经验误当成通用原则。

##### 1. 它本质上是 coding harness 经验，不是通用 research harness

这篇主贴最自洽的应用场景是：

- 长时间迭代开发一个 Web 应用

在这个场景里：

- planner / generator / evaluator
- Playwright 验证
- sprint plan
- feature list

都很自然。

但 MemexFlow 是个人研究系统，不是通用 Web builder。

所以你不能直接把：

- Playwright evaluator
- 页面验收
- 前端构建闭环

原封不动迁移过来。

对 MemexFlow 来说，更合理的 evaluator 应该是：

- evidence coverage
- citation correctness
- contradiction detection
- brief rubric checking

##### 2. 它弱化了 git / clean state 的重要性

主贴在工程步骤里把中间的 git / PR 流程降得比较低，更强调 sprint 文件和共享目录。

但 Anthropic 更早的 harness 文章其实把：

- git history
- progress file
- clean state

看作长任务交接和恢复的重要组成部分。

对 MemexFlow 来说，这意味着：

- 外部记忆文件当然重要
- 但版本化、状态恢复、可回滚同样重要

不能因为 demo 为了省 token，就把这些长期可靠性机制看成可有可无。

##### 3. 它对 state、observability、长期治理展开不够

主贴最有价值的是流程闭环，但它没有系统展开：

- state model
- event trace
- execution logs
- quality drift
- garbage collection

而这些恰恰是 OpenAI、LangGraph、Anthropic 在更成熟材料里特别强调的部分。

所以如果只学这篇主贴，容易做出：

- 能跑起来
- 但长期难维护

的 harness。

##### 4. 它有一部分内容属于作者个人经验，不宜上升成通则

例如：

- 如何组织 command / subagent
- 如何使用 Claude Code 的 skill
- 某些交互模式是否值得用

这些更像：

- 当前工具链下的实践经验

而不是：

- 放之四海而皆准的架构原则

对 MemexFlow 来说，应该吸收的是“结构”，不是“Claude Code 的具体手法”。

#### 9.9.3 这篇主贴对 MemexFlow 最有价值的启发

如果把这篇主贴真正翻译到 MemexFlow，我认为最值得迁移的是下面这几条：

##### 1. Project Memory 应该显式外化

也就是不要只把记忆藏在：

- prompt
- hidden retrieval
- session state

而要有可见的、结构化的项目工件，例如：

- project brief
- working assumptions
- active questions
- evidence list
- claim ledger
- progress notes

##### 2. Brief / Recall 生成应当有 evaluator

不是生成完就结束，而应该引入轻量验收：

- 是否覆盖关键来源
- 是否提供足够引用
- 是否遗漏冲突证据
- 是否满足目标模板

##### 3. 执行层要支持回流，而不是只支持一次生成

也就是：

- planner 规划
- generator 产出
- evaluator 发现问题
- 再次修正

这套闭环比“更大的上下文窗口”更重要。

##### 4. 共享记忆和执行状态要分层

主贴把很多东西放在共享目录里，这在 coding harness 场景下很自然。

对 MemexFlow 来说，更成熟的做法应该是分成：

- `canonical product memory`
- `working artifacts`
- `execution state`

也就是：

- 正式知识和项目记忆进入产品数据库
- 任务中间工件进入 artifacts / docs
- 运行态信息进入 session / run logs

这样会比简单堆文件夹更稳。

#### 9.9.4 最终判断

这篇 Linux.do 主贴可以作为一个很好的“工程感样本”，说明 harness 思想已经从官方文章进入到开发者实践层。

但对 MemexFlow 来说，最好的用法不是照搬，而是：

- 保留它的闭环意识
- 保留它的外部记忆意识
- 保留它的可执行验证意识
- 丢掉它过强的 Claude Code / Web builder 场景依赖

如果只保留一句话：

**这篇主贴适合拿来学习“如何把 harness 跑起来”，不适合直接当作“MemexFlow 的架构蓝图”。**

### 9.10 技术栈选择：优先做成跨平台 app，而不是继续走 Web-first

如果你的目标是：

- 明显区别于你此前的 Web 全栈项目
- 优先做成真正的 app，而不是网页壳子
- 同时覆盖桌面和移动端
- 需要较强的本地存储、文件访问、离线和同步能力

那么技术栈选择的判断标准应该是：

- 是否真的覆盖 `desktop + mobile`
- 是否适合 `local-first`
- 是否方便处理 PDF、文件、SQLite、后台任务
- 是否能把 Web 放在次要位置，而不是产品默认形态
- 是否适合一个人快速做出稳定 MVP

#### 9.10.1 前端框架候选的结论先说

如果按 MemexFlow 当前的需求排序，我的推荐顺序是：

##### 第一选择：Flutter

适合做：

- 主体产品
- 桌面端 + 移动端共享主代码库
- Web 作为后续补充，而不是主战场

##### 第二选择：Tauri 2 + TypeScript 前端

适合做：

- 桌面优先的 app
- 希望尽量复用 Web 技术栈
- 同时保留未来上移动端的可能性

##### 第三选择：Compose Multiplatform

适合做：

- 希望更偏原生 app 技术路线
- 愿意接受 Kotlin 学习成本
- 想把 Android / iOS / Desktop 都做得更“native”

##### 不建议作为主路线：Expo / React Native

不是说它不行，而是：

- 它更适合 mobile-first
- Web 体验和生态很成熟
- 但桌面不是最自然的主战场

##### 不建议作为主路线：Electron

原因很简单：

- 它解决的是桌面
- 不解决移动端
- 安全和资源占用也不是这一题最优

#### 9.10.2 为什么我更推荐 Flutter

Flutter 对你这个项目最大的优势，不是“它很火”，而是它和问题形态很匹配。

##### 1. 真正意义上的多端主代码库

Flutter 官方仍然明确把自己定义成：

- single codebase
- mobile
- desktop
- web

而且桌面支持是正式能力，不是外挂路线。

这对 MemexFlow 很关键，因为你更可能需要的是：

- macOS / Windows 桌面端作为主工作台
- iOS / Android 作为采集和轻回顾入口

而不是“先做网页，再包装成 app”。

##### 2. 更适合做“产品感强”的跨端 UI

MemexFlow 不是一个简单表单应用。

它后面会有很多带产品感的界面：

- project workspace
- source reader
- evidence panel
- compare memo view
- recall dashboard

Flutter 在这类统一视觉语言、多平台一致性、复杂卡片和响应式布局上，天然更顺。

##### 3. 本地存储和离线策略更自然

Flutter 官方文档已经把：

- 文件读写
- key-value 存储
- SQLite
- SQL 架构分层

都纳入正式文档体系。

这意味着如果你要把 MemexFlow 做成：

- local-first
- SQLite-backed
- 可离线读写

Flutter 是一条比较顺的路。

##### 4. 它能明显拉开你和“又一个 Web 项目”的距离

你已经有多段 Web 项目经验了。

如果 MemexFlow 继续做成：

- Next.js 前端
- Web dashboard
- 再套一个 app shell

那在作品层面，差异感没那么强。

Flutter 的好处是：

- 一眼看上去就是 app 项目
- 同时又能讲清楚跨平台能力

这对求职展示其实有加分。

#### 9.10.3 为什么 Tauri 2 是第二选择，而不是第一选择

Tauri 2 到 2026 年已经是一个很强的候选。

它的优点非常明确：

- 桌面体验成熟
- 现在也支持 Android / iOS
- 官方插件里就有 `fs`、`sql`、`http`、`store` 等能力
- 权限和 capability 模型很适合强调安全边界

如果你的目标是：

- 尽快做出一个桌面版
- 最大化复用 TypeScript / React / 前端工程经验

那 Tauri 2 其实很合理。

但它排在 Flutter 后面的原因也很明确：

##### 1. 它依然更偏 desktop-first

Tauri 团队自己在 v2 RC 时也明确说过：

- 可以做 production-ready mobile applications
- 但不希望把 v2 说成“mobile as a first class citizen” release

这说明它的移动能力已经可用，但心智中心仍更偏桌面。

##### 2. 你会同时背两套复杂度

如果用 Tauri，你本质上要同时处理：

- 前端框架
- Rust host / plugin / permissions

这对一个人做求职项目来说，不一定是最好的复杂度分配。

##### 3. 它虽然是 app，但 UI 方法论仍然很接近 Web

这不是缺点，但如果你的目标之一是摆脱“又一个 Web 项目”的观感，
那么 Tauri 的视觉和开发方式仍会保留较强 Web 痕迹。

#### 9.10.4 为什么 React Native / Expo 不适合做主路线

Expo 和 React Native 在 2026 年依然很强，特别是：

- iOS / Android
- Web
- Metro / Expo Router / local-first 原生应用体验

Expo 甚至已经把：

- SQLite
- FileSystem
- local-first architecture

都整理得很成熟。

问题不在移动端，而在于：

**MemexFlow 更像 desktop-led product，而不是 mobile-led product。**

如果你把它做成移动优先，会遇到几个现实问题：

- PDF 阅读和长文比较更适合大屏
- project workspace 更适合桌面
- 多栏 evidence / brief / memory 视图更适合桌面

React Native 当然可以上桌面，但 Windows / macOS 需要走额外路线，而且桌面并不是 React Native 默认最强的场景。

所以它更适合作为：

- 以后如果需要再补的移动 companion

而不是当前主栈。

#### 9.10.5 Compose Multiplatform 为什么值得关注

Compose Multiplatform 是一个很强但更“工程师导向”的选项。

它现在在官方文档里已经明确：

- Android Stable
- iOS Stable
- Desktop Stable
- Web (Wasm) Beta

这说明它在“移动 + 桌面，Web 次要”这个结构上，其实很符合你的偏好。

它最大的优点是：

- 更偏 native app 技术路线
- Kotlin 共享业务逻辑和 UI
- 产品气质更像原生应用而不是包装网页

但它不是第一选择的原因在于：

- Kotlin / Gradle / multiplatform 工具链学习成本更高
- 对你当前背景来说，不如 Flutter 那样更容易快速出效果

所以我会把它定义成：

- 很值得关注
- 但不一定是你当前求职节奏下最优的第一枪

#### 9.10.6 我给 MemexFlow 的推荐栈

如果今天就要拍板，我建议采用下面这套：

##### 客户端

- `Flutter`
- 首发目标：`macOS + Windows`
- 第二阶段补：`iOS + Android`
- Web 暂时不做正式产品，只保留未来补位能力

##### 客户端本地数据层

- `SQLite`
- 本地文件目录保存：
  - PDF
  - clipped article raw text
  - generated brief snapshots
- 本地全文搜索优先走 `SQLite FTS`

也就是说第一版就按：

- local-first
- offline-capable

来设计，而不是每次都先请求服务器。

##### 服务端

- `Supabase`

原因：

- `Postgres`
- `Auth`
- `Storage`
- `pgvector`
- 官方明确支持 Flutter 客户端

对 MemexFlow 来说，这套后端非常顺手：

- 结构化数据进 Postgres
- 文件进 Storage
- 服务端检索和 embeddings 可落在 pgvector

##### AI / ingestion worker

- `Python`

原因不是“Python 更高级”，而是：

- PDF 解析
- embedding / reranking
- retrieval evaluation
- 内容抽取与批处理

这些工作在 Python 生态里仍然更顺。

所以推荐不要强行全栈同语言，而是：

- app 客户端用 Flutter
- 产品后端用 Supabase
- AI worker 用 Python

这比“为了统一语言而牺牲最合适工具”更合理。

#### 9.10.7 如果你真的很想最大化复用现有 Web 技能

那我会给出一个次优但仍然靠谱的方案：

- `Tauri 2 + React + TypeScript`
- 本地 `SQLite`
- 服务端 `Supabase`
- AI worker `Python`

它的优点是：

- 开发速度可能更快
- 你会很熟悉工程组织
- 桌面版会很快成形

但它的代价是：

- 产品很容易继续带有强 Web 感
- 移动端路径虽然存在，但不是最顺的

所以这个方案更适合：

- 如果你决定“先把 desktop 做得很强，移动以后再说”

#### 9.10.8 最终建议

如果只保留一句话：

**MemexFlow 最适合的主路线是 `Flutter + SQLite + Supabase + Python worker`。**

这是因为它最符合以下组合条件：

- 你要的是 app-first，不是 web-first
- 你要的是 desktop + mobile，而不是 mobile + web
- 你要的是 local-first memory / research product
- 你需要明显拉开与既有 Web 项目的差异

如果未来要走第二路线，再考虑：

- `Tauri 2 + TypeScript` 作为 desktop-first 方案

但不建议把它作为当前默认主栈。

## 10. 适合作为求职项目的 MVP

如果你是为了找日常实习，我建议第一阶段只做一个**非常能打但范围很克制**的版本。

建议限制渠道范围为：

- URL
- PDF
- Quick Note
- RSS / Feed

如果还有余力，再补：

- GitHub Releases / Repo Watch
- Web Clipper

### MVP 核心能力

#### 1. Project-based capture

用户可以为某个项目收集：

- 链接
- PDF
- 笔记

并自动生成：

- AI 摘要
- 候选标签
- 初步 claim
- 关联项目

#### 2. Signals monitor

用户可为项目配置 2-3 个监测规则，系统返回：

- 新内容
- 为什么重要
- 与现有项目记忆的关系

#### 3. Evidence-backed memory

用户确认后进入 Memory，且每条记忆都带：

- 来源
- 证据段
- 摘要
- claim
- 关联项目

#### 4. Brief generation

从项目资料中生成：

- weekly brief
- compare memo
- interview prep pack

这是最容易打动面试官的结果页。

#### 5. Recall loop

系统定期把旧知识重新带回来，并说明：

- 为什么现在值得重看
- 与当前项目有什么关系

### MVP 不要做的东西

- 不做全渠道聊天网关
- 不做复杂设备控制
- 不做超重多 agent mesh
- 不做“自动代替用户决策”
- 不做过度炫技的自治系统

## 11. 更适合你的叙事方式

你目前的背景是“研一下 + 找日常实习”。

所以项目叙事最重要的是：

- 你理解 2026 年 agent 产品真正的重心
- 你能把热点转成清晰产品结构
- 你没有盲目追概念

推荐你在面试或 README 里这样讲：

### 一句话版本

MemexFlow 不是另一个 AI 笔记工具，而是一个 memory-first 的个人研究系统。它把采集、长期记忆、项目监测、brief 生成和知识回流连接起来，让 agent 真正围绕个人长期项目持续工作。

### 两句话版本

过去很多 PKM + AI 产品停留在“帮你总结和检索笔记”，但 2026 年 agent 的关键差异已经变成长期记忆、跨会话连续性、证据可追溯以及可复用 workflow。MemexFlow 的设计因此从主题型知识库升级为项目型研究工作台，强调 memory store、signals monitor、evidence-backed briefs 和 recall loop。

## 12. 接下来最值得做的三件事

### 方案层

把旧版 `Dashboard / Inbox / Radar / Library / Review`，重写为：

- Home
- Projects
- Capture
- Signals
- Memory
- Briefs
- Recall

### 数据层

先把数据模型定义清楚：

- projects
- sources
- candidates
- memories
- claims
- briefs
- recalls
- workflows

### 演示层

优先做两个最能出效果的 demo：

- “从一堆链接/PDF 生成项目 brief”
- “基于旧资料 + 新信号，解释为什么这个变化值得你现在关注”

这两个 demo 足够把项目和普通 AI 笔记产品拉开。

## 13. 参考信号与资料

以下是这次重构时重点参考的公开资料，时间以 2026-04-15 前可见信息为准：

- Hermes Agent GitHub: https://github.com/nousresearch/hermes-agent
- OpenClaw GitHub: https://github.com/openclaw/openclaw
- OpenClaw Releases: https://github.com/openclaw/openclaw/releases
- MCP joins the Agentic AI Foundation (2025-12-09): https://blog.modelcontextprotocol.io/posts/2025-12-09-mcp-joins-agentic-ai-foundation/
- The 2026 MCP Roadmap (2026-03-09): https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/
- MCP Apps (2026-01-26): https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/
- A2UI: https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/
- Building agents with the ADK and the new Interactions API: https://developers.googleblog.com/building-agents-with-the-adk-and-the-new-interactions-api/
- OpenAI Unlocking the Codex harness: https://openai.com/index/unlocking-the-codex-harness/
- OpenAI Harness engineering: https://openai.com/index/harness-engineering/
- OpenAI Agents SDK: https://developers.openai.com/api/docs/guides/agents-sdk
- OpenAI Shell tool: https://developers.openai.com/api/docs/guides/tools-shell
- OpenAI Trace grading: https://developers.openai.com/api/docs/guides/trace-grading
- OpenAI MCP connectors: https://developers.openai.com/api/docs/guides/tools-connectors-mcp
- Anthropic Harness design for long-running application development: https://www.anthropic.com/engineering/harness-design-long-running-apps
- Anthropic Effective harnesses for long-running agents: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- Anthropic Managed Agents Overview: https://platform.claude.com/docs/en/managed-agents/overview
- Anthropic Managed Agents Sessions: https://platform.claude.com/docs/en/managed-agents/sessions
- Anthropic Managed Agents Permission Policies: https://platform.claude.com/docs/en/managed-agents/permission-policies
- Anthropic Managed Agents Memory: https://platform.claude.com/docs/en/managed-agents/memory
- Anthropic Managed Agents Outcomes: https://platform.claude.com/docs/en/managed-agents/define-outcomes
- Anthropic Managed Agents Multi-Agent: https://platform.claude.com/docs/en/managed-agents/multi-agent
- Claude Code Overview: https://code.claude.com/docs/en/overview
- Claude Code Skills: https://code.claude.com/docs/en/skills
- Google ADK: https://adk.dev/
- Google ADK Sessions: https://adk.dev/sessions/
- Google ADK Events: https://adk.dev/events/
- Google ADK Artifacts: https://adk.dev/artifacts/
- LangGraph Overview: https://docs.langchain.com/oss/python/langgraph/overview
- LangGraph Durable Execution: https://docs.langchain.com/oss/python/langgraph/durable-execution
- LangGraph Interrupts: https://docs.langchain.com/oss/python/langgraph/interrupts
- LangGraph Memory: https://docs.langchain.com/oss/python/langgraph/memory
- AutoGen Human in the Loop: https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/human-in-the-loop.html
- AutoGen Code Executors: https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/components/command-line-code-executors.html
- Letta Memory Blocks: https://docs.letta.com/guides/core-concepts/memory/memory-blocks
- Letta Stateful Agents: https://www.letta.com/blog/stateful-agents
- Letta ADE Overview: https://docs.letta.com/guides/ade/overview
- CrewAI Flows: https://docs.crewai.com/en/concepts/flows
- CrewAI Event Listener: https://docs.crewai.com/en/concepts/event-listener
- CrewAI Memory: https://docs.crewai.com/en/concepts/memory
- Flutter Multi-Platform: https://docs.flutter.dev/platform-integration
- Flutter Persistence Cookbook: https://docs.flutter.dev/cookbook/persistence
- Flutter SQL Architecture: https://docs.flutter.dev/app-architecture/design-patterns/sql
- Tauri v2 Start: https://v2.tauri.app/start/
- Tauri 2.0 Stable Release: https://tauri.app/blog/tauri-20/
- Tauri 2.0 Release Candidate: https://v2.tauri.app/blog/tauri-2-0-0-release-candidate/
- Expo Create a Project: https://docs.expo.dev/get-started/create-a-project/
- Expo Local-first Architecture: https://docs.expo.dev/guides/local-first/
- Expo SQLite: https://docs.expo.dev/versions/latest/sdk/sqlite
- React Native for Windows: https://microsoft.github.io/react-native-windows/
- React Native for Windows Getting Started: https://microsoft.github.io/react-native-windows/docs/getting-started
- Kotlin Multiplatform: https://kotlinlang.org/multiplatform/
- Compose Multiplatform Supported Platforms: https://www.jetbrains.com/help/kotlin-multiplatform-dev/supported-platforms.html
- Compose Multiplatform Compatibility: https://www.jetbrains.com/help/kotlin-multiplatform-dev/compose-compatibility-and-versioning.html
- Electron Introduction: https://www.electronjs.org/docs/latest/
- Electron Process Model: https://www.electronjs.org/docs/latest/tutorial/process-model
- Supabase Flutter Quickstart: https://supabase.com/docs/guides/getting-started/quickstarts/flutter
- Supabase Docs: https://supabase.com/docs/
- Linux.do harness 实践主贴: https://linux.do/t/topic/1951277/
- Notebooks in Gemini (2026-04-08): https://blog.google/innovation-and-ai/products/gemini-app/notebooks-gemini-notebooklm/
- NotebookLM Cinematic Video Overviews: https://blog.google/innovation-and-ai/products/notebooklm/generate-your-own-cinematic-video-overviews-in-notebooklm/
- Notion Research Mode: https://www.notion.com/help/research-mode
- Notion Wikis: https://www.notion.com/product/wikis
- Notion Databases: https://www.notion.com/help/intro-to-databases
- Notion Enterprise Search: https://www.notion.com/product/enterprise-search
- Obsidian: https://obsidian.md/
- Obsidian Canvas: https://obsidian.md/canvas
- Cubox Save to Cubox: https://help.cubox.cc/save/start/
- Cubox AI Insight & Ask AI: https://help.cubox.cc/reader/ai/
- Cubox Email Drop: https://help.cubox.cc/save/emaildrop/
- Cubox Smart Folders: https://help.cubox.cc/organize/smart-folders/
- Cubox Full-Text Search: https://help.cubox.cc/search/deep-search/
- Cubox Obsidian Sync Plugin: https://help.cubox.cc/share/obplugin/
- Readwise Changelog: https://docs.readwise.io/changelog
- Readwise MCP Guide: https://docs.readwise.io/readwise/guides/mcp
- Capacities Release 59: https://capacities.io/whats-new/release-59
- Capacities roadmap: https://capacities.io/roadmap/whats-next
- METR task time horizons: https://metr.org/time-horizons/
- MemX paper: https://arxiv.org/abs/2603.16171
- LifeBench paper: https://arxiv.org/abs/2603.03781
- MemMachine paper: https://arxiv.org/abs/2604.04853

## 14. 最终判断

如果只保留一句话：

**MemexFlow 最该做的不是“更聪明地收藏”，而是“让 agent 真正拥有围绕个人项目持续工作的长期记忆”。**

这会比继续沿着 2025 年那种 AI 收藏/发现产品思路走，更符合 2026 年 4 月的行业方向，也更适合作为你拿去讲实习面试的项目。
