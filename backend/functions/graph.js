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

const options = {
  scales: {
    y: {
      min: 0,
      max: 100,
      title: {
        display: true,
        text: 'Count'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Time'
      }
    }
  }
}

const borderColours = ['rgb(200, 0, 0)', 'rgb(0, 200, 0)', 'rgb(0, 0, 200)', 'rgb(200, 200, 0)', 'rgb(200, 0, 200)', 'rgb(0, 200, 200)', 'rgb(255, 128, 0)'];

async function createGraph(redisClient, scanner, dates) {

  let datasets = [];

  for (let i = 0; i < dates.length; i++) {
    let graphDate = dates[i].toLocaleString('en-GB', { timeZone: 'Europe/London' }).substring(0, 10);

    const scanQuery = `Climbing count: ${graphDate}*`

    let keys = await scan(scanner, scanQuery);

    if (keys.length === 0) return {error: `No data for ${graphDate}`}; 

    let counts = [];

    for (let key of keys) {
      let value = await new Promise((resolve, reject) => {
        redisClient.get(key, function(err, reply) {
          resolve(parseInt(reply.replace(/\r/, '')));
        });
      });
      counts.push(value);
    }

    datasets.push(
      {
        label: scanQuery.substring(16, 26),
        data: counts,
        fill: false,
        borderWidth: 2,
        borderColor: borderColours[i],
        pointRadius: 2.5,
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

  return ({
    type: 'line',
    data: { 
      labels: times, 
      datasets: datasets,
    },
    options: options,
  });
}

module.exports = { 
  //
  async averageGraph(redisClient, scanner, args) {
    if (!args[0]) return {error: 'No day provided'}; 
    if (args[1] && !args[1].match(/(^true$)|(^false$)/)) return {error: 'Show must be a boolean value'}; 

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    if (args[0].match(/(^today$)|(^t$)/)) {
      const day = new Date();
      args[0] = days[day.getDay()];
    } else if (args[0].match(/(^yesterday$)|(^y$)/)) {
      let day = new Date();
      day.setDate(day.getDate() - 1);
      args[0] = days[day.getDay()];
    }

    const inputDay = args[0].toLowerCase();

    if (!days.includes(inputDay)) return {error: 'Invalid day provided'};

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
            resolve(parseInt(reply.replace(/\r/, '')));
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

    datasets = datasets.slice(-6);
    
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
      borderWidth: 2,
      borderColor: 'rgb(0, 0, 0)',
      pointRadius: 2.5,
    })
    
    if (args[1] === 'true') {
      for (let i = 0; i < datasets.length; i++) {
        graphSets.push({
          label: datasets[i].label.toLocaleString('en-GB', { timeZone: 'Europe/London' }).substring(0, 10),
          data: datasets[i].data,
          fill: false,
          borderWidth: 2,
          borderColor: borderColours[i],
          pointRadius: 2.5,
        });
      }
    }

    return ({
      type: 'line',
      data: { 
        labels: times, 
        datasets: graphSets,
      },
      options: options,
    });
  },

  //
  async regularGraph(redisClient, scanner, args) {
    if (!args || !args[0]) return {error: 'No date(s) provided'}; 
    args = args.split(',');
    if (args.length > 7) return {error: 'Too many dates provided'};

    let dates = []

    for (let i = 0; i < args.length; i++) {
      if (args[i].match(/(^today$)|(^t$)/)) {
        let d = new Date();
        dates.push(d)
      } else if (args[i].match(/(^yesterday$)|(^y$)/)) {
        let d = new Date();
        d.setDate(d.getDate() - 1);
        dates.push(d)
      } else if (!args[i].match(/^([0-9]{2}[/]){2}[0-9]{4}$/)) {
        return {error: `${args[i]} is not a valid date`}; 
      } else {       
        dates.push(args[i])    
      }
    }

    return createGraph(redisClient, scanner, dates);
  },

  //
  async rangeGraph(redisClient, scanner, args) {
    if (!args[0]) return {error: `No start date provided`};
    if (!args[1]) return {error: `No end date provided`};

    for (let i = 0; i < args.length; i++) {
      if (!args[i].match(/^([0-9]{2}[/]){2}[0-9]{4}$/)) return {error: `${args[i]} is not a valid date`};
    }

    let dates = [];

    function formatDate(d) {
      return new Date(`${d.substring(6, 10)}-${d.substring(3, 5)}-${d.substring(0, 2)}`);
    }

    let start = formatDate(args[0]);
    let end = formatDate(args[1]);

    if (end <= start) return {error: `End date must be after start date`};

    while (start <= end) {
      dates.push(new Date(start));
      start.setDate(start.getDate() + 1);
    }

    if (dates.length > 7) return {error: 'Too many dates provided'};

    return createGraph(redisClient, scanner, dates);
  },
};
