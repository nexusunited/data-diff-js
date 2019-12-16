const crypto = require('crypto');

const hashObject = function (properties, entry) {
    const mappedLine = properties.map(property => {
        if (typeof entry[property] === 'string') {
            return entry[property];
        }
        return JSON.stringify(entry[property]);
    }).join('');

    return getHash(mappedLine);
};

const getHash = function (input) {
    return crypto.createHash('md5').update(input, 'utf8').digest('hex')
};

module.exports = {
    hashObject,
    getHash
};
