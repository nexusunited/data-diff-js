const {DiffParser} = require('./diff-parser')

module.exports = (type, identifier, separator = null) => new DiffParser(type, identifier, separator);
