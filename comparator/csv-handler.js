const hasher = require('../hasher');

const HEADER = 'HEADER';
const HEADERHASH = 'HEADERHASH';

function CsvHandler(separator, identifier) {
    this.separator = separator;
    this.identifier = identifier;

    this.headerOld = [];
    this.oldValues = {};

    this.newValue = {
        header: '',
        insert: [],
        update: [],
        headerNew: false,
        preHeaderUpdate: {
            header: '',
            insert: [],
            update: [],
        }
    };

    this.consume = async function (fileHandler) {
        await parseOldFile(fileHandler);
    };

    this.compare = async function (fileHandler) {
        await parseNewFile(fileHandler);
    };

    this.getOutput = function (outputForFile = false) {
        if (outputForFile) {
            // format delta for fileOutput
        } else if (this.newValue.headerNew) {
            const {preHeaderUpdate} = this.newValue;
            return {
                header: preHeaderUpdate.header,
                insert: preHeaderUpdate.insert,
                update: preHeaderUpdate.update
            }
        } else {
            return {
                header: this.newValue.header,
                insert: this.newValue.insert,
                update: this.newValue.update
            };
        }
    };

    const parseOldFile = (fileHandle) => {
        const oldFileParserPromise = new Promise((resolve) => {
            let count = 0,
                skuIndex = 0,
                oldVal = {};

            fileHandle.on('line', (line) => {
                let lineSplit = line.split(this.separator);
                let field;

                if (count === 0) {
                    this.headerOld = lineSplit;
                    oldVal[HEADER] = lineSplit;
                    field = HEADERHASH;
                } else {
                    skuIndex = this.headerOld.indexOf(this.identifier);
                    field = lineSplit[skuIndex];
                }

                oldVal[field] = getHash(line);

                count++
            });

            fileHandle.on('close', () => resolve(oldVal))
        });

        return oldFileParserPromise.then(values => {
            this.oldValues = values;
            fileHandle.close();
        });
    };

    const parseNewFile = (newFileHandle) => {
        const {oldValues} = this;

        const newFileParserPromise = new Promise((resolve) => {
            let headerNew = [],
                newHeaderFields = [],
                newValue = {
                    header: '',
                    insert: [],
                    update: [],
                    headerNew: false,
                    preHeaderUpdate: {
                        header: '',
                        insert: [],
                        update: [],
                    }
                },
                count = 0,
                skuIndex = 0;

            newFileHandle.on('line', (line) => {
                let lineSplit = line.split(this.separator);
                let hashedLine = getHash(line);

                skuIndex = headerNew.indexOf(this.identifier);
                let sku = lineSplit[skuIndex];

                if (!newValue.headerNew && count > 0) {
                    if (typeof oldValues[sku] !== 'string') {
                        newValue.insert.push(line);
                    } else if (oldValues[sku] !== hashedLine) {
                        newValue.update.push(line);
                    }
                } else if (newValue.headerNew) {
                    let deltaLine = newHeaderFields.map(field => lineSplit[headerNew.indexOf(field)]).join(this.separator);
                    let cleanedLine = headerNew.map(
                        (field, index) => {
                            const isIdentifier = field === this.identifier;
                            const isNewHeaderField = newHeaderFields.includes(field);

                            return isIdentifier || !isNewHeaderField ? lineSplit[index] : null
                        })
                        .filter(Boolean)
                        .join(this.separator)
                    ;

                    if (typeof oldValues[sku] !== 'string') {
                        newValue.preHeaderUpdate.insert.push(cleanedLine);
                    } else if (oldValues[sku] !== getHash(cleanedLine)) {
                        newValue.preHeaderUpdate.update.push(cleanedLine);
                    }
                    newValue.update.push(deltaLine);
                }

                if (count === 0) {
                    headerNew = lineSplit;

                    if (hashedLine === oldValues[HEADERHASH]) {
                        newValue.header = line;
                    } else if (typeof oldValues[HEADERHASH] === 'string') {
                        newHeaderFields = headerNew.filter(e => !this.headerOld.includes(e));
                        newHeaderFields.unshift(this.identifier);

                        newValue.header = newHeaderFields.join(this.separator);
                        newValue.headerNew = true;
                        newValue.preHeaderUpdate.header = this.headerOld;
                    } else {
                        newValue.header = line;
                    }
                }

                count++
            }).on('close', () => resolve(newValue))
        });

        return newFileParserPromise.then(values => {
            this.newValue = values;
            newFileHandle.close();
        });
    };

    const getHash = function (input) {
        return hasher.getHash(input);
    };
}

module.exports = {
    CsvHandler
};
