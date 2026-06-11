# shared/

跨模块可复用层：components / composables / types / utils / styles / data。

模块只能 import `@shared/*`，禁止反向（charts + ui 容器特例除外）。

- `components/charts/` — 24 可视化图表组件
- `components/ui/` — TabBar, KnowledgeCard, KnowledgeShell, ErrorBoundary
- `composables/` — 6 motion composables (page-fade, card-entrance, tab-switch, result-reveal, btn-press, modal-slide)
- `styles/` — tokens.css + animations.css (CSS Layers)
- `utils/` — Result<T,E> 类型
