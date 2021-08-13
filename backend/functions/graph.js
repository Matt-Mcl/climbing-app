function formatDatetime(dt) {
  return new Date(`${dt.substring(6, 10)}-${dt.substring(3, 5)}-${dt.substring(0, 2)}T${dt.substring(12)}`);
}

function formatDate(d) {
  return new Date(`${d.substring(6, 10)}-${d.substring(3, 5)}-${d.substring(0, 2)}`);
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

const times = ["10:00","10:05","10:10","10:15","10:20","10:25","10:30","10:35","10:40","10:45","10:50","10:55","11:00","11:05","11:10","11:15","11:20","11:25","11:30","11:35","11:40","11:45","11:50","11:55","12:00","12:05","12:10","12:15","12:20","12:25","12:30","12:35","12:40","12:45","12:50","12:55","13:00","13:05","13:10","13:15","13:20","13:25","13:30","13:35","13:40","13:45","13:50","13:55","14:00","14:05","14:10","14:15","14:20","14:25","14:30","14:35","14:40","14:45","14:50","14:55","15:00","15:05","15:10","15:15","15:20","15:25","15:30","15:35","15:40","15:45","15:50","15:55","16:00","16:05","16:10","16:15","16:20","16:25","16:30","16:35","16:40","16:45","16:50","16:55","17:00","17:05","17:10","17:15","17:20","17:25","17:30","17:35","17:40","17:45","17:50","17:55","18:00","18:05","18:10","18:15","18:20","18:25","18:30","18:35","18:40","18:45","18:50","18:55","19:00","19:05","19:10","19:15","19:20","19:25","19:30","19:35","19:40","19:45","19:50","19:55","20:00","20:05","20:10","20:15","20:20","20:25","20:30","20:35","20:40","20:45","20:50","20:55","21:00","21:05","21:10","21:15","21:20","21:25","21:30","21:35","21:40","21:45","21:50","21:55","22:00"];

async function createGraph(redisClient, scanner, dates) {

  let datasets = [];

  for (let i = 0; i < dates.length; i++) {
    let graphDate = dates[i].toLocaleString('en-GB', { timeZone: 'Europe/London' }).substring(0, 10);

    const scanQuery = `Climbing count: ${graphDate}*`

    let keys = await scan(scanner, scanQuery);

    if (keys.length === 0) return {error: `No data for ${graphDate}`}; 

    let dataset = [];

    for (let key of keys) {
      let value = await new Promise((resolve, reject) => {
        redisClient.get(key, function(err, reply) {
          resolve(parseInt(reply.replace(/\r/, '')));
        });
      });
      time = key.substring(28);
      dataset.push( {value: value, time: time} );
    }

    datasets.push( {data: dataset, label: formatDate(graphDate)} );
  }

  for (let i = 0; i < times.length; i++) {
    for (let dataset of datasets) {
      // If the dataset label isn't the current day
      if (dataset.label.setHours(0,0,0,0) !== new Date().setHours(0,0,0,0)) {
        // And the time is missing from the data
        if (!dataset.data[i] || (dataset.data[i].time !== times[i])) {
          // Use the data from before to fill in
          if (dataset.data[i-1]) {
            dataset.data.splice(i, 0, {value: dataset.data[i-1].value, time: times[i]} );
          } else { // Otherwise the data from after
            dataset.data.splice(i, 0, {value: dataset.data[i].value, time: times[i]} );
          }
        }
      }
    }
  }

  let graphSets = [];

  for (let i = 0; i < datasets.length; i++) {
    datasets[i].data = datasets[i].data.map(a => a.value);
    graphSets.push({
      label: datasets[i].label.toLocaleString('en-GB', { timeZone: 'Europe/London' }).substring(0, 10),
      data: datasets[i].data,
      fill: false,
      borderWidth: 2,
      borderColor: borderColours[i],
      pointRadius: 2.5,
    });
  }

  return ({
    type: 'line',
    data: { 
      labels: times, 
      datasets: graphSets,
    },
    options: options,
  });
}

module.exports = { 

  // Plot an average graph for given day of the week
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
      // Formats date from returned keys
      graphDate = key.substring(16, 26);
      time = key.substring(28);
      let date = formatDate(graphDate);
      const day = days[date.getDay()];

      // If the day matches input
      if (inputDay === day) {
        if (!lastDate) lastDate = date;
        // Get value of key
        let value = await new Promise((resolve, reject) => {
          redisClient.get(key, function(err, reply) {
            resolve(parseInt(reply.replace(/\r/, '')));
          });
        });
        // Check if date has changed or not
        if (date.getTime() === lastDate.getTime()) {
          // If it hasn't, it's pushed to a datasey
          dataset.push( {value: value, time: time} );
        } else {
          // If it has, a new dataset is made for it
          datasets.push( { data: dataset, label: lastDate } );
          dataset = [];
          dataset.push( {value: value, time: time} );
        } 
        lastDate = date;
      }
    }

    // Push remaining dataset to datasets array
    datasets.push( { data: dataset, label: lastDate } );
    // Only use last 6 weeks of data
    datasets = datasets.slice(-6);

    let graphData = [];

    for (let i = 0; i < times.length; i++) {
      let total = 0;
      let count = 0;
      for (let dataset of datasets) {
        // Form average using data within dataset it exists
        if (dataset.data[i]) {
          total += parseInt(dataset.data[i].value);
          count ++;
        }
        // If the dataset label isn't the current day
        if (dataset.label.setHours(0,0,0,0) !== new Date().setHours(0,0,0,0)) {
          // And the time is missing from the data
          if (!dataset.data[i] || (dataset.data[i].time !== times[i])) {
            // Use the data from before to fill in
            if (dataset.data[i-1]) {
              dataset.data.splice(i, 0, {value: dataset.data[i-1].value, time: times[i]} );
            } else { // Otherwise the data from after
              dataset.data.splice(i, 0, {value: dataset.data[i].value, time: times[i]} );
            }
          }
        }
      }
      graphData.push(Math.round(total / count));
    }

    let graphSets = [];
    // Push average line to graph sets
    graphSets.push({
      label: `Average ${inputDay.charAt(0).toUpperCase() + inputDay.slice(1)}`,
      data: graphData,
      fill: false,
      borderWidth: 2,
      borderColor: 'rgb(0, 0, 0)',
      pointRadius: 2.5,
    });

    // If show is enabled, push all the remaining datasets
    if (args[1] === 'true') {
      for (let i = 0; i < datasets.length; i++) {
        datasets[i].data = datasets[i].data.map(a => a.value);
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

  // Plot a graph for given dates
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

  // Plot a graph for given date range
  async rangeGraph(redisClient, scanner, args) {
    if (!args[0]) return {error: `No start date provided`};
    if (!args[1]) return {error: `No end date provided`};

    for (let i = 0; i < args.length; i++) {
      if (!args[i].match(/^([0-9]{2}[/]){2}[0-9]{4}$/)) return {error: `${args[i]} is not a valid date`};
    }

    let dates = [];

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
