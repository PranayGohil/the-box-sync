/* eslint-disable no-underscore-dangle,no-unused-vars */
import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useSelector } from 'react-redux';
import ReactDOM from 'react-dom';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const ChartHorizontal = ({ weeklyRevenue }) => {
    const { themeValues } = useSelector((state) => state.settings);
    const chartContainer = useRef(null);
    const tooltipRef = useRef(null);

    const labels = weeklyRevenue.labels || [];
    const revenueData = weeklyRevenue.values || [];


    const data = React.useMemo(() => ({
        labels,
        datasets: [
            {
                label: 'Revenue',
                icon: 'money', // pick an icon
                borderColor: themeValues.primary,
                backgroundColor: `rgba(${themeValues.primaryrgb},0.1)`,
                data: revenueData,
            }
        ],
    }), [labels, revenueData, themeValues]);

    return (
        <>
            <canvas ref={chartContainer} />
            <div
                ref={tooltipRef}
                className="custom-tooltip position-absolute bg-foreground rounded-md border border-separator pe-none p-3 d-flex z-index-1 align-items-center opacity-0 basic-transform-transition"
            />
        </>
    );
};

export default React.memo(ChartHorizontal);
