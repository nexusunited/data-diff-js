const handler = require('../../comparator/csv-handler');
const fileHandler = require('../../file-handler');
const testConstants = require('../constants.test')

const testHandlerObj = new handler.CsvHandler(';', 'Artikelnummer');

const fileA = fileHandler.createFileHandler(testConstants.dataPath('a.csv'));

testHandlerObj.consume(fileA)
    .then(() => {
            const fileB = fileHandler.createFileHandler(testConstants.dataPath('b.csv'));
            return testHandlerObj.compare(fileB).then(() => {
                const diff = testHandlerObj.getOutput();

                console.log(
                    `Inserts: ${diff.insert.length}`,
                    `Update: ${diff.update.length}`,
                    `Header new: ${diff.headerNew ? 'yes' : 'no'}`
                );
            })
        }
    );
