export const chartColors = {
  primary: '#00A3FF',    // sl-blue
  secondary: '#7B2CBF',  // sl-purple
  success: '#4ADE80',    // green
  danger: '#E63946',     // sl-red
  warning: '#FF6B00',    // orange
  muted: '#808080',
  grid: '#2a1a1d',
  background: '#1a1215',
  text: '#C0C0C0',
  textMuted: '#808080',
};

export const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#1a1215',
    border: '1px solid rgba(0, 163, 255, 0.3)',
    boxShadow: '0 0 20px rgba(0, 163, 255, 0.2)',
    borderRadius: 0,
    padding: '8px 12px',
  },
  labelStyle: {
    color: '#C0C0C0',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  itemStyle: {
    color: '#C0C0C0',
    fontSize: '12px',
  },
};

export const axisStyle = {
  tick: { fill: chartColors.textMuted },
  axisLine: { stroke: chartColors.grid },
  tickLine: { stroke: chartColors.grid },
};

export const gridStyle = {
  strokeDasharray: '3 3',
  stroke: chartColors.grid,
};
