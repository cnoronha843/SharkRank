// ============================================================
// SharkRank - Canvas Chart Components
// Radar Chart, Progress Ring, Bar Chart
// ============================================================

class RadarChart {
  constructor(canvas, data, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.data = data; // Array of { label, value (0-100) }
    this.options = {
      size: options.size || 260,
      levels: options.levels || 5,
      maxValue: options.maxValue || 100,
      fillColor: options.fillColor || 'rgba(0, 212, 255, 0.25)',
      strokeColor: options.strokeColor || '#00D4FF',
      gridColor: options.gridColor || 'rgba(123, 140, 168, 0.15)',
      labelColor: options.labelColor || '#8892A4',
      dotColor: options.dotColor || '#00D4FF',
      animate: options.animate !== false,
      ...options
    };
    this.animationProgress = 0;
    this.dpr = window.devicePixelRatio || 1;
    this.setupCanvas();
  }

  setupCanvas() {
    const size = this.options.size;
    this.canvas.width = size * this.dpr;
    this.canvas.height = size * this.dpr;
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
    this.ctx.scale(this.dpr, this.dpr);
    this.centerX = size / 2;
    this.centerY = size / 2;
    this.radius = size / 2 - 40;
  }

  draw(progress = 1) {
    const { ctx, centerX, centerY, radius, data, options } = this;
    const numPoints = data.length;
    const angleStep = (Math.PI * 2) / numPoints;
    ctx.clearRect(0, 0, options.size, options.size);

    // Draw grid levels
    for (let level = 1; level <= options.levels; level++) {
      const r = (radius / options.levels) * level;
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = options.gridColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw axis lines
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
      ctx.strokeStyle = options.gridColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw data polygon
    ctx.beginPath();
    for (let i = 0; i <= numPoints; i++) {
      const idx = i % numPoints;
      const angle = idx * angleStep - Math.PI / 2;
      const value = (data[idx].value / options.maxValue) * radius * progress;
      const x = centerX + value * Math.cos(angle);
      const y = centerY + value * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Gradient fill
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 102, 255, 0.15)');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = options.strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw data points
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const value = (data[i].value / options.maxValue) * radius * progress;
      const x = centerX + value * Math.cos(angle);
      const y = centerY + value * Math.sin(angle);

      // Glow
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 212, 255, 0.3)';
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = options.dotColor;
      ctx.fill();
      ctx.strokeStyle = '#060B18';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw labels
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const labelR = radius + 24;
      const x = centerX + labelR * Math.cos(angle);
      const y = centerY + labelR * Math.sin(angle);
      ctx.fillStyle = options.labelColor;
      ctx.fillText(data[i].label, x, y);

      // Value below label
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillStyle = options.strokeColor;
      ctx.fillText(Math.round(data[i].value * progress), x, y + 13);
      ctx.font = '11px Inter, sans-serif';
    }
  }

  animate() {
    if (!this.options.animate) {
      this.draw(1);
      return;
    }
    let start = null;
    const duration = 800;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      this.draw(eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}

class ProgressRing {
  constructor(canvas, value, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.value = value;
    this.options = {
      size: options.size || 140,
      lineWidth: options.lineWidth || 10,
      bgColor: options.bgColor || 'rgba(123, 140, 168, 0.15)',
      color: options.color || '#00D4FF',
      gradientEnd: options.gradientEnd || '#0066FF',
      textColor: options.textColor || '#FFFFFF',
      fontSize: options.fontSize || 36,
      label: options.label || '',
      animate: options.animate !== false,
      ...options
    };
    this.dpr = window.devicePixelRatio || 1;
    this.setupCanvas();
  }

  setupCanvas() {
    const size = this.options.size;
    this.canvas.width = size * this.dpr;
    this.canvas.height = size * this.dpr;
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  }

  draw(progress = 1) {
    const { ctx, options } = this;
    const size = options.size;
    const center = size / 2;
    const radius = center - options.lineWidth / 2 - 4;
    const currentValue = this.value * progress;

    ctx.clearRect(0, 0, size, size);

    // Background ring
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = options.bgColor;
    ctx.lineWidth = options.lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Progress arc
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (Math.PI * 2 * (currentValue / 100));
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, options.color);
    gradient.addColorStop(1, options.gradientEnd);
    ctx.beginPath();
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = options.lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Glow effect
    ctx.shadowColor = options.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(center, center, radius, endAngle - 0.1, endAngle);
    ctx.strokeStyle = options.color;
    ctx.lineWidth = options.lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center text - value
    ctx.font = `bold ${options.fontSize}px Inter, sans-serif`;
    ctx.fillStyle = options.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(currentValue), center, center - (options.label ? 8 : 0));

    // Label
    if (options.label) {
      ctx.font = '11px Inter, sans-serif';
      ctx.fillStyle = '#7B8CA8';
      ctx.fillText(options.label, center, center + 18);
    }
  }

  animate() {
    if (!this.options.animate) { this.draw(1); return; }
    let start = null;
    const duration = 1000;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.draw(eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}

class MiniBarChart {
  constructor(canvas, data, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.data = data; // Array of { label, value, color? }
    this.options = {
      width: options.width || 300,
      height: options.height || 160,
      barColor: options.barColor || '#00D4FF',
      bgColor: options.bgColor || 'rgba(123, 140, 168, 0.1)',
      labelColor: options.labelColor || '#7B8CA8',
      ...options
    };
    this.dpr = window.devicePixelRatio || 1;
    this.setupCanvas();
  }

  setupCanvas() {
    this.canvas.width = this.options.width * this.dpr;
    this.canvas.height = this.options.height * this.dpr;
    this.canvas.style.width = this.options.width + 'px';
    this.canvas.style.height = this.options.height + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  }

  draw(progress = 1) {
    const { ctx, data, options } = this;
    const { width, height } = options;
    const padding = { top: 10, bottom: 25, left: 10, right: 10 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const barWidth = Math.min(30, (chartW / data.length) * 0.6);
    const gap = (chartW - barWidth * data.length) / (data.length + 1);

    ctx.clearRect(0, 0, width, height);

    const maxVal = Math.max(...data.map(d => d.value), 1);

    data.forEach((d, i) => {
      const x = padding.left + gap + i * (barWidth + gap);
      const barH = (d.value / maxVal) * chartH * progress;
      const y = padding.top + chartH - barH;

      // Bar with gradient
      const grad = ctx.createLinearGradient(x, y, x, padding.top + chartH);
      grad.addColorStop(0, d.color || options.barColor);
      grad.addColorStop(1, 'rgba(0, 212, 255, 0.1)');
      ctx.fillStyle = grad;

      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, padding.top + chartH);
      ctx.lineTo(x, padding.top + chartH);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.fill();

      // Value
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(d.value * progress), x + barWidth / 2, y - 5);

      // Label
      ctx.font = '9px Inter, sans-serif';
      ctx.fillStyle = options.labelColor;
      ctx.fillText(d.label, x + barWidth / 2, height - 5);
    });
  }

  animate() {
    let start = null;
    const duration = 700;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      this.draw(1 - Math.pow(1 - progress, 3));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}
