const {CsvHandler} = require('./csv-handler')
const {JsonHandler} = require('./json-handler')

/**
 * Compares two files content depending on type
 *
 * @param type
 * @param options
 * @returns {CsvHandler|JsonHandler}
 */
function getComparator(type, options) {
    let comparatorClass;

    switch (type) {
        case 'csv':
            comparatorClass = new CsvHandler(options.separator, options.identifier, options.debugging);
            break;
        case 'json':
            comparatorClass = new JsonHandler(options.identifier);
            break;
        default:
            break;
    }

    return comparatorClass;
}

module.exports = {
    getComparator
};
