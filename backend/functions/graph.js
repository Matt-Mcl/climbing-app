const ChartJsImage = require('chartjs-to-image');
const path = require('path');

function formatDatetime(dt) {
  return new Date(`${dt.substring(6, 10)}-${dt.substring(3, 5)}-${dt.substring(0, 2)}T${dt.substring(12)}`);
}

async function scan(scanner, query) {
  return await new Promise((resolve, reject) => {
    return scanner.scan(query, (err, matches) => {
      resolve(matches.sort(function(a, b) {
        return formatDatetime(a.substring(16)) - formatDatetime(b.substring(16));
      }));
    });
  });
}

module.exports = { 
  async averageGraph(redisClient, scanner, args) {
    if (args.length === 0) return 'Please provide a day'; 

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const borderColours = ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)', 'rgb(255, 255, 0)', 'rgb(255, 128, 0)', 'rgb(0, 255, 255)'];

    if (args[0].match(/(^today$)|(^t$)/)) {
      const day = new Date();
      args[0] = days[day.getDay()];
    } else if (args[0].match(/(^yesterday$)|(^y$)/)) {
      let day = new Date();
      day.setDate(day.getDate() - 1);
      args[0] = days[day.getDay()];
    }

    const inputDay = args[0].toLowerCase();

    if (!days.includes(inputDay)) return 'Please provide a valid day'; 

    let keys = await scan(scanner, 'Climbing count: *');

    let datasets = [];

    let lastDate = null;
    let graphDate = null;
    let dataset = [];

    for (let key of keys) {
      graphDate = key.substring(16, 26);
      let date = new Date(`${graphDate.substring(6, 10)}-${graphDate.substring(3, 5)}-${graphDate.substring(0, 2)}`);
      const day = days[date.getDay()];

      if (inputDay === day) {
        if (!lastDate) lastDate = date;
        let value = await new Promise((resolve, reject) => {
          redisClient.get(key, function(err, reply) {
            resolve(reply);
          });
        });

        if (date.getTime() === lastDate.getTime()) {
          dataset.push(value);
        } else {
          datasets.push( { data: dataset, label: lastDate } );
          dataset = [];
          dataset.push(value);
        } 
        lastDate = date;
      }
    }

    datasets.push( { data: dataset, label: lastDate } );
    
    let max = 0;

    for (let i = 1; i < datasets.length; i++) {
      if (datasets[i].data.length > datasets[max].data.length) max = i;
    }

    let times = [];
    keys = await scan(scanner, `Climbing count: ${datasets[max].label.toLocaleString('en-GB', { timeZone: 'Europe/London' }).substring(0, 10)}*`);

    for (let key of keys) {
      times.push(key.substring(28, 33));
    }

    let graphData = [];

    for (let i = 0; i < datasets[max].data.length; i++) {
      let total = 0;
      let count = 0;
      for (let dataset of datasets) {
        if (dataset.data[i]) {
          total += parseInt(dataset.data[i]);
          count ++;
        }
      }
      graphData.push(Math.round(total / count));
    }

    let graphSets = [];

    graphSets.push({
      label: `Average ${inputDay.charAt(0).toUpperCase() + inputDay.slice(1)}`,
      data: graphData,
      fill: false,
      borderColor: 'rgb(0, 0, 0)',
      borderWidth: '5',
      pointRadius: 0,
    })
    
    if (args[1] === 'true') {
      datasets = datasets.slice(-6);
      for (let i = 0; i < datasets.length; i++) {
        graphSets.push({
          label: datasets[i].label.toLocaleString('en-GB', { timeZone: 'Europe/London' }).substring(0, 10),
          data: datasets[i].data,
          fill: false,
          borderWidth: '2',
          borderColor: borderColours[i],
          pointRadius: 0,
        });
      }
    }

    let myChart = new ChartJsImage();
    myChart.setConfig({
      type: 'line',
      data: { 
        labels: times, 
        datasets: graphSets,
      },
    });

    myChart.setWidth(1200).setHeight(600);

    await myChart.toFile(path.resolve(__dirname + '/../exportchart.png'));

    return true;
  },

  async regularGraph(redisClient, scanner, args) {
    if (args.length === 0) return 'Please provide a date'; 
    if (args.length > 6) return 'Too many dates provided'; 

    const borderColours = ['rgb(200, 0, 0)', 'rgb(0, 200, 0)', 'rgb(0, 0, 200)', 'rgb(200, 200, 0)', 'rgb(200, 0, 200)', 'rgb(0, 200, 200)'];

    let datasets = [];

    for (let i = 0; i < args.length; i++) {
      let graphDate;
      if (args[i].match(/(^today$)|(^t$)/)) {
        let d = new Date();
        graphDate = d.toLocaleString('en-GB', { timeZone: 'Europe/London' }).substring(0, 10);
      } else if (args[i].match(/(^yesterday$)|(^y$)/)) {
        let d = new Date();
        d.setDate(d.getDate() - 1);
        graphDate = d.toLocaleString('en-GB', { timeZone: 'Europe/London' }).substring(0, 10);
      } else if (!args[i].match(/^([0-9]{2}[/]){2}[0-9]{4}$/)) {
        return `${args[i]} is not a valid date`; 
      } else {       
        graphDate = args[i];    
      }

      const scanQuery = `Climbing count: ${graphDate}*`

      let keys = await scan(scanner, scanQuery);

      if (keys.length === 0) return `No data for ${graphDate}`; 

      let counts = [];

      for (let key of keys) {
        let value = await new Promise((resolve, reject) => {
          redisClient.get(key, function(err, reply) {
            resolve(reply);
          });
        });
        counts.push(value);
      }

      datasets.push(
        {
          label: scanQuery.substring(16, 26),
          data: counts,
          fill: false,
          borderColor: borderColours[i],
          pointRadius: 0,
        }
      );
    }

    let max = 0;

    for (let i = 1; i < datasets.length; i++) {
      if (datasets[i].data.length > datasets[max].data.length) max = i;
    }

    let times = [];
    let keys = await scan(scanner, `Climbing count: ${datasets[max].label}*`);

    for (let key of keys) {
      times.push(key.substring(28, 33));
    }

    let myChart = new ChartJsImage();
    myChart.setConfig({
      type: 'line',
      data: { 
        labels: times, 
        datasets: datasets,
      },
    });

    myChart.setWidth(1200).setHeight(600);

    await myChart.toFile(path.resolve(__dirname + '/../exportchart.png'));

    return true;
  },
};
