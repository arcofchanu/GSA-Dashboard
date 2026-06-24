const ChartManager = {
  modelChartInstance: null,
  behaviorChartInstance: null,
  timelineChartInstance: null,

  init(modelsData, behaviorsData, timelineData) {
    this.renderModelChart(modelsData);
    this.renderBehaviorChart(behaviorsData);
    this.renderTimelineChart(timelineData);
  },

  renderModelChart(data) {
    const ctx = document.getElementById('modelChart').getContext('2d');
    if (this.modelChartInstance) this.modelChartInstance.destroy();

    this.modelChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Wins',
          data: Object.values(data),
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  },

  renderBehaviorChart(data) {
    const ctx = document.getElementById('behaviorChart').getContext('2d');
    if (this.behaviorChartInstance) this.behaviorChartInstance.destroy();

    this.behaviorChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Wins',
          data: Object.values(data),
          backgroundColor: '#8b5cf6', // A distinct purple color
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  },



  renderTimelineChart(data) {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    if (this.timelineChartInstance) this.timelineChartInstance.destroy();

    // If no data, just don't render or render empty
    if (!data || Object.keys(data).length === 0) return;

    this.timelineChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Wins Over Time',
          data: Object.values(data),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#10b981',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8', stepSize: 1 } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 } }
        }
      }
    });
  }
};
