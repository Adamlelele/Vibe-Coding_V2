const data = window.RESEARCH_DATA;

const money = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 });

function scoreTheme(theme) {
  const opportunity =
    0.28 * Number(theme.conviction) +
    0.24 * Number(theme.earnings_visibility) +
    0.18 * Number(theme.policy_support) +
    0.15 * Number(theme.capital_heat) -
    0.1 * Number(theme.valuation_pressure) -
    0.05 * Number(theme.risk_score);
  return +(opportunity - 0.2 * Number(theme.risk_score)).toFixed(1);
}

function opportunity(theme) {
  return +(
    0.28 * Number(theme.conviction) +
    0.24 * Number(theme.earnings_visibility) +
    0.18 * Number(theme.policy_support) +
    0.15 * Number(theme.capital_heat) -
    0.1 * Number(theme.valuation_pressure) -
    0.05 * Number(theme.risk_score)
  ).toFixed(1);
}

const themes = data.themes
  .map((theme) => ({ ...theme, risk_adjusted_score: Number(theme.risk_adjusted_score || scoreTheme(theme)), opportunity_score: Number(theme.opportunity_score || opportunity(theme)) }))
  .sort((a, b) => b.risk_adjusted_score - a.risk_adjusted_score);

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function renderKpis() {
  const top = themes[0];
  const avgRisk = themes.reduce((sum, item) => sum + Number(item.risk_score), 0) / themes.length;
  const kpis = [
    ["覆盖主题", themes.length, "四大投资主线"],
    ["最高优先级", top.theme, `风险调整分 ${top.risk_adjusted_score}`],
    ["平均风险分", money.format(avgRisk), "样例风险评分"],
    ["本地研报", data.reports.length, "PDF 资产元数据"],
  ];
  qs("#overview-kpis").innerHTML = kpis
    .map(
      ([label, value, note]) => `
      <div class="kpi">
        <div class="kpi-label">${label}</div>
        <div class="kpi-value">${value}</div>
        <div class="kpi-note">${note}</div>
      </div>`
    )
    .join("");
}

function renderPillarBars() {
  const groups = {};
  themes.forEach((theme) => {
    groups[theme.pillar] ||= [];
    groups[theme.pillar].push(theme.risk_adjusted_score);
  });
  const rows = Object.entries(groups)
    .map(([name, values]) => [name, values.reduce((a, b) => a + b, 0) / values.length])
    .sort((a, b) => b[1] - a[1]);
  const max = Math.max(...rows.map((row) => row[1]));
  qs("#pillar-bars").innerHTML = rows
    .map(
      ([name, value]) => `
      <div class="bar-row">
        <div class="bar-meta"><span>${name}</span><strong>${money.format(value)}</strong></div>
        <div class="bar-track"><div class="bar-fill" style="width:${(value / max) * 100}%"></div></div>
      </div>`
    )
    .join("");
}

function renderScatter() {
  const minRisk = Math.min(...themes.map((t) => Number(t.risk_score)));
  const maxRisk = Math.max(...themes.map((t) => Number(t.risk_score)));
  const minOpp = Math.min(...themes.map((t) => Number(t.opportunity_score)));
  const maxOpp = Math.max(...themes.map((t) => Number(t.opportunity_score)));
  qs("#scatter-plot").innerHTML = themes
    .map((theme) => {
      const x = ((Number(theme.risk_score) - minRisk) / (maxRisk - minRisk || 1)) * 88 + 6;
      const y = ((Number(theme.opportunity_score) - minOpp) / (maxOpp - minOpp || 1)) * 78 + 8;
      const size = Math.max(14, Math.min(38, Number(theme.capital_heat) / 2.5));
      return `
        <div class="dot-label" style="left:${x}%;bottom:${y + 7}%">${theme.theme}</div>
        <div class="dot" title="${theme.theme}" style="left:${x}%;bottom:${y}%;width:${size}px;height:${size}px"></div>`;
    })
    .join("");
}

function renderThemeTable() {
  const headers = ["主线", "主题", "关键环节", "配置属性", "风险调整分", "风险分"];
  const rows = themes.map((theme) => [theme.pillar, theme.theme, theme.track, theme.allocation_style, theme.risk_adjusted_score, theme.risk_score]);
  renderTable("#theme-table", headers, rows);
}

function renderTable(selector, headers, rows) {
  qs(selector).innerHTML = `
    <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>`;
}

function setupNavigation() {
  qsa(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      qsa(".nav-item").forEach((item) => item.classList.remove("active"));
      qsa(".page").forEach((page) => page.classList.remove("active"));
      button.classList.add("active");
      qs(`#${button.dataset.page}`).classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function setupThemeLibrary() {
  const pillarFilter = qs("#pillar-filter");
  const pillars = ["全部", ...new Set(themes.map((theme) => theme.pillar))];
  pillarFilter.innerHTML = pillars.map((pillar) => `<option>${pillar}</option>`).join("");
  qs("#theme-search").addEventListener("input", renderThemeCards);
  pillarFilter.addEventListener("change", renderThemeCards);
  renderThemeCards();
  renderThemeDetail(themes[0].theme);
}

function renderThemeCards() {
  const keyword = qs("#theme-search").value.trim().toLowerCase();
  const pillar = qs("#pillar-filter").value;
  const filtered = themes.filter((theme) => {
    const matchPillar = pillar === "全部" || theme.pillar === pillar;
    const haystack = `${theme.theme} ${theme.track} ${theme.thesis}`.toLowerCase();
    return matchPillar && (!keyword || haystack.includes(keyword));
  });

  qs("#theme-cards").innerHTML = filtered
    .map(
      (theme, index) => `
      <article class="theme-card ${index === 0 ? "active" : ""}" data-theme="${theme.theme}">
        <div class="card-kicker">${theme.pillar}</div>
        <div class="card-title">${theme.theme}</div>
        <div class="card-copy">${theme.track}</div>
        <span class="score">风险调整分 ${theme.risk_adjusted_score}</span>
      </article>`
    )
    .join("");

  qsa(".theme-card").forEach((card) => {
    card.addEventListener("click", () => {
      qsa(".theme-card").forEach((item) => item.classList.remove("active"));
      card.classList.add("active");
      renderThemeDetail(card.dataset.theme);
    });
  });

  if (filtered[0]) renderThemeDetail(filtered[0].theme);
}

function renderThemeDetail(themeName) {
  const theme = themes.find((item) => item.theme === themeName) || themes[0];
  qs("#theme-detail-title").textContent = theme.theme;
  qs("#theme-detail-score").textContent = `风险调整分 ${theme.risk_adjusted_score}`;
  qs("#theme-detail").innerHTML = `
    <p class="card-copy">${theme.thesis}</p>
    <h3>催化因素</h3>
    <ul class="detail-list">${splitList(theme.catalysts).map((item) => `<li>${item}</li>`).join("")}</ul>
    <h3>跟踪指标</h3>
    <ul class="detail-list">${splitList(theme.watch_metrics).map((item) => `<li>${item}</li>`).join("")}</ul>
    <h3>主要风险</h3>
    <ul class="detail-list">${splitList(theme.risks).map((item) => `<li>${item}</li>`).join("")}</ul>
  `;
}

function splitList(value) {
  return String(value || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderCompanyResearch() {
  const sections = data.companyResearch;
  const max = Math.max(...sections.map((section) => section.weight));
  qs("#company-bars").innerHTML = sections
    .map(
      (section) => `
      <div class="bar-row">
        <div class="bar-meta"><span>${section.section}</span><strong>${section.weight}</strong></div>
        <div class="bar-track"><div class="bar-fill" style="width:${(section.weight / max) * 100}%"></div></div>
      </div>`
    )
    .join("");

  qs("#research-checklist").innerHTML = sections
    .flatMap((section) =>
      section.items.slice(0, 3).map(
        (item) => `
        <div class="check-item">
          <strong>${section.section} · ${item.dimension}</strong>
          <p>${item.key_question}</p>
        </div>`
      )
    )
    .join("");
}

function setupBoards() {
  qs("#board-search").addEventListener("input", renderBoards);
  renderBoards();
}

function renderBoards() {
  const keyword = qs("#board-search").value.trim().toLowerCase();
  const boards = data.boards.filter((board) => {
    const haystack = `${board.board} ${board.group_name} ${board.logic} ${board.watch_points}`.toLowerCase();
    return !keyword || haystack.includes(keyword);
  });
  qs("#board-grid").innerHTML = boards
    .map(
      (board) => `
      <article class="board-card">
        <div class="card-kicker">${board.group_name} · ${board.stance}</div>
        <div class="card-title">${board.board}</div>
        <div class="card-copy">${board.logic}</div>
        <span class="score">持续性 ${board.continuity}</span>
      </article>`
    )
    .join("");
}

function renderReports() {
  const typeCount = data.reports.reduce((acc, report) => {
    acc[report.type] = (acc[report.type] || 0) + 1;
    return acc;
  }, {});
  const kpis = [
    ["PDF 数量", data.reports.length, "本地研报资产"],
    ["公开研报", typeCount["公开研报"] || 0, "商业航天资料"],
    ["用户研报", typeCount["用户研报"] || 0, "原始上传资料"],
    ["公司研究", typeCount["公司研究"] || 0, "方法论来源"],
  ];
  qs("#report-kpis").innerHTML = kpis
    .map(
      ([label, value, note]) => `
      <div class="kpi">
        <div class="kpi-label">${label}</div>
        <div class="kpi-value">${value}</div>
        <div class="kpi-note">${note}</div>
      </div>`
    )
    .join("");

  renderTable(
    "#report-table",
    ["文件名", "类型", "目录", "大小 MB"],
    data.reports.map((report) => [report.name, report.type, report.folder, report.sizeMb])
  );
}

function init() {
  setupNavigation();
  renderKpis();
  renderPillarBars();
  renderScatter();
  renderThemeTable();
  setupThemeLibrary();
  renderCompanyResearch();
  setupBoards();
  renderReports();
}

init();
