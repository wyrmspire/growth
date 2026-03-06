/**
 * Style Studio — STYLE-4
 * Interactive style profile editor with tone/formality/CTA sliders,
 * compliance tag inputs, channel override tabs, and a live preview panel.
 * In mock mode all state is stored in mock-engine rather than a real DB.
 */

interface LocalStyleState {
  tone: string;
  formality: number;
  ctaIntensity: string;
  readingLevel: string;
  bannedTerms: string[];
  requiredPhrases: string[];
  activeChannel: string;
  channelOverrides: Record<string, { maxLength: number; emojiPolicy: string; hashtagPolicy: string }>;
}

const state: LocalStyleState = {
  tone: 'professional',
  formality: 7,
  ctaIntensity: 'medium',
  readingLevel: '8th grade',
  bannedTerms: ['guaranteed results', '100% risk free'],
  requiredPhrases: [],
  activeChannel: 'meta',
  channelOverrides: {
    meta: { maxLength: 2200, emojiPolicy: 'sparse', hashtagPolicy: 'open' },
    linkedin: { maxLength: 3000, emojiPolicy: 'sparse', hashtagPolicy: 'branded-only' },
    x: { maxLength: 280, emojiPolicy: 'sparse', hashtagPolicy: 'open' },
    email: { maxLength: 5000, emojiPolicy: 'none', hashtagPolicy: 'none' },
  },
};

const TONE_OPTIONS = ['professional', 'casual', 'urgent', 'friendly', 'authoritative'];
const CTA_OPTIONS = [
  { value: 'soft', label: 'Soft', hint: 'Suggest, don\'t push' },
  { value: 'medium', label: 'Medium', hint: 'Clear call to action' },
  { value: 'hard', label: 'Hard', hint: 'Urgent, direct CTA' },
];
const CHANNEL_NAMES: Record<string, string> = {
  meta: 'Meta / Facebook', linkedin: 'LinkedIn', x: 'X (Twitter)', email: 'Email',
};

function renderTags(items: string[], type: string): string {
  return items.map((t) =>
    `<span class="tag">${t}<button class="tag-remove" data-tag-type="${type}" data-tag-value="${t}">×</button></span>`
  ).join('') + `<button class="tag-add" data-tag-add="${type}">+ Add</button>`;
}

function renderChannelPanel(): string {
  const ch = state.channelOverrides[state.activeChannel];
  return `
    <div class="channel-panel" id="channel-panel">
      <div class="field-group">
        <label class="field-label">Max character length</label>
        <input type="number" class="form-input" id="ch-max-length" value="${ch.maxLength}" min="50" max="10000" />
      </div>
      <div class="field-group">
        <label class="field-label">Emoji policy</label>
        <div class="preset-chips">
          ${['none', 'sparse', 'liberal'].map((p) =>
    `<button class="chip ${ch.emojiPolicy === p ? 'chip--active' : ''}" data-ch-emoji="${p}">${p}</button>`
  ).join('')}
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">Hashtag policy</label>
        <div class="preset-chips">
          ${['none', 'branded-only', 'open'].map((p) =>
    `<button class="chip ${ch.hashtagPolicy === p ? 'chip--active' : ''}" data-ch-hashtag="${p}">${p}</button>`
  ).join('')}
        </div>
      </div>
    </div>`;
}

function renderPreviewSample(): string {
  const ch = state.channelOverrides[state.activeChannel];
  const toneDesc: Record<string, string> = {
    professional: 'Clear and authoritative without being stiff.',
    casual: 'Relaxed and conversational, like texting a friend.',
    urgent: 'Time-pressured, pushing for immediate action.',
    friendly: 'Warm and approachable, building rapport.',
    authoritative: 'Commanding and expert, backed by credentials.',
  };
  return `
    <div class="preview-sample card">
      <h3 class="section-title">Sample Output Preview</h3>
      <div class="field-hint">Based on your current settings, generated copy would follow these rules:</div>
      <ul class="preview-rules">
        <li><strong>Tone:</strong> ${state.tone} — ${toneDesc[state.tone] || ''}</li>
        <li><strong>Formality:</strong> ${state.formality}/10 — ${state.formality >= 7 ? 'formal register' : state.formality >= 4 ? 'conversational' : 'very casual'}</li>
        <li><strong>CTA:</strong> ${state.ctaIntensity}</li>
        <li><strong>Reading level:</strong> ${state.readingLevel}</li>
        <li><strong>Channel (${state.activeChannel}):</strong> max ${ch.maxLength} chars, emoji: ${ch.emojiPolicy}, hashtags: ${ch.hashtagPolicy}</li>
        ${state.bannedTerms.length > 0 ? `<li><strong>Banned:</strong> ${state.bannedTerms.join(', ')}</li>` : ''}
        ${state.requiredPhrases.length > 0 ? `<li><strong>Required:</strong> ${state.requiredPhrases.join(', ')}</li>` : ''}
      </ul>
    </div>`;
}

export function renderStyleStudioPage(): string {
  return `
    <div class="page-shell">
      <div class="page-heading">
        <h1 class="page-title">Style Studio</h1>
        <p class="page-subtitle">
          Define your brand voice and content rules. Every campaign you generate will
          follow these settings — so your posts sound like you, not a template.
        </p>
      </div>

      <div class="coach-block">
        <div class="coach-block-icon">🎨</div>
        <div class="coach-block-body">
          <strong>What you do here</strong>
          <p>Set the writing style for all your campaigns: tone, formality, CTA intensity, and any phrases that must (or must never) appear.</p>
          <strong>Why it matters</strong>
          <p>Consistent style builds brand recognition and reduces copy review time. Instead of correcting the same issues every batch, you set the rules once here.</p>
          <strong>What comes next</strong>
          <p>Once your style profile is saved, the Campaign Launcher uses it automatically when generating copy variants.</p>
        </div>
      </div>

      <div class="studio-sections">
        <section class="studio-section card">
          <h2 class="section-title">Voice & Tone</h2>
          <div class="field-group">
            <label class="field-label">Tone preset</label>
            <div class="preset-chips" id="tone-chips">
              ${TONE_OPTIONS.map((t) =>
    `<button class="chip ${state.tone === t ? 'chip--active' : ''}" data-tone="${t}">${t}</button>`
  ).join('')}
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">Formality <span class="field-hint">(1 = casual, 10 = formal)</span></label>
            <div class="slider-row">
              <span class="slider-label">Casual</span>
              <input type="range" min="1" max="10" value="${state.formality}" class="style-slider" id="formality-slider" />
              <span class="slider-label" id="formality-value">${state.formality}</span>
              <span class="slider-label">Formal</span>
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">CTA intensity</label>
            <div class="preset-chips" id="cta-chips">
              ${CTA_OPTIONS.map((o) =>
    `<button class="chip ${state.ctaIntensity === o.value ? 'chip--active' : ''}" data-cta="${o.value}" title="${o.hint}">${o.label}</button>`
  ).join('')}
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">Reading level</label>
            <select class="form-input" id="reading-level">
              <option ${state.readingLevel === '6th grade' ? 'selected' : ''}>6th grade</option>
              <option ${state.readingLevel === '8th grade' ? 'selected' : ''}>8th grade</option>
              <option ${state.readingLevel === '10th grade' ? 'selected' : ''}>10th grade</option>
              <option ${state.readingLevel === 'professional' ? 'selected' : ''}>professional</option>
            </select>
          </div>
        </section>

        <section class="studio-section card">
          <h2 class="section-title">Compliance & Guardrails</h2>
          <div class="field-group">
            <label class="field-label">Banned phrases <span class="field-hint">Copy containing these terms will be flagged</span></label>
            <div class="tag-list" id="banned-tags">${renderTags(state.bannedTerms, 'banned')}</div>
          </div>
          <div class="field-group">
            <label class="field-label">Required phrases <span class="field-hint">At least one must appear in every output</span></label>
            <div class="tag-list" id="required-tags">${renderTags(state.requiredPhrases, 'required')}</div>
          </div>
        </section>

        <section class="studio-section card">
          <h2 class="section-title">Channel Overrides</h2>
          <p class="field-hint">Fine-tune style per channel. Inherits from Voice & Tone above unless overridden.</p>
          <div class="channel-tab-row" id="channel-tabs">
            ${Object.entries(CHANNEL_NAMES).map(([key, label]) =>
    `<button class="channel-tab ${state.activeChannel === key ? 'channel-tab--active' : ''}" data-channel="${key}">${label}</button>`
  ).join('')}
          </div>
          ${renderChannelPanel()}
        </section>

        ${renderPreviewSample()}
      </div>

      <div class="page-actions">
        <button class="btn btn--primary" id="save-style-btn">Save Style Profile</button>
        <button class="btn btn--ghost" id="refresh-preview-btn">Refresh Preview</button>
      </div>
    </div>
  `;
}

export function bindStyleStudioEvents(): void {
  // Tone chips
  document.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest('[data-tone]') as HTMLElement | null;
    if (!chip) return;
    state.tone = chip.dataset.tone || 'professional';
    document.querySelectorAll('#tone-chips .chip').forEach((c) => c.classList.remove('chip--active'));
    chip.classList.add('chip--active');
    refreshPreview();
  });

  // CTA chips
  document.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest('[data-cta]') as HTMLElement | null;
    if (!chip) return;
    state.ctaIntensity = chip.dataset.cta || 'medium';
    document.querySelectorAll('#cta-chips .chip').forEach((c) => c.classList.remove('chip--active'));
    chip.classList.add('chip--active');
    refreshPreview();
  });

  // Formality slider
  const slider = document.getElementById('formality-slider') as HTMLInputElement | null;
  if (slider) {
    slider.addEventListener('input', () => {
      state.formality = parseInt(slider.value, 10);
      const label = document.getElementById('formality-value');
      if (label) label.textContent = String(state.formality);
      refreshPreview();
    });
  }

  // Reading level
  const reading = document.getElementById('reading-level') as HTMLSelectElement | null;
  if (reading) {
    reading.addEventListener('change', () => {
      state.readingLevel = reading.value;
      refreshPreview();
    });
  }

  // Channel tabs
  document.addEventListener('click', (e) => {
    const tab = (e.target as HTMLElement).closest('[data-channel]') as HTMLElement | null;
    if (!tab) return;
    state.activeChannel = tab.dataset.channel || 'meta';
    document.querySelectorAll('#channel-tabs .channel-tab').forEach((t) => t.classList.remove('channel-tab--active'));
    tab.classList.add('channel-tab--active');
    const panel = document.getElementById('channel-panel');
    if (panel) panel.outerHTML = renderChannelPanel();
    bindChannelPanel();
    refreshPreview();
  });

  // Channel panel inputs
  bindChannelPanel();

  // Tag removal
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.tag-remove') as HTMLElement | null;
    if (!btn) return;
    const type = btn.dataset.tagType;
    const value = btn.dataset.tagValue;
    if (type === 'banned') {
      state.bannedTerms = state.bannedTerms.filter((t) => t !== value);
      const container = document.getElementById('banned-tags');
      if (container) container.innerHTML = renderTags(state.bannedTerms, 'banned');
    } else if (type === 'required') {
      state.requiredPhrases = state.requiredPhrases.filter((t) => t !== value);
      const container = document.getElementById('required-tags');
      if (container) container.innerHTML = renderTags(state.requiredPhrases, 'required');
    }
    refreshPreview();
  });

  // Tag add
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-tag-add]') as HTMLElement | null;
    if (!btn) return;
    const type = btn.dataset.tagAdd;
    const phrase = prompt(`Enter ${type === 'banned' ? 'a banned' : 'a required'} phrase:`);
    if (!phrase || phrase.trim() === '') return;
    if (type === 'banned') {
      state.bannedTerms.push(phrase.trim());
      const container = document.getElementById('banned-tags');
      if (container) container.innerHTML = renderTags(state.bannedTerms, 'banned');
    } else if (type === 'required') {
      state.requiredPhrases.push(phrase.trim());
      const container = document.getElementById('required-tags');
      if (container) container.innerHTML = renderTags(state.requiredPhrases, 'required');
    }
    refreshPreview();
  });

  // Save button
  const saveBtn = document.getElementById('save-style-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveBtn.textContent = '✓ Profile Saved';
      saveBtn.classList.add('btn--success');
      setTimeout(() => {
        saveBtn.textContent = 'Save Style Profile';
        saveBtn.classList.remove('btn--success');
      }, 2000);
    });
  }

  // Refresh preview
  const refreshBtn = document.getElementById('refresh-preview-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshPreview);
  }
}

function bindChannelPanel(): void {
  // Channel emoji chips
  document.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest('[data-ch-emoji]') as HTMLElement | null;
    if (!chip) return;
    state.channelOverrides[state.activeChannel].emojiPolicy = chip.dataset.chEmoji || 'sparse';
    chip.parentElement?.querySelectorAll('.chip').forEach((c) => c.classList.remove('chip--active'));
    chip.classList.add('chip--active');
    refreshPreview();
  });

  // Channel hashtag chips
  document.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest('[data-ch-hashtag]') as HTMLElement | null;
    if (!chip) return;
    state.channelOverrides[state.activeChannel].hashtagPolicy = chip.dataset.chHashtag || 'open';
    chip.parentElement?.querySelectorAll('.chip').forEach((c) => c.classList.remove('chip--active'));
    chip.classList.add('chip--active');
    refreshPreview();
  });

  // Max length input
  const maxLenInput = document.getElementById('ch-max-length') as HTMLInputElement | null;
  if (maxLenInput) {
    maxLenInput.addEventListener('input', () => {
      state.channelOverrides[state.activeChannel].maxLength = parseInt(maxLenInput.value, 10) || 280;
      refreshPreview();
    });
  }
}

function refreshPreview(): void {
  const container = document.querySelector('.preview-sample');
  if (container) container.outerHTML = renderPreviewSample();
}
