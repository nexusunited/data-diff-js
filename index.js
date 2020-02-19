const {DiffParser} = require('./diff-parser')

module.exports = (type, identifier, separator = null, debug = false) => new DiffParser(type, identifier, separator, debug);
