const fileHandler = require('./file-handler');
const {getComparator} = require('./comparator');

function DiffParser(type, identifier, separator = null) {
    this.comparator = getComparator(type, {identifier, separator});

    this.createDiffFile = async function (inputOld, inputNew, {full, path}) {
        (inputOld !== '' || typeof inputOld !== 'string') && await this.comparator.consume(getHandle(inputOld));
        await this.comparator.compare(getHandle(inputNew));

        if (path !== null) {
            return writeFile(path, this.comparator.getOutput(full, true));
        } else {
            return this.comparator.getOutput(full);
        }
    };

    const getHandle = function (fileHandleOrPath) {
        return ('string' === typeof fileHandleOrPath) ? fileHandler.createFileHandler(fileHandleOrPath) : fileHandleOrPath;
    };

    const writeFile = function (pathObj, deltaObj) {
        fileHandler.writeFile(deltaObj.insert.join('\n'), pathObj.insert);
        fileHandler.writeFile(deltaObj.update.join('\n'), pathObj.update);

        return pathObj;
    };
}

module.exports = {
    DiffParser
};
