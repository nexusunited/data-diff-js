const {DiffParser} = require('./diff-parser')

module.exports = (type, identifier, separator = null, encoding='utf8', debug = false) => new DiffParser(type, identifier, separator,encoding, debug);
