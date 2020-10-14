const hasher = require('../hasher');

const HEADERHASH = 'HEADERHASH';

function JsonHandler(identifier) {
    this.identifier = identifier;
    this.headerOld = [];
    this.oldValues = {};
    this.newValue = {
        header: [],
        insert: [],
        update: [],
        headerNew: false,
        preHeaderUpdate: {
            header: [],
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

    this.getOutput = function (full = false, outputForFile = false) {
        if (outputForFile) {
            // format delta for fileOutput
        } else if (!full && this.newValue.headerNew) {
            const {preHeaderUpdate} = this.newValue;
            return {
                header: preHeaderUpdate.header,
                insert: preHeaderUpdate.insert,
                update: preHeaderUpdate.update
            }
        } else if (!full) {
            return {
                header: this.newValue.header,
                insert: this.newValue.insert,
                update: this.newValue.update
            };
        } else {
            return this.newValue;
        }
    };

    const parseOldFile = (fileHandle) => {
        const oldFileParserPromise = new Promise((resolve) => {
            let json = '',
                oldVal = {};

            fileHandle
                .on('line', (line) => {
                    json = json.concat(line);
                })
                .on('close', () => {
                    const parsedJson = parseJsonArray(json);

                    parsedJson.forEach((entry, index) => {
                        let field = entry[this.identifier];

                        if (index === 0) {
                            this.headerOld = Object.getOwnPropertyNames(entry);
                            oldVal[HEADERHASH] = hashHeader(this.headerOld);
                        }

                        oldVal[field] = hashObject(this.headerOld, entry);
                    });

                    resolve(oldVal)
                });
        });

        return oldFileParserPromise.then(values => {
            this.oldValues = values;
            fileHandle.close();
        });
    };

    const parseNewFile = (fileHandle) => {
        const {oldValues} = this;

        const newFileParserPromise = new Promise((resolve) => {
            let json = '',
                headerNew = [],
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
                };

            fileHandle
                .on('line', (line) => {
                    json = json.concat(line);
                })
                .on('close', () => {
                    const parsedJson = parseJsonArray(json);

                    parsedJson.forEach((entry, index) => {
                        let sku = entry[this.identifier];
                        const hashedObj = hashObject(headerNew, entry);

                        if (index === 0) {
                            headerNew = Object.getOwnPropertyNames(entry);

                            if (hashHeader(headerNew) === oldValues[HEADERHASH]) {
                                newValue.header = headerNew;
                            } else if (typeof oldValues[HEADERHASH] === 'string') {
                                newHeaderFields = headerNew.filter(e => !this.headerOld.includes(e));
                                newHeaderFields.unshift(this.identifier);

                                newValue.header = newHeaderFields;
                                newValue.headerNew = true;
                                newValue.preHeaderUpdate.header = this.headerOld;
                            } else {
                                newValue.header = headerNew;
                            }
                        }

                        if (newValue.headerNew) {
                            let deltaEntry = {};
                            let cleanedEntry = {};

                            newHeaderFields.forEach(field => deltaEntry[field] = entry[field]);
                            headerNew.forEach(
                                (field, index) => {
                                    const isIdentifier = field === this.identifier;
                                    const isNewHeaderField = newHeaderFields.includes(field);

                                    if (isIdentifier || !isNewHeaderField) {
                                        cleanedEntry[field] = entry[index];
                                    }
                                });

                            if (typeof oldValues[sku] !== 'string') {
                                newValue.preHeaderUpdate.insert.push(cleanedEntry);
                            } else if (oldValues[sku] !== hashObject(Object.getOwnPropertyNames(cleanedEntry), cleanedEntry)) {
                                newValue.preHeaderUpdate.update.push(cleanedEntry);
                            }
                            newValue.update.push(deltaEntry);
                        } else {
                            if (typeof oldValues[sku] !== 'string') {
                                newValue.insert.push(entry);
                            } else if (oldValues[sku] !== hashedObj) {
                                newValue.update.push(entry);
                            }
                        }
                    });

                    resolve(newValue)
                });
        });

        return newFileParserPromise.then(values => {
            this.newValue = values;
            fileHandle.close();
        });
    };

    const parseJsonArray = (arrayString) => {
        return (JSON.parse(`{"data":${arrayString}}`)).data;
    };

    const hashObject = (properties, entry) => {
        return hasher.hashObject(properties, entry);
    };

    const hashHeader = (header) => {
        return hashObject(header, objectFlip({...header}));
    };

    const objectFlip = (obj) => {
        return Object.entries(obj).reduce((ret, entry) => {
            const [key, value] = entry;
            ret[value] = key;
            return ret;
        }, {});
    };
}

module.exports = {
    JsonHandler
};
