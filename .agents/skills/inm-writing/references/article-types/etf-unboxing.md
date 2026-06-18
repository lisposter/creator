# ETF 开箱文章 Preset

Use this reference when writing, rewriting, or optimizing an ETF 开箱 article.

## Purpose

Write for Chinese readers interested in investing but not necessarily familiar with ETF mechanics. The goal is not to recommend buying. The goal is to explain:

- what this ETF is;
- what the reader actually buys;
- why the theme exists now;
- how it differs from adjacent ETFs;
- where the risks hide.

## Standard Structure

Use this as a default shape, not a rigid form:

1. Fast opening.
2. ETF 入门 links.
3. ETF basic introduction.
4. `### 基本信息`.
5. `## 持仓`.
6. `## 它买的到底是什么？` or equivalent.
7. Comparison with similar ETFs.
8. `## 为什么它会这么火？` / why now, when relevant.
9. `## 业绩怎么看？`
10. `## 风险`.
11. `## 值不值得买？` / 配置思考, when appropriate.
12. `## 一挪迈的总结`.
13. DYOR disclaimer.

## Opening

Preferred patterns:

- `今天继续开箱 ETF：{TICKER}。`
- `{TICKER} 这个名字很有意思。`
- `乍一看，它像是 XXX，但拆开以后其实更像 YYY。`

Requirements:

- Enter the topic in 1-3 paragraphs.
- Explain the ticker / name / core hook first.
- Avoid long macro background.

## ETF Intro Links

Use this block unless the user asks otherwise:

```markdown
如果你还不知道 ETF 是什么，可以参考我写的 ETF 入门系列：

- [基金分类 & 什么是 ETF](https://innomad.io/what-is-etf)
- [ETF 的种类 & 哪种 ETF 适合新手](https://innomad.io/types-of-etfs-and-best-options-for-beginners)
- [详解 ETF 的费用](https://innomad.io/expense-of-etf)
- [如何挑选 ETF](https://innomad.io/how-to-choose-etf)
- [ETF 如何购买（中国 / 美股）](https://innomad.io/how-to-buy-etf)
- [ETF 相关工具](https://innomad.io/etf-tools)
```

## Basic Information

Use a list, not a table.

Common fields:

- 类型
- 发行方 / 投资顾问
- 费率
- 成立 / 上市日期
- 主要交易所
- 追踪指数 / 主动管理
- 投资目标
- 投资主题
- 持仓数量
- 资产规模
- NAV
- 市场价格
- 溢价 / 折价
- 买卖价差
- 分红周期
- 期权情况

Rules:

- Attach dates and source windows to data.
- Separate NAV-file date from latest quote date.
- For new ETFs, explicitly say history is short.
- After basic info, usually add `先说结论：...`.

## Holdings

Default wording:

```markdown
老规矩先看持仓。

截至 {date}，{ticker} 前十大大致是这些：
```

Holdings tables should usually become images if the article is intended for X / WeChat / polished blog publishing.

After the table or image, explain:

- concentration;
- which companies decide the ETF's direction;
- whether the name matches actual holdings;
- swaps / ADRs / options / cash-like instruments if present;
- what the reader is really buying.

## Mechanism Section

Good headings:

- `它买的到底是什么？`
- `它到底怎么运作？`
- `这个指数规则是什么意思？`

Rules:

- Do not only translate the prospectus.
- Explain the financial / technical mechanism first, then investment experience.
- Use software / system / network analogies when natural.
- Specific examples beat abstract terms.

## Comparison Section

Always explain how it differs from adjacent ETFs.

Common comparison groups:

- SOXX / SMH / XSD
- DRAM / EUV / FOTO
- QQQI / JEPQ / QYLD / XQQI
- EWY / FLKR / KORU

Rules:

- Comparison tables should usually be images.
- Do not only compare fees. Compare risk exposure, concentration, purity, strategy, and role in a portfolio.
- Add a plain-language decision frame after the table.

Example:

```markdown
如果你想买整个半导体行业，SOXX 或 SMH 更直接。

如果你想单独押光通信、激光、硅光子、光子组件这条线，FOTO 更纯。

如果你想把光刻、半导体设备和部分光通信放在同一个篮子里，EUV 更均衡。
```

## Performance

For new ETFs:

- Say there is not much long-term performance to evaluate.
- If the prospectus says there is no full calendar-year performance, state that plainly.
- Short-term price movement is not very meaningful.
- Watch AUM, liquidity, holdings consistency, premium / discount, and bid-ask spread.

For mature ETFs:

- Discuss multi-year return, drawdown, Beta, and standard deviation when useful.
- Explain what drives the volatility.

## Risk

Avoid empty prospectus-style risk lists.

Common dimensions:

- 新基金风险
- 主题过窄
- 持仓集中
- 估值和高 Beta
- 流动性和买卖价差
- 衍生品 / swaps / options 风险
- 地缘政治 / 出口管制
- 汇率风险
- 分红幻觉 / 收益率误读

Each meaningful risk should answer why:

- Why does valuation react first?
- How does it react?
- What does high Beta mean?
- Why does a narrow theme have nowhere to hide when the theme fades?

Risk can be concise, but it must have judgment.

## Who Is It For

Be concrete:

- core position or satellite position;
- who may need it;
- who probably does not;
- what existing holdings may already cover the same exposure.

Avoid generic suitability language.

## Ending

Use:

```markdown
## 一挪迈的总结
```

Close in 1-4 paragraphs. Restate the mechanism, then the tradeoff. End with a short sentence or question. Add DYOR.
