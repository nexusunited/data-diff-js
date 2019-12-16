const hasher = require('../hasher');

const HEADER = 'HEADER'
const HEADERHASH = 'HEADERHASH'

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
        return this.newValue;
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
                        let field = '';

                        if (index === 0) {
                            this.headerOld = Object.getOwnPropertyNames(entry);
                            field = HEADERHASH;
                        } else {
                            field = entry[this.identifier];
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
                        if (index === 0) {
                            headerNew = Object.getOwnPropertyNames(entry);
                        }
                        const hashedObj = hashObject(headerNew, entry);

                        if (index === 0) {
                            if (hashedObj === oldValues[HEADERHASH]) {
                                newValue.header = headerNew;
                            } else {
                                newHeaderFields = headerNew.filter(e => !oldValues[HEADER].includes(e));
                                newHeaderFields.unshift(this.identifier);

                                newValue.header = newHeaderFields;
                                newValue.headerNew = true;
                                newValue.preHeaderUpdate.header = this.headerOld;
                            }
                        }
                        let sku = entry[this.identifier];

                        if (!newValue.headerNew) {
                            if (typeof oldValues[sku] !== 'string') {
                                newValue.insert.push(entry);
                            } else if (oldValues[sku] !== hashedObj) {
                                newValue.update.push(entry);
                            }
                        } else if (newValue.headerNew) {
                            let deltaEntry = {};
                            let cleanedEntry = {};

                            newHeaderFields.forEach(field => deltaEntry[field] = entry[field]);
                            headerNew.forEach(
                                (field, index) => {
                                    const isIdentifier = field === this.identifier;
                                    const isNewHeaderField = newHeaderFields.includes(field);

                                    if(isIdentifier || !isNewHeaderField){
                                        cleanedEntry[field] = entry[index];
                                    }
                                });

                            if (typeof oldValues[sku] !== 'string') {
                                newValue.preHeaderUpdate.insert.push(cleanedEntry);
                            } else if (oldValues[sku] !== hashObject(Object.getOwnPropertyNames(cleanedEntry), cleanedEntry)) {
                                newValue.preHeaderUpdate.update.push(cleanedEntry);
                            }
                            newValue.update.push(deltaLine);
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
        return arrayString
            .substr(2, arrayString.length - 4)
            .split('},{')
            .map(jsonString => JSON.parse(`{${jsonString}}`));
    };

    const hashObject = function (properties, entry) {
        return hasher.hashObject(properties, entry);
    };
}

module.exports = {
    JsonHandler
};
