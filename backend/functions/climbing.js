const fetch = require('node-fetch');

module.exports = { 
  async getClimbingCount() {
    const response = await fetch('https://portal.rockgympro.com/portal/public/2660c1de4a602e808732f0bcd3fea712/occupancy?&iframeid=occupancyCounter&fId=');
    const text = await response.text();
    // Retrieves the count and capacity with a regex and removes all non-numbers
    const count = text.match(/('count' : ).+/)[0].replace(/[^0-9]/g, '');
    const capacity = text.match(/('capacity' : ).+/)[0].replace(/[^0-9]/g, '');
    
    return [count, capacity];
  }
}