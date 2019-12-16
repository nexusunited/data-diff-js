const fileHandler = require('./file-handler');
const {getComparator} = require('./comparator');

function DiffParser(type, identifier, separator = null) {
    this.comparator = getComparator(type, {identifier, separator});

    this.createDiffFile = async function (inputOld, inputNew, output = null) {
        (inputOld !== '' || typeof inputOld !== 'string') && await this.comparator.consume(getHandle(inputOld));
        const newValues = await this.comparator.compare(getHandle(inputNew));

        if (output !== null) {
            return writeFile(output, newValues);
        } else {
            return newValues;
        }
    };

    const getHandle = function (fileHandleOrPath) {
        return ('string' === typeof fileHandleOrPath) ? fileHandler.createFileHandler(fileHandleOrPath) : fileHandleOrPath;
    };

    const writeFile = function (path, inputArray) {
        fileHandler.writeFile(inputArray.join('\n'), path);
    };
}

module.exports = {
    DiffParser
};
