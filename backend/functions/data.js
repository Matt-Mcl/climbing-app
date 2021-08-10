
module.exports = {
  async getData(redisClient, scanner) {

    function formatDatetime(dt) {
        return new Date(`${dt.substring(6, 10)}-${dt.substring(3, 5)}-${dt.substring(0, 2)}T${dt.substring(12)}`);
    }

    async function scan(query) {
        return await new Promise((resolve, reject) => {
            return scanner.scan(query, (err, matches) => {
                resolve(matches.sort(function(a, b) {
                  return formatDatetime(a.substring(16)) - formatDatetime(b.substring(16));
                }));
            });
        });
    }

    let keys = await scan('Climbing count: *');

    records = [];

    for (let key of keys) {
        let value = await new Promise((resolve, reject) => {
            redisClient.get(key, function(err, reply) {
                resolve(reply);
            });
        });
        let date = key.substring(16, key.length);
        value = value.replace(/\r/, '');

        records.push({datetime: date, count: value});
    }

    return records;
  }
}