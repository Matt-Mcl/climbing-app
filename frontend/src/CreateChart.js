import React, { useEffect } from "react";
import Chart from 'chart.js/auto';

let LineChart;

const CreateChart = React.memo((props) => {
  useEffect(() => {
    buildChart();
  });

  const buildChart = () => {
    var ctx = document.getElementById("LineChart").getContext("2d");

    if (typeof LineChart !== "undefined") LineChart.destroy();

    LineChart = new Chart(ctx, props.graphData);
  }
  return (
    <div className="line-chart">
      <canvas id="LineChart" width="1200" height="600"/>
    </div>
  );
});

export default CreateChart;
