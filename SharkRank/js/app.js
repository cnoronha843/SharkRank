// SharkRank - Main Application
class SharkRankApp {
  constructor() {
    this.db = new SharkRankDB();
    this.currentScreen = 'dashboard';
    this.currentAthleteId = null;
    this.searchTerm = '';
    this.filterTier = 'all';
  }

  init() {
    if (!localStorage.getItem('sharkrank_initialized')) {
      this.db.seedData();
      localStorage.setItem('sharkrank_initialized', 'true');
    }
    setTimeout(() => {
      document.getElementById('splash').classList.add('hide');
      setTimeout(() => document.getElementById('splash').remove(), 500);
    }, 1800);
    this.navigate('dashboard');
    this.bindNav();
    this.bindGlobalEvents();
  }

  bindNav() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const screen = btn.dataset.screen;
        if (screen) this.navigate(screen);
      });
    });
  }

  bindGlobalEvents() {
    document.getElementById('main-content').addEventListener('click', e => {
      const card = e.target.closest('[data-athlete-id]');
      if (card) { this.navigate('profile', { id: card.dataset.athleteId }); return; }
      const back = e.target.closest('.back-btn');
      if (back) { this.navigate(back.dataset.back || 'dashboard'); return; }
      const action = e.target.closest('[data-action]');
      if (action) this.handleAction(action.dataset.action, action.dataset);
    });
  }

  navigate(screen, params = {}) {
    this.currentScreen = screen;
    if (params.id) this.currentAthleteId = params.id;
    const el = document.getElementById('main-content');
    el.style.opacity = '0';
    setTimeout(() => {
      switch (screen) {
        case 'dashboard': this.renderDashboard(); break;
        case 'athletes': this.renderAthletes(); break;
        case 'assess': this.renderAssess(); break;
        case 'ranking': this.renderRanking(); break;
        case 'settings': this.renderSettings(); break;
        case 'profile': this.renderProfile(params.id || this.currentAthleteId); break;
      }
      el.style.opacity = '1';
      el.scrollTop = 0;
      this.updateNav(screen);
    }, 150);
  }

  updateNav(screen) {
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.screen === screen);
    });
  }

  toast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${msg}`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  getTierClass(tier) {
    return tier ? `tier-${tier.name.toLowerCase()}` : 'tier-peixe';
  }

  avatarHTML(athlete, size = 48) {
    const tier = athlete.tier || this.db.getTier(athlete.overall);
    return `<div class="athlete-avatar" style="width:${size}px;height:${size}px;background:${tier.gradient};font-size:${size * 0.33}px">${this.getInitials(athlete.name)}</div>`;
  }

  // === DASHBOARD ===
  renderDashboard() {
    const stats = this.db.getStats();
    const athletes = this.db.getAthletes();
    const top = stats.topAthlete;
    const matches = this.db.getMatches().slice(0, 3);

    document.getElementById('main-content').innerHTML = `
      <div class="screen">
        <h2 style="font-size:22px;margin-bottom:4px">Olá! 🏐</h2>
        <p style="color:var(--text-secondary);font-size:13px;margin-bottom:20px">Painel de telemetria SharkRank</p>
        <div class="stats-row animate-in">
          <div class="stat-card"><div class="stat-value">${stats.totalAthletes}</div><div class="stat-label">Atletas</div></div>
          <div class="stat-card"><div class="stat-value">${stats.avgRating}</div><div class="stat-label">Média Geral</div></div>
          <div class="stat-card"><div class="stat-value">${stats.totalMatches}</div><div class="stat-label">Partidas</div></div>
        </div>
        ${top ? `
        <div class="section animate-in delay-1">
          <div class="section-header"><span class="section-title">🏆 Destaque</span></div>
          <div class="card" data-athlete-id="${top.id}" style="cursor:pointer">
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
              ${this.avatarHTML(top, 56)}
              <div style="flex:1">
                <div style="font-size:16px;font-weight:700">${top.name}</div>
                <div style="font-size:12px;color:var(--text-secondary)">"${top.nickname}"</div>
                <div class="tier-badge ${this.getTierClass(top.tier)}" style="margin-top:6px">${top.tier.emoji} ${top.tier.name} · ${top.overall}</div>
              </div>
            </div>
            <div class="chart-container"><canvas id="dash-radar" width="260" height="260"></canvas></div>
          </div>
        </div>` : ''}
        <div class="section animate-in delay-2">
          <div class="section-header">
            <span class="section-title">📊 Distribuição</span>
          </div>
          <div class="card">
            ${TIERS.map(t => {
              const count = athletes.filter(a => a.overall >= t.min && a.overall <= t.max).length;
              const pct = athletes.length ? Math.round(count / athletes.length * 100) : 0;
              return `<div class="skill-bar"><div class="skill-bar-header"><span class="skill-bar-label">${t.emoji} ${t.name}</span><span class="skill-bar-value">${count}</span></div><div class="skill-bar-track"><div class="skill-bar-fill" style="width:${pct}%;background:${t.gradient}"></div></div></div>`;
            }).join('')}
          </div>
        </div>
        ${matches.length ? `
        <div class="section animate-in delay-3">
          <div class="section-header"><span class="section-title">⚔️ Partidas Recentes</span><span class="section-link" onclick="app.navigate('athletes')">Ver todas</span></div>
          ${matches.map(m => this.matchCardHTML(m)).join('')}
        </div>` : ''}
      </div>`;

    if (top) {
      setTimeout(() => {
        const c = document.getElementById('dash-radar');
        if (c) new RadarChart(c, SKILLS.map(s => ({ label: s.label, value: top.skills[s.key] || 0 }))).animate();
      }, 200);
    }
  }

  matchCardHTML(m) {
    const names = (ids) => ids.map(id => { const a = this.db.getAthlete(id); return a ? (a.nickname || a.name.split(' ')[0]) : '?'; }).join(' & ');
    const d = new Date(m.date);
    return `<div class="match-card">
      <div class="match-vs">
        <div class="match-team"><div class="match-team-names">${names(m.teamA)}</div></div>
        <div class="match-score">${m.scoreA} <span class="vs">×</span> ${m.scoreB}</div>
        <div class="match-team"><div class="match-team-names">${names(m.teamB)}</div></div>
      </div>
      <div class="match-meta">${m.location || ''} · ${d.toLocaleDateString('pt-BR')}</div>
    </div>`;
  }

  // === ATHLETES LIST ===
  renderAthletes() {
    let athletes = this.db.getAthletes();
    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase();
      athletes = athletes.filter(a => a.name.toLowerCase().includes(s) || (a.nickname && a.nickname.toLowerCase().includes(s)));
    }
    if (this.filterTier !== 'all') {
      athletes = athletes.filter(a => a.tier && a.tier.name.toLowerCase() === this.filterTier);
    }
    document.getElementById('main-content').innerHTML = `
      <div class="screen">
        <div class="section-header"><span class="section-title">👥 Atletas</span><button class="btn btn-sm btn-primary" data-action="addAthlete">+ Novo</button></div>
        <div class="search-bar"><span class="search-icon">🔍</span><input type="text" id="search-input" placeholder="Buscar atleta..." value="${this.searchTerm}"></div>
        <div class="filter-tabs">
          <button class="filter-tab ${this.filterTier === 'all' ? 'active' : ''}" data-action="filterTier" data-tier="all">Todos</button>
          ${TIERS.map(t => `<button class="filter-tab ${this.filterTier === t.name.toLowerCase() ? 'active' : ''}" data-action="filterTier" data-tier="${t.name.toLowerCase()}">${t.emoji} ${t.name}</button>`).join('')}
        </div>
        ${athletes.length ? athletes.map((a, i) => `
          <div class="athlete-card animate-in delay-${Math.min(i, 4)}" data-athlete-id="${a.id}">
            ${this.avatarHTML(a)}
            <div class="athlete-info">
              <div class="athlete-name">${a.name}</div>
              <div class="athlete-nick">"${a.nickname}" · ${a.position}</div>
              <div class="athlete-meta"><span>🏐 ${a.matches || 0} partidas</span><span>🏆 ${a.wins || 0} vitórias</span></div>
            </div>
            <div class="athlete-rating">
              <div class="rating-value" style="color:${a.tier ? a.tier.color : '#fff'}">${a.overall}</div>
              <div class="rating-tier ${this.getTierClass(a.tier)}" style="font-size:16px">${a.tier ? a.tier.emoji : ''}</div>
            </div>
          </div>`).join('') : '<div class="empty-state"><div class="empty-state-icon">🏐</div><div class="empty-state-text">Nenhum atleta encontrado</div></div>'}
      </div>`;

    const si = document.getElementById('search-input');
    if (si) {
      si.addEventListener('input', e => { this.searchTerm = e.target.value; this.renderAthletes(); });
    }
  }

  // === ASSESSMENT ===
  renderAssess() {
    const athletes = this.db.getAthletes();
    const sel = this.currentAthleteId;
    const athlete = sel ? this.db.getAthlete(sel) : null;

    document.getElementById('main-content').innerHTML = `
      <div class="screen">
        <div class="section-header"><span class="section-title">⚡ Avaliação Técnica</span></div>
        <div class="form-group">
          <label class="form-label">Selecionar Atleta</label>
          <select class="form-select" id="assess-athlete">
            <option value="">Escolha um atleta...</option>
            ${athletes.map(a => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${a.name} (${a.nickname})</option>`).join('')}
          </select>
        </div>
        <div id="assess-form" style="${athlete ? '' : 'display:none'}">
          <div class="card" style="margin-bottom:20px">
            ${SKILLS.map(s => `
              <div class="skill-slider">
                <div class="skill-slider-header">
                  <span class="skill-slider-label">${s.icon} ${s.label}</span>
                  <span class="skill-slider-value" id="val-${s.key}">${athlete ? athlete.skills[s.key] : 50}</span>
                </div>
                <input type="range" min="0" max="100" value="${athlete ? athlete.skills[s.key] : 50}" data-skill="${s.key}" class="assess-slider">
              </div>`).join('')}
          </div>
          <div class="form-group">
            <label class="form-label">Observações</label>
            <textarea class="form-textarea" id="assess-notes" placeholder="Pontos fortes, a melhorar..."></textarea>
          </div>
          <button class="btn btn-primary btn-block" data-action="saveAssessment">💾 Salvar Avaliação</button>
        </div>
      </div>`;

    document.getElementById('assess-athlete').addEventListener('change', e => {
      this.currentAthleteId = e.target.value || null;
      this.renderAssess();
    });

    document.querySelectorAll('.assess-slider').forEach(slider => {
      slider.addEventListener('input', e => {
        document.getElementById(`val-${e.target.dataset.skill}`).textContent = e.target.value;
      });
    });
  }

  // === RANKING ===
  renderRanking() {
    const athletes = this.db.getRanking();
    document.getElementById('main-content').innerHTML = `
      <div class="screen">
        <div class="section-header"><span class="section-title">🏆 Ranking Geral</span></div>
        ${athletes.map((a, i) => `
          <div class="athlete-card animate-in delay-${Math.min(i, 4)}" data-athlete-id="${a.id}">
            <div class="rank-pos ${i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : ''}">${i + 1}</div>
            ${this.avatarHTML(a, 42)}
            <div class="athlete-info">
              <div class="athlete-name">${a.name}</div>
              <div class="athlete-nick">"${a.nickname}"</div>
            </div>
            <div class="athlete-rating">
              <div class="rating-value" style="color:${a.tier ? a.tier.color : '#fff'}">${a.overall}</div>
              <div class="tier-badge ${this.getTierClass(a.tier)}" style="font-size:10px">${a.tier ? a.tier.emoji + ' ' + a.tier.name : ''}</div>
            </div>
          </div>`).join('')}
      </div>`;
  }

  // === PROFILE ===
  renderProfile(id) {
    const a = this.db.getAthlete(id);
    if (!a) { this.navigate('athletes'); return; }
    const tier = a.tier || this.db.getTier(a.overall);
    const assessments = this.db.getAssessments(id);
    const matches = this.db.getMatches(id);
    const winRate = a.matches ? Math.round((a.wins / a.matches) * 100) : 0;

    document.getElementById('main-content').innerHTML = `
      <div class="screen">
        <div class="profile-header">
          <button class="back-btn" data-back="athletes">←</button>
          ${this.avatarHTML(a, 80)}
          <div class="profile-name">${a.name}</div>
          <div class="profile-nick">"${a.nickname}" · ${a.position}</div>
          <div style="margin-top:10px"><span class="tier-badge ${this.getTierClass(tier)}" style="font-size:13px;padding:6px 14px">${tier.emoji} ${tier.name} · ${a.overall} pts</span></div>
          <div class="profile-stats">
            <div class="profile-stat"><div class="profile-stat-value">${a.matches || 0}</div><div class="profile-stat-label">Partidas</div></div>
            <div class="profile-stat"><div class="profile-stat-value">${a.wins || 0}</div><div class="profile-stat-label">Vitórias</div></div>
            <div class="profile-stat"><div class="profile-stat-value">${winRate}%</div><div class="profile-stat-label">Win Rate</div></div>
          </div>
        </div>
        <div class="section animate-in">
          <div class="section-title" style="margin-bottom:14px">📡 Radar de Habilidades</div>
          <div class="card"><div class="chart-container"><canvas id="profile-radar"></canvas></div></div>
        </div>
        <div class="section animate-in delay-1">
          <div class="section-title" style="margin-bottom:14px">📊 Detalhamento</div>
          <div class="card">
            ${SKILLS.map(s => `<div class="skill-bar"><div class="skill-bar-header"><span class="skill-bar-label">${s.icon} ${s.label}</span><span class="skill-bar-value" style="color:${tier.color}">${a.skills[s.key]}</span></div><div class="skill-bar-track"><div class="skill-bar-fill" style="width:${a.skills[s.key]}%;background:${tier.gradient}"></div></div></div>`).join('')}
          </div>
        </div>
        <div class="section animate-in delay-2">
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary" style="flex:1" data-action="assessAthlete" data-id="${a.id}">⚡ Avaliar</button>
            <button class="btn btn-danger btn-sm" data-action="deleteAthlete" data-id="${a.id}">🗑️</button>
          </div>
        </div>
        ${matches.length ? `<div class="section animate-in delay-3"><div class="section-title" style="margin-bottom:14px">⚔️ Partidas</div>${matches.slice(0, 5).map(m => this.matchCardHTML(m)).join('')}</div>` : ''}
      </div>`;

    setTimeout(() => {
      const c = document.getElementById('profile-radar');
      if (c) new RadarChart(c, SKILLS.map(s => ({ label: s.label, value: a.skills[s.key] || 0 }))).animate();
    }, 250);
  }

  // === SETTINGS ===
  renderSettings() {
    document.getElementById('main-content').innerHTML = `
      <div class="screen">
        <div class="section-title" style="font-size:22px;margin-bottom:20px">⚙️ Configurações</div>
        <div class="settings-item" data-action="exportData"><div class="settings-item-left"><span class="settings-item-icon">📤</span><div><div class="settings-item-label">Exportar Dados</div><div class="settings-item-desc">Salvar backup em JSON</div></div></div><span class="settings-item-arrow">›</span></div>
        <div class="settings-item" data-action="importData"><div class="settings-item-left"><span class="settings-item-icon">📥</span><div><div class="settings-item-label">Importar Dados</div><div class="settings-item-desc">Restaurar backup</div></div></div><span class="settings-item-arrow">›</span></div>
        <div class="settings-item" data-action="resetData"><div class="settings-item-left"><span class="settings-item-icon">🔄</span><div><div class="settings-item-label">Resetar Dados</div><div class="settings-item-desc">Voltar ao estado inicial</div></div></div><span class="settings-item-arrow">›</span></div>
        <div class="card" style="margin-top:24px;text-align:center">
          <div style="font-size:36px;margin-bottom:8px">🦈</div>
          <div style="font-weight:700;font-size:16px">SharkRank v1.0</div>
          <div style="color:var(--text-secondary);font-size:12px;margin-top:4px">Telemetria de Futevôlei</div>
        </div>
      </div>`;
  }

  // === MODAL ===
  showModal(html) {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-body').innerHTML = html;
    overlay.classList.add('active');
    overlay.addEventListener('click', e => { if (e.target === overlay) this.hideModal(); }, { once: true });
  }

  hideModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  }

  // === ACTIONS ===
  handleAction(action, dataset) {
    switch (action) {
      case 'addAthlete': this.showAddAthleteModal(); break;
      case 'saveNewAthlete': this.saveNewAthlete(); break;
      case 'saveAssessment': this.saveAssessment(); break;
      case 'assessAthlete':
        this.currentAthleteId = dataset.id;
        this.navigate('assess');
        break;
      case 'deleteAthlete':
        if (confirm('Remover este atleta?')) {
          this.db.deleteAthlete(dataset.id);
          this.toast('Atleta removido');
          this.navigate('athletes');
        }
        break;
      case 'filterTier':
        this.filterTier = dataset.tier;
        this.renderAthletes();
        break;
      case 'exportData':
        const blob = new Blob([this.db.exportData()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = 'sharkrank_backup.json'; link.click();
        URL.revokeObjectURL(url);
        this.toast('Dados exportados!');
        break;
      case 'importData':
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = e => {
          const reader = new FileReader();
          reader.onload = ev => {
            if (this.db.importData(ev.target.result)) {
              this.toast('Dados importados!');
              this.navigate('dashboard');
            } else {
              this.toast('Erro ao importar', 'error');
            }
          };
          reader.readAsText(e.target.files[0]);
        };
        input.click();
        break;
      case 'resetData':
        if (confirm('Resetar todos os dados?')) {
          this.db.resetData();
          this.db.seedData();
          localStorage.setItem('sharkrank_initialized', 'true');
          this.toast('Dados resetados!');
          this.navigate('dashboard');
        }
        break;
    }
  }

  showAddAthleteModal() {
    this.showModal(`
      <div class="modal-handle"></div>
      <div class="modal-title">➕ Novo Atleta</div>
      <div class="form-group"><label class="form-label">Nome Completo</label><input class="form-input" id="new-name" placeholder="Ex: João Silva"></div>
      <div class="form-group"><label class="form-label">Apelido</label><input class="form-input" id="new-nick" placeholder="Ex: Tubarão"></div>
      <div class="form-group"><label class="form-label">Posição</label><select class="form-select" id="new-pos"><option>Atacante</option><option>Levantador</option><option>Completo</option></select></div>
      <div class="form-group"><label class="form-label">Idade</label><input class="form-input" id="new-age" type="number" placeholder="25"></div>
      <button class="btn btn-primary btn-block" data-action="saveNewAthlete">Adicionar Atleta</button>
    `);
  }

  saveNewAthlete() {
    const name = document.getElementById('new-name').value.trim();
    const nickname = document.getElementById('new-nick').value.trim();
    const position = document.getElementById('new-pos').value;
    const age = parseInt(document.getElementById('new-age').value) || null;
    if (!name) { this.toast('Preencha o nome', 'error'); return; }
    this.db.addAthlete({ name, nickname, position, age });
    this.hideModal();
    this.toast(`${name} adicionado!`);
    this.navigate('athletes');
  }

  saveAssessment() {
    const athleteId = document.getElementById('assess-athlete').value;
    if (!athleteId) { this.toast('Selecione um atleta', 'error'); return; }
    const skills = {};
    document.querySelectorAll('.assess-slider').forEach(s => { skills[s.dataset.skill] = parseInt(s.value); });
    const notes = document.getElementById('assess-notes').value;
    this.db.addAssessment({ athleteId, skills, notes });
    this.toast('Avaliação salva!');
    this.navigate('profile', { id: athleteId });
  }
}

// Initialize
const app = new SharkRankApp();
document.addEventListener('DOMContentLoaded', () => app.init());
