// ClearMind - Decision Tool (localStorage MVP)

// -------------------- Config --------------------
const VALUES = ["time", "money", "peace", "growth", "relationships", "health", "freedom"];
const MAX_VALUES = 3;
const STORAGE_KEY = "clearmind_decisions_v1";

// -------------------- Elements --------------------
const form = document.getElementById("decisionForm");
const output = document.getElementById("output");
const historyList = document.getElementById("historyList");

const valuesChips = document.getElementById("valuesChips");
const clearBtn = document.getElementById("clearBtn");
const newDecisionBtn = document.getElementById("newDecisionBtn");
const wipeHistoryBtn = document.getElementById("wipeHistoryBtn");
const demoBtn = document.getElementById("demoBtn");

const templateSelect = document.getElementById("templateSelect");

// Share / Export
const shareBox = document.getElementById("shareBox");
const shareStatus = document.getElementById("shareStatus");
const copySummaryBtn = document.getElementById("copySummaryBtn");
const copyWithQuestionBtn = document.getElementById("copyWithQuestionBtn");
const downloadBtn = document.getElementById("downloadBtn");

// Form fields
const fields = {
  decision: document.getElementById("qDecision"),
  a: document.getElementById("qA"),
  b: document.getElementById("qB"),
  riskA: document.getElementById("qRiskA"),
  riskB: document.getElementById("qRiskB"),
  q24: document.getElementById("q24"),
};

// -------------------- Templates --------------------
const TEMPLATES = {
  job: {
    decision: "What job/career decision are you facing?",
    a: "Option A (example: apply now)",
    b: "Option B (example: wait and prepare)",
    riskA: "What’s the biggest risk if you choose Option A?",
    riskB: "What’s the biggest risk if you choose Option B?",
    q24: "If you had to decide in 24 hours, what would you pick and why?",
    values: ["growth", "money"],
  },
  money: {
    decision: "What money decision are you facing?",
    a: "Option A (example: save aggressively)",
    b: "Option B (example: invest in skills/business)",
    riskA: "What’s the biggest risk of Option A?",
    riskB: "What’s the biggest risk of Option B?",
    q24: "If you had to decide in 24 hours, what would you choose and why?",
    values: ["money", "freedom"],
  },
  relationship: {
    decision: "What relationship decision are you facing?",
    a: "Option A (example: have the conversation)",
    b: "Option B (example: create distance / pause)",
    riskA: "What’s the biggest risk if you choose Option A?",
    riskB: "What’s the biggest risk if you choose Option B?",
    q24: "If you had to decide in 24 hours, what would you pick and why?",
    values: ["peace", "relationships"],
  },
  habit: {
    decision: "What habit/self-discipline decision are you facing?",
    a: "Option A (example: commit to a strict plan)",
    b: "Option B (example: start with a tiny routine)",
    riskA: "What’s the biggest risk of Option A?",
    riskB: "What’s the biggest risk of Option B?",
    q24: "If you had to decide in 24 hours, what would you choose and why?",
    values: ["growth", "health"],
  },
  move: {
    decision: "What move/life-change decision are you facing?",
    a: "Option A (example: move now)",
    b: "Option B (example: stay and build first)",
    riskA: "What’s the biggest risk of Option A?",
    riskB: "What’s the biggest risk of Option B?",
    q24: "If you had to decide in 24 hours, what would you choose and why?",
    values: ["freedom", "peace"],
  },
};

// -------------------- Demo decision --------------------
const DEMO = {
  decision: "Should I apply for junior developer jobs now or wait 6 weeks to study more?",
  a: "Apply now (10 applications/week)",
  b: "Wait 6 weeks and build 2 more projects",
  riskA: "I may feel unprepared and get rejected, which could hurt confidence.",
  riskB: "I might procrastinate and lose momentum, delaying progress.",
  q24: "Option A — applying now creates real feedback and keeps momentum.",
  values: ["growth", "money", "freedom"],
};

// -------------------- State --------------------
let selectedValues = new Set();
let lastExportData = null;

// -------------------- Helpers --------------------
function nowISO() {
  return new Date().toISOString();
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripTags(html) {
  return String(html).replace(/<[^>]*>/g, "");
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStore(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function makeId() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function inferLean(q24Text, optionA, optionB) {
  const t = q24Text.toLowerCase().trim();
  const a = optionA.toLowerCase().trim();
  const b = optionB.toLowerCase().trim();

  if (t.includes("option a") || t.startsWith("a ") || t === "a") return "A";
  if (t.includes("option b") || t.startsWith("b ") || t === "b") return "B";

  const aKey = a.split(" ")[0];
  const bKey = b.split(" ")[0];
  const mentionsA = aKey && t.includes(aKey);
  const mentionsB = bKey && t.includes(bKey);

  if (mentionsA && !mentionsB) return "A";
  if (mentionsB && !mentionsA) return "B";

  return null;
}

function generateNextStep(lean, optionA, optionB, valuesArr) {
  const valuesText = valuesArr.length ? valuesArr.join(", ") : "your priorities";

  if (lean === "A") {
    return {
      summary: `Your values (${valuesText}) point slightly toward <b>${escapeHtml(optionA)}</b>.`,
      nextStep: `Commit to <b>${escapeHtml(optionA)}</b> for 7 days and evaluate results.`,
      tinyAction: `Do the first 5-minute action that moves <b>${escapeHtml(optionA)}</b> forward (send 1 message, write 5 bullets, or take the smallest setup step).`,
    };
  }

  if (lean === "B") {
    return {
      summary: `Your values (${valuesText}) point slightly toward <b>${escapeHtml(optionB)}</b>.`,
      nextStep: `Commit to <b>${escapeHtml(optionB)}</b> for 7 days and evaluate results.`,
      tinyAction: `Do the first 5-minute action that moves <b>${escapeHtml(optionB)}</b> forward (schedule, outline, or take the smallest setup step).`,
    };
  }

  return {
    summary: `You’re not fully decided yet — that’s okay. Use your values (${valuesText}) to choose.`,
    nextStep: `Run a 24-hour test: pick one option and take one real step. If relief increases, you’re likely aligned.`,
    tinyAction: `Write 3 reasons you’d choose A and 3 reasons you’d choose B. Circle the one that matches what matters most.`,
  };
}

// ---------- Export / Share helpers ----------
function buildPlainTextSummary(data) {
  const lines = [
    "ClearMind — Decision Summary",
    "---------------------------",
    `Decision: ${data.decision}`,
    `Option A: ${data.a}`,
    `Option B: ${data.b}`,
    `Values: ${data.values?.length ? data.values.join(", ") : "—"}`,
    "",
    `Risk (A): ${data.riskA}`,
    `Risk (B): ${data.riskB}`,
    "",
    "Clarity Output",
    "-------------",
    `Clarity summary: ${data.claritySummary}`,
    `Next best step: ${data.nextStep}`,
    `5-minute action: ${data.tinyAction}`,
    "",
    `Created: ${new Date(data.createdAt).toLocaleString()}`,
  ];
  return lines.join("\n");
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function showShareBox() {
  if (!shareBox) return;
  shareBox.classList.remove("hidden");
}

function hideShareBox() {
  if (!shareBox) return;
  shareBox.classList.add("hidden");
}

function setShareStatus(msg) {
  if (!shareStatus) return;
  shareStatus.textContent = msg || "";
}

// -------------------- UI --------------------
function renderValueChips() {
  valuesChips.innerHTML = "";

  VALUES.forEach((v) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "chip" + (selectedValues.has(v) ? " selected" : "");
    el.textContent = v;

    el.addEventListener("click", () => {
      if (selectedValues.has(v)) {
        selectedValues.delete(v);
      } else {
        if (selectedValues.size >= MAX_VALUES) return;
        selectedValues.add(v);
      }
      renderValueChips();
    });

    valuesChips.appendChild(el);
  });
}

function setOutputHtml(html) {
  output.classList.remove("muted");
  output.innerHTML = html;
}

function setOutputMuted(text) {
  output.classList.add("muted");
  output.innerHTML = text;
}

function clearForm() {
  form.reset();
  if (templateSelect) templateSelect.value = "";
  selectedValues = new Set();
  renderValueChips();

  lastExportData = null;
  setShareStatus("");
  hideShareBox();

  setOutputMuted('Fill out the questions and click <b>Generate clarity</b>.');
}

// -------------------- History --------------------
function renderHistory() {
  const items = readStore();
  historyList.innerHTML = "";

  if (!items.length) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "No saved decisions yet.";
    historyList.appendChild(li);
    return;
  }

  items.slice(0, 10).forEach((item) => {
    const li = document.createElement("li");

    const title = document.createElement("p");
    title.className = "h-title";
    title.textContent = item.decision;

    const meta = document.createElement("p");
    meta.className = "h-meta";
    meta.textContent = `${formatDate(item.createdAt)} • ${item.values?.join(", ") || "no values selected"}`;

    const actions = document.createElement("div");
    actions.className = "h-actions";

    const loadBtn = document.createElement("button");
    loadBtn.className = "btn ghost small";
    loadBtn.type = "button";
    loadBtn.textContent = "Load";
    loadBtn.addEventListener("click", () => loadDecision(item.id));

    const delBtn = document.createElement("button");
    delBtn.className = "btn ghost small";
    delBtn.type = "button";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => deleteDecision(item.id));

    actions.appendChild(loadBtn);
    actions.appendChild(delBtn);

    li.appendChild(title);
    li.appendChild(meta);
    li.appendChild(actions);

    historyList.appendChild(li);
  });
}

function saveDecision(record) {
  const items = readStore();
  items.unshift(record);
  writeStore(items.slice(0, 25));
  renderHistory();
}

function loadDecision(id) {
  const items = readStore();
  const item = items.find((x) => x.id === id);
  if (!item) return;

  fields.decision.value = item.decision;
  fields.a.value = item.a;
  fields.b.value = item.b;
  fields.riskA.value = item.riskA;
  fields.riskB.value = item.riskB;
  fields.q24.value = item.q24;

  if (templateSelect) templateSelect.value = "";

  selectedValues = new Set(item.values || []);
  renderValueChips();

  setOutputHtml(item.outputHtml || "Loaded. Click Generate clarity to refresh the output.");

  lastExportData = item.exportData || null;
  if (lastExportData) showShareBox();
  setShareStatus("");
}

function deleteDecision(id) {
  const items = readStore().filter((x) => x.id !== id);
  writeStore(items);
  renderHistory();
}

// -------------------- Templates + hash support --------------------
function applyTemplate(key) {
  const t = TEMPLATES[key];
  if (!t) return;

  fields.decision.value = t.decision;
  fields.a.value = t.a;
  fields.b.value = t.b;
  fields.riskA.value = t.riskA;
  fields.riskB.value = t.riskB;
  fields.q24.value = t.q24;

  selectedValues = new Set(t.values || []);
  renderValueChips();

  lastExportData = null;
  setShareStatus("");
  hideShareBox();

  setOutputMuted("Template loaded. Replace the prompts with your real situation, then click Generate clarity.");
}

function autoLoadTemplateFromHash() {
  const hash = window.location.hash || "";
  const match = hash.match(/t=([a-z]+)/i);
  if (!match) return;

  const key = match[1].toLowerCase();
  if (templateSelect) templateSelect.value = key;
  applyTemplate(key);
}

// -------------------- Demo --------------------
function loadDemoDecision() {
  if (templateSelect) templateSelect.value = "";

  fields.decision.value = DEMO.decision;
  fields.a.value = DEMO.a;
  fields.b.value = DEMO.b;
  fields.riskA.value = DEMO.riskA;
  fields.riskB.value = DEMO.riskB;
  fields.q24.value = DEMO.q24;

  selectedValues = new Set(DEMO.values);
  renderValueChips();

  lastExportData = null;
  setShareStatus("");
  hideShareBox();

  setOutputMuted("Demo loaded. Edit anything, then click Generate clarity.");
}

// -------------------- Boot --------------------
renderValueChips();
renderHistory();
hideShareBox();
setShareStatus("");
setOutputMuted('Fill out the questions and click <b>Generate clarity</b>.');
autoLoadTemplateFromHash();

// -------------------- Events --------------------
if (templateSelect) {
  templateSelect.addEventListener("change", () => {
    const key = templateSelect.value;
    if (!key) return;
    applyTemplate(key);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const decision = fields.decision.value.trim();
  const a = fields.a.value.trim();
  const b = fields.b.value.trim();
  const riskA = fields.riskA.value.trim();
  const riskB = fields.riskB.value.trim();
  const q24 = fields.q24.value.trim();
  const valuesArr = Array.from(selectedValues);

  const lean = inferLean(q24, a, b);
  const gen = generateNextStep(lean, a, b, valuesArr);

  const html = `
    <div>
      <p><b>Decision:</b> ${escapeHtml(decision)}</p>
      <p><b>Options:</b> A) ${escapeHtml(a)} &nbsp;&nbsp; B) ${escapeHtml(b)}</p>
      <p><b>What matters most:</b> ${escapeHtml(valuesArr.join(", ") || "—")}</p>
      <p><b>Risks:</b><br/>
        <b>A:</b> ${escapeHtml(riskA)}<br/>
        <b>B:</b> ${escapeHtml(riskB)}
      </p>
      <div class="divider"></div>
      <p><b>Clarity summary:</b> ${gen.summary}</p>
      <p><b>Next best step:</b> ${gen.nextStep}</p>
      <p><b>5-minute action:</b> ${gen.tinyAction}</p>
    </div>
  `;

  setOutputHtml(html);

  lastExportData = {
    createdAt: nowISO(),
    decision,
    a,
    b,
    riskA,
    riskB,
    values: valuesArr,
    claritySummary: stripTags(gen.summary),
    nextStep: stripTags(gen.nextStep),
    tinyAction: stripTags(gen.tinyAction),
  };

  showShareBox();
  setShareStatus("");

  saveDecision({
    id: makeId(),
    createdAt: lastExportData.createdAt,
    decision,
    a,
    b,
    riskA,
    riskB,
    q24,
    values: valuesArr,
    outputHtml: html,
    exportData: lastExportData,
  });
});

clearBtn.addEventListener("click", clearForm);

newDecisionBtn.addEventListener("click", () => {
  window.location.hash = "";
  clearForm();
});

wipeHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
  lastExportData = null;
  setShareStatus("");
  hideShareBox();
  setOutputMuted("History wiped. Fill out the questions and click Generate clarity.");
});

if (demoBtn) {
  demoBtn.addEventListener("click", loadDemoDecision);
}

// Share buttons
copySummaryBtn.addEventListener("click", async () => {
  if (!lastExportData) return;
  try {
    const text = buildPlainTextSummary(lastExportData);
    await copyToClipboard(text);
    setShareStatus("Copied summary to clipboard ✅");
  } catch {
    setShareStatus("Copy failed. Try Open in browser.");
  }
});

copyWithQuestionBtn.addEventListener("click", async () => {
  if (!lastExportData) return;
  const question =
    "\n\nQuestion for you: Which option fits my values best, and what’s the smallest next step?";
  try {
    const text = buildPlainTextSummary(lastExportData) + question;
    await copyToClipboard(text);
    setShareStatus("Copied summary + question ✅");
  } catch {
    setShareStatus("Copy failed. Try Open in browser.");
  }
});

downloadBtn.addEventListener("click", () => {
  if (!lastExportData) return;
  const text = buildPlainTextSummary(lastExportData);

  const d = new Date(lastExportData.createdAt);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const filename = `clearmind-decision-${yyyy}-${mm}-${dd}.txt`;

  downloadTextFile(filename, text);
  setShareStatus("Downloaded ✅");
});
