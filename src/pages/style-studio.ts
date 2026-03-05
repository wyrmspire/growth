/**
 * Style Studio — FUT-1
 * Mock-safe shell for the style-system foundation.
 * Lets operators define tone, formality, CTA intensity, and compliance rules
 * for campaign copy. In mock mode this is a read-only preview.
 */

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

      <div class="mock-notice">
        <span class="mock-badge">PREVIEW</span>
        Style Studio controls are coming soon. This shell shows the planned interface.
        Your existing campaigns use the default style profile until you configure one here.
      </div>

      <div class="studio-sections">
        <section class="studio-section card">
          <h2 class="section-title">Voice &amp; Tone</h2>
          <div class="field-group">
            <label class="field-label">Tone preset</label>
            <div class="preset-chips">
              <button class="chip chip--active" disabled>Professional</button>
              <button class="chip" disabled>Conversational</button>
              <button class="chip" disabled>Bold</button>
              <button class="chip" disabled>Educational</button>
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">Formality <span class="field-hint">(1 = casual, 5 = formal)</span></label>
            <div class="slider-row">
              <span class="slider-label">Casual</span>
              <input type="range" min="1" max="5" value="3" disabled class="style-slider" />
              <span class="slider-label">Formal</span>
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">CTA intensity <span class="field-hint">(1 = soft suggestion, 5 = strong call-to-action)</span></label>
            <div class="slider-row">
              <span class="slider-label">Soft</span>
              <input type="range" min="1" max="5" value="3" disabled class="style-slider" />
              <span class="slider-label">Strong</span>
            </div>
          </div>
        </section>

        <section class="studio-section card">
          <h2 class="section-title">Compliance &amp; Guardrails</h2>
          <div class="field-group">
            <label class="field-label">Banned phrases <span class="field-hint">Copy containing these terms will be flagged before approval</span></label>
            <div class="tag-list tag-list--muted">
              <span class="tag">guaranteed results</span>
              <span class="tag">100% risk free</span>
              <span class="tag-add" >+ Add phrase</span>
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">Required disclaimers</label>
            <div class="tag-list tag-list--muted">
              <span class="tag-add">+ Add disclaimer</span>
            </div>
          </div>
        </section>

        <section class="studio-section card">
          <h2 class="section-title">Channel Overrides</h2>
          <p class="field-hint">Fine-tune style per channel. Inherits from Voice &amp; Tone above unless overridden.</p>
          <div class="channel-tab-row">
            <button class="channel-tab channel-tab--active" disabled>Meta</button>
            <button class="channel-tab" disabled>LinkedIn</button>
            <button class="channel-tab" disabled>X</button>
            <button class="channel-tab" disabled>Email</button>
          </div>
          <div class="channel-override-preview">
            <div class="field-hint">Max length, emoji policy, hashtag rules, and line-break style will appear here per channel.</div>
          </div>
        </section>
      </div>

      <div class="page-actions">
        <button class="btn btn--primary" disabled>Save Style Profile</button>
        <button class="btn btn--ghost" disabled>Preview Sample Output</button>
      </div>
    </div>
  `;
}

export function bindStyleStudioEvents(): void {
    // No live events in mock mode — controls are disabled.
}
