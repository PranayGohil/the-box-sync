/* eslint-disable no-underscore-dangle,no-unused-vars */
import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useSelector } from 'react-redux';

const ChartDoughnut = ({ orderCategoryWise }) => {
  const { themeValues } = useSelector((state) => state.settings);
  const chartContainer = useRef(null);

  const colors = [themeValues.tertiary, themeValues.secondary, themeValues.primary, '#f59e0b', '#6366f1', '#10b981', '#f43f5e', '#8b5cf6'];
  const bgColors = colors.map(c => `rgba(${parseInt(c.slice(1,3), 16)}, ${parseInt(c.slice(3,5), 16)}, ${parseInt(c.slice(5,7), 16)}, 0.1)`);

  const ChartTooltip = React.useMemo(() => {
    return {
      enabled: true,
      position: 'nearest',
      backgroundColor: themeValues.foreground,
      titleColor: themeValues.primary,
      titleFont: themeValues.font,
      bodyColor: themeValues.body,
      bodyFont: themeValues.font,
      bodySpacing: 10,
      padding: 15,
      borderColor: themeValues.separator,
      borderWidth: 1,
      cornerRadius: parseInt(themeValues.borderRadiusMd, 10),
      displayColors: false,
      intersect: true,
    };
  }, [themeValues]);

  const CenterTextPlugin = React.useMemo(() => {
    return {
      beforeDraw(chart) {
        const {
          ctx,
          chartArea: { width, height },
          _metasets,
        } = chart;

        if (!_metasets?.length) return;

        ctx.restore();
        const { total } = _metasets[0];
        
        let activeLabel = chart.data.labels[0] || '';
        let activeValue = chart.data.datasets[0]?.data[0] || 0;
        let activePercentage = total ? parseFloat(((activeValue / total) * 100).toFixed(1)) : 0;

        const activeElements = chart.getActiveElements();
        if (activeElements?.length > 0) {
          const { datasetIndex, index } = activeElements[0];
          activeLabel = chart.data.labels[index] || '';
          activeValue = chart.data.datasets[datasetIndex]?.data[index] || 0;
          activePercentage = total ? parseFloat(((activeValue / total) * 100).toFixed(1)) : 0;
        }

        const centerX = width / 2;
        const centerY = height / 2;
        const baseSize = Math.min(width, height);
        const percentageSize = Math.max(14, Math.floor(baseSize / 8));
        const labelSize = Math.max(8, Math.floor(baseSize / 22));

        ctx.font = `900 ${percentageSize}px ${themeValues.font}`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = themeValues.body;
        ctx.fillText(`${activePercentage}%`, centerX, centerY + (labelSize / 2));

        ctx.fillStyle = themeValues.alternate;
        ctx.font = `700 ${labelSize}px ${themeValues.font}`;
        const displayLabel = activeLabel.length > 20 ? `${activeLabel.substring(0, 17)}...`.toUpperCase() : activeLabel.toUpperCase();
        ctx.fillText(displayLabel, centerX, centerY - (percentageSize / 2) - 5);
        ctx.save();
      },
    };
  }, [themeValues]);

  const data = React.useMemo(() => {
    return {
      labels: orderCategoryWise.map((item) => item.category),
      datasets: [
        {
          label: '',
          borderColor: colors.slice(0, orderCategoryWise.length),
          backgroundColor: colors.slice(0, orderCategoryWise.length).map(c => `${c}1A`), // 10% opacity
          borderWidth: 2,
          data: orderCategoryWise.map((item) => item.totalOrders),
        },
      ],
    };
  }, [themeValues, orderCategoryWise]);

  const config = React.useMemo(() => {
    return {
      type: 'doughnut',
      plugins: [CenterTextPlugin],
      options: {
        plugins: {
          legend: { display: false },
          tooltip: ChartTooltip,
        },
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
      },
      data,
    };
  }, [data, ChartTooltip, CenterTextPlugin]);

  useEffect(() => {
    Chart.register(...registerables);
    const myChart = new Chart(chartContainer.current, config);
    return () => myChart.destroy();
  }, [config]);

  return (
    <div className="d-flex flex-column h-100">
      
      <div style={{ position: 'relative', height: '240px' }} className="mb-2">
        <canvas ref={chartContainer} />
      </div>
      <div className="mt-4 pt-3 border-top w-100 chart-doughnut-legend-mask" style={{ '--mask-opacity': orderCategoryWise.length > 5 ? 1 : 0 }}>
        <div className="d-flex flex-column gap-2 px-1 chart-doughnut-premium-scroll overflow-auto" style={{ maxHeight: '160px', paddingBottom: '15px' }}>
          {orderCategoryWise.map((item, idx) => (
            <div key={idx} className="d-flex align-items-center justify-content-between py-1">
              <div className="d-flex align-items-center overflow-hidden">
                <div 
                  className="rounded-circle me-2 flex-shrink-0" 
                  style={{ width: '8px', height: '8px', backgroundColor: colors[idx % colors.length] }} 
                />
                <span className="text-muted smaller fw-bold text-truncate" style={{ fontSize: '0.75rem' }}>{item.category}</span>
              </div>
              <span className="fw-bold small text-primary ms-2" style={{ fontSize: '0.75rem' }}>{item.totalOrders}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChartDoughnut);
