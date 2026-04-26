// ============================================================
// SharkRank - Data Management Layer
// Handles all CRUD operations with localStorage persistence
// ============================================================

const SKILLS = [
  { key: 'saque', label: 'Saque', icon: '🏐' },
  { key: 'ataque', label: 'Ataque', icon: '💥' },
  { key: 'defesa', label: 'Defesa', icon: '🛡️' },
  { key: 'levantamento', label: 'Levantamento', icon: '🎯' },
  { key: 'controle', label: 'Controle de Bola', icon: '⚡' },
  { key: 'rede', label: 'Jogo de Rede', icon: '🕸️' },
  { key: 'fisico', label: 'Físico', icon: '💪' },
  { key: 'tatico', label: 'Tático', icon: '🧠' }
];

const TIERS = [
  { name: 'Shark', min: 90, max: 100, emoji: '🦈', color: '#00D4FF', gradient: 'linear-gradient(135deg, #00D4FF, #0044CC)' },
  { name: 'Diamante', min: 80, max: 89, emoji: '💎', color: '#B388FF', gradient: 'linear-gradient(135deg, #B388FF, #7C4DFF)' },
  { name: 'Ouro', min: 70, max: 79, emoji: '🥇', color: '#FFD54F', gradient: 'linear-gradient(135deg, #FFD54F, #FF8F00)' },
  { name: 'Prata', min: 55, max: 69, emoji: '🥈', color: '#B0BEC5', gradient: 'linear-gradient(135deg, #B0BEC5, #78909C)' },
  { name: 'Bronze', min: 40, max: 54, emoji: '🥉', color: '#BCAAA4', gradient: 'linear-gradient(135deg, #BCAAA4, #8D6E63)' },
  { name: 'Peixe', min: 0, max: 39, emoji: '🐟', color: '#80CBC4', gradient: 'linear-gradient(135deg, #80CBC4, #4DB6AC)' }
];

class SharkRankDB {
  constructor() {
    this.STORAGE_KEY = 'sharkrank_data';
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error loading data:', e);
    }
    return { athletes: [], assessments: [], matches: [] };
  }

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // === ATHLETES ===
  getAthletes() {
    return [...this.data.athletes].sort((a, b) => b.overall - a.overall);
  }

  getAthlete(id) {
    return this.data.athletes.find(a => a.id === id);
  }

  addAthlete(athlete) {
    const newAthlete = {
      id: this.generateId(),
      name: athlete.name,
      nickname: athlete.nickname || '',
      position: athlete.position || 'Atacante',
      age: athlete.age || null,
      photo: athlete.photo || null,
      skills: athlete.skills || { saque: 50, ataque: 50, defesa: 50, levantamento: 50, controle: 50, rede: 50, fisico: 50, tatico: 50 },
      overall: 0,
      tier: null,
      matches: 0,
      wins: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    newAthlete.overall = this.calculateOverall(newAthlete.skills);
    newAthlete.tier = this.getTier(newAthlete.overall);
    this.data.athletes.push(newAthlete);
    this.save();
    return newAthlete;
  }

  updateAthlete(id, updates) {
    const idx = this.data.athletes.findIndex(a => a.id === id);
    if (idx === -1) return null;
    Object.assign(this.data.athletes[idx], updates, { updatedAt: new Date().toISOString() });
    if (updates.skills) {
      this.data.athletes[idx].overall = this.calculateOverall(this.data.athletes[idx].skills);
      this.data.athletes[idx].tier = this.getTier(this.data.athletes[idx].overall);
    }
    this.save();
    return this.data.athletes[idx];
  }

  deleteAthlete(id) {
    this.data.athletes = this.data.athletes.filter(a => a.id !== id);
    this.data.assessments = this.data.assessments.filter(a => a.athleteId !== id);
    this.save();
  }

  // === ASSESSMENTS ===
  getAssessments(athleteId) {
    return this.data.assessments
      .filter(a => a.athleteId === athleteId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  addAssessment(assessment) {
    const newAssessment = {
      id: this.generateId(),
      athleteId: assessment.athleteId,
      skills: { ...assessment.skills },
      notes: assessment.notes || '',
      date: new Date().toISOString()
    };
    this.data.assessments.push(newAssessment);
    // Update athlete skills (weighted average with recent bias)
    const athlete = this.getAthlete(assessment.athleteId);
    if (athlete) {
      const prevAssessments = this.getAssessments(assessment.athleteId);
      if (prevAssessments.length <= 1) {
        this.updateAthlete(assessment.athleteId, { skills: { ...assessment.skills } });
      } else {
        const blended = {};
        SKILLS.forEach(s => {
          blended[s.key] = Math.round(athlete.skills[s.key] * 0.4 + assessment.skills[s.key] * 0.6);
        });
        this.updateAthlete(assessment.athleteId, { skills: blended });
      }
    }
    this.save();
    return newAssessment;
  }

  // === MATCHES ===
  getMatches(athleteId) {
    if (athleteId) {
      return this.data.matches.filter(m =>
        m.teamA.includes(athleteId) || m.teamB.includes(athleteId)
      ).sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return [...this.data.matches].sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  addMatch(match) {
    const newMatch = {
      id: this.generateId(),
      teamA: match.teamA,
      teamB: match.teamB,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      sets: match.sets || [],
      location: match.location || '',
      date: match.date || new Date().toISOString()
    };
    this.data.matches.push(newMatch);
    // Update win/match counts
    const winners = match.scoreA > match.scoreB ? match.teamA : match.teamB;
    const allPlayers = [...match.teamA, ...match.teamB];
    allPlayers.forEach(pid => {
      const athlete = this.getAthlete(pid);
      if (athlete) {
        const isWinner = winners.includes(pid);
        this.updateAthlete(pid, {
          matches: (athlete.matches || 0) + 1,
          wins: (athlete.wins || 0) + (isWinner ? 1 : 0)
        });
      }
    });
    this.save();
    return newMatch;
  }

  // === CALCULATIONS ===
  calculateOverall(skills) {
    const values = SKILLS.map(s => skills[s.key] || 0);
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }

  getTier(overall) {
    return TIERS.find(t => overall >= t.min && overall <= t.max) || TIERS[TIERS.length - 1];
  }

  getRanking() {
    return this.getAthletes();
  }

  getStats() {
    const athletes = this.getAthletes();
    const matches = this.getMatches();
    return {
      totalAthletes: athletes.length,
      totalMatches: matches.length,
      avgRating: athletes.length ? Math.round(athletes.reduce((s, a) => s + a.overall, 0) / athletes.length) : 0,
      topAthlete: athletes[0] || null,
      tierDistribution: TIERS.map(t => ({
        ...t,
        count: athletes.filter(a => a.overall >= t.min && a.overall <= t.max).length
      }))
    };
  }

  // === SEED DATA ===
  seedData() {
    const seedAthletes = [
      {
        name: 'Rafael Silva', nickname: 'Tubarão', position: 'Atacante', age: 28,
        skills: { saque: 95, ataque: 97, defesa: 85, levantamento: 88, controle: 93, rede: 94, fisico: 92, tatico: 91 }
      },
      {
        name: 'Lucas Santos', nickname: 'Foguete', position: 'Atacante', age: 25,
        skills: { saque: 88, ataque: 90, defesa: 78, levantamento: 82, controle: 86, rede: 85, fisico: 88, tatico: 80 }
      },
      {
        name: 'Mateus Almeida', nickname: 'Trovão', position: 'Levantador', age: 30,
        skills: { saque: 82, ataque: 75, defesa: 85, levantamento: 92, controle: 88, rede: 80, fisico: 78, tatico: 86 }
      },
      {
        name: 'Pedro Oliveira', nickname: 'Pantera', position: 'Atacante', age: 26,
        skills: { saque: 80, ataque: 82, defesa: 72, levantamento: 70, controle: 76, rede: 78, fisico: 75, tatico: 74 }
      },
      {
        name: 'Gabriel Lima', nickname: 'Serpente', position: 'Levantador', age: 24,
        skills: { saque: 70, ataque: 68, defesa: 78, levantamento: 85, controle: 80, rede: 72, fisico: 70, tatico: 75 }
      },
      {
        name: 'Thiago Costa', nickname: 'Flash', position: 'Atacante', age: 22,
        skills: { saque: 65, ataque: 70, defesa: 58, levantamento: 55, controle: 62, rede: 60, fisico: 68, tatico: 55 }
      },
      {
        name: 'André Rocha', nickname: 'Máquina', position: 'Levantador', age: 27,
        skills: { saque: 58, ataque: 52, defesa: 62, levantamento: 68, controle: 60, rede: 55, fisico: 56, tatico: 58 }
      },
      {
        name: 'Bruno Ferreira', nickname: 'Águia', position: 'Atacante', age: 20,
        skills: { saque: 48, ataque: 55, defesa: 42, levantamento: 40, controle: 50, rede: 45, fisico: 52, tatico: 42 }
      }
    ];

    seedAthletes.forEach(a => this.addAthlete(a));

    // Seed some matches
    const ids = this.data.athletes.map(a => a.id);
    const seedMatches = [
      { teamA: [ids[0], ids[2]], teamB: [ids[1], ids[3]], scoreA: 2, scoreB: 1, sets: ['18x15', '12x18', '18x14'], location: 'Praia de Copacabana', date: new Date(Date.now() - 86400000 * 2).toISOString() },
      { teamA: [ids[1], ids[4]], teamB: [ids[3], ids[5]], scoreA: 2, scoreB: 0, sets: ['18x12', '18x10'], location: 'Praia de Ipanema', date: new Date(Date.now() - 86400000 * 5).toISOString() },
      { teamA: [ids[0], ids[5]], teamB: [ids[2], ids[6]], scoreA: 2, scoreB: 1, sets: ['18x16', '15x18', '18x11'], location: 'Enseada de Botafogo', date: new Date(Date.now() - 86400000 * 8).toISOString() },
      { teamA: [ids[4], ids[7]], teamB: [ids[6], ids[5]], scoreA: 1, scoreB: 2, sets: ['18x16', '14x18', '10x18'], location: 'Praia do Leblon', date: new Date(Date.now() - 86400000 * 12).toISOString() }
    ];

    seedMatches.forEach(m => this.addMatch(m));

    // Seed assessments
    seedAthletes.forEach((a, i) => {
      const athlete = this.data.athletes[i];
      if (athlete) {
        this.data.assessments.push({
          id: this.generateId(),
          athleteId: athlete.id,
          skills: { ...a.skills },
          notes: 'Avaliação inicial',
          date: new Date(Date.now() - 86400000 * 15).toISOString()
        });
      }
    });

    this.save();
  }

  // === DATA MANAGEMENT ===
  exportData() {
    return JSON.stringify(this.data, null, 2);
  }

  importData(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (imported.athletes && imported.assessments && imported.matches) {
        this.data = imported;
        this.save();
        return true;
      }
    } catch (e) {
      console.error('Import error:', e);
    }
    return false;
  }

  resetData() {
    this.data = { athletes: [], assessments: [], matches: [] };
    localStorage.removeItem('sharkrank_initialized');
    this.save();
  }
}
