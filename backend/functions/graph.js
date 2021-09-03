const borderColours = ['rgb(200, 0, 0)', 'rgb(0, 200, 0)', 'rgb(0, 0, 200)', 'rgb(200, 200, 0)', 'rgb(200, 0, 200)', 'rgb(0, 200, 200)', 'rgb(255, 128, 0)'];

const times = ["10:00","10:05","10:10","10:15","10:20","10:25","10:30","10:35","10:40","10:45","10:50","10:55","11:00","11:05","11:10","11:15","11:20","11:25","11:30","11:35","11:40","11:45","11:50","11:55","12:00","12:05","12:10","12:15","12:20","12:25","12:30","12:35","12:40","12:45","12:50","12:55","13:00","13:05","13:10","13:15","13:20","13:25","13:30","13:35","13:40","13:45","13:50","13:55","14:00","14:05","14:10","14:15","14:20","14:25","14:30","14:35","14:40","14:45","14:50","14:55","15:00","15:05","15:10","15:15","15:20","15:25","15:30","15:35","15:40","15:45","15:50","15:55","16:00","16:05","16:10","16:15","16:20","16:25","16:30","16:35","16:40","16:45","16:50","16:55","17:00","17:05","17:10","17:15","17:20","17:25","17:30","17:35","17:40","17:45","17:50","17:55","18:00","18:05","18:10","18:15","18:20","18:25","18:30","18:35","18:40","18:45","18:50","18:55","19:00","19:05","19:10","19:15","19:20","19:25","19:30","19:35","19:40","19:45","19:50","19:55","20:00","20:05","20:10","20:15","20:20","20:25","20:30","20:35","20:40","20:45","20:50","20:55","21:00","21:05","21:10","21:15","21:20","21:25","21:30","21:35","21:40","21:45","21:50","21:55","22:00"];

const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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
};

function formatDate(d) {
  return new Date(`${d.substring(6, 10)}-${d.substring(3, 5)}-${d.substring(0, 2)}`);
}

async function createGraph(climbingData, dates, averageData) {

  let datasets = [];

  for (let i = 0; i < dates.length; i++) {
    let offset = 0;
    let data = await climbingData.find( { _id: { $regex: dates[i] }} ).toArray();
    if (data.length === 0) return {error: `No data for ${dates[i]}`}; 
    let label = formatDate(data[0]["_id"]);
    let counts = data.map(item => item.count);

    // If the dataset label isn't the current day
    if (label.setHours(0,0,0,0) !== new Date().setHours(0,0,0,0)) {
      for (let i = 0; i < times.length; i++) {
        if (!data[i] || (data[i]["_id"].substring(12) !== times[i + offset])) {
          offset++;
          // Use the data from before to fill in
          if (counts[i-1]) {
            counts.splice(i, 0, counts[i-1]);
          } else { // Otherwise the data from after
            counts.splice(i, 0, counts[i]);
          }
        }
      }
    }

    datasets.push({
      label: `${days[label.getDay()].charAt(0).toUpperCase() + days[label.getDay()].slice(1)}, ${label.toLocaleString('en-GB', { hour12: false, timeZone: 'Europe/London' }).substring(0, 10)}`,
      data: counts,
      fill: false,
      borderWidth: 2,
      borderColor: borderColours[i],
      pointRadius: 2.5,
    })
  }

  if (averageData) {
    let averageCounts = [];
    for (let i = 0; i < times.length; i++) {
      let total = 0;
      let count = 0;
      for (let dataset of datasets) {
        if (dataset.data[i]) {
          count++;
          total += dataset.data[i];
        }
      }
      averageCounts.push(Math.round(total / count));
    }

    if (averageData.show !== 'true') {
      datasets = [];
    }

    datasets.unshift({
      label: `Average ${averageData.day}`,
      data: averageCounts,
      fill: false,
      borderWidth: 2,
      borderColor: 'rgb(0, 0, 0)',
      pointRadius: 2.5,
    })
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
  async defaultGraph(climbingData, args) {
    if (!args) return {error: 'No date(s) provided'}; 
    args = args.split(',');
    if (args.length > 7) return {error: 'Too many dates provided'};

    let dates = [];

    for (let i = 0; i < args.length; i++) {
      if (args[i].match(/(^today$)|(^t$)/)) {
        let d = new Date();
        dates.push(d.toLocaleString('en-GB', { hour12: false, timeZone: 'Europe/London' }).substring(0, 10));
      } else if (args[i].match(/(^yesterday$)|(^y$)/)) {
        let d = new Date();
        d.setDate(d.getDate() - 1);
        dates.push(d.toLocaleString('en-GB', { hour12: false, timeZone: 'Europe/London' }).substring(0, 10));
      } else if (!args[i].match(/^([0-9]{2}[/]){2}[0-9]{4}$/)) {
        return {error: `${args[i]} is not a valid date`}; 
      } else {       
        dates.push(args[i])    
      }
    }

    return createGraph(climbingData, dates);
  },


  async rangeGraph(climbingData, args) {
    if (!args) return {error: `No dates provided`}
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
      dates.push(start.toLocaleString('en-GB', { hour12: false, timeZone: 'Europe/London' }).substring(0, 10));
      start.setDate(start.getDate() + 1);
    }

    if (dates.length > 7) return {error: 'Too many dates provided'};

    return createGraph(climbingData, dates);
  },

  
  async averageGraph(climbingData, day, show) {
    if (!day) return {error: 'No day provided'}; 
    if (show && !show.match(/(^true$)|(^false$)/)) return {error: 'Show must be a boolean value'}; 

    if (day.match(/(^today$)|(^t$)/)) {
      const date = new Date();
      day = days[date.getDay()];
    } else if (day.match(/(^yesterday$)|(^y$)/)) {
      let date = new Date();
      date.setDate(date.getDate() - 1);
      day = days[date.getDay()];
    }

    const inputDay = day.toLowerCase();

    if (!days.includes(inputDay)) return {error: 'Invalid day provided'};

    let start = new Date();

    let today = start.getDay();
    let difference = days.indexOf(inputDay) - today;

    if ((days.indexOf(inputDay) - today) > 0) {
      difference -= 7;
    }

    start.setDate(start.getDate() + difference);

    let hours = new Date().toLocaleString('en-GB', { hour12: false, timeZone: 'Europe/London' }).slice(-8).substring(0, 2);

    if (hours < 10 && difference === 0) {
      start.setDate(start.getDate() - 42);
    } else {
      start.setDate(start.getDate() - 35);
    }

    let dates = [];

    for (let i = 1; i < 7; i++) {
      dates.push(start.toLocaleString('en-GB', { hour12: false, timeZone: 'Europe/London' }).substring(0, 10));
      start.setDate(start.getDate() + 7);
    }

    return createGraph(climbingData, dates, { day: day.charAt(0).toUpperCase() + day.slice(1), show: show });
  }
}