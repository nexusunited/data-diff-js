const handler = require('../../comparator/csv-handler');
const fileHandler = require('../../file-handler');
const testConstants = require('../constants.test')

const testHandlerObj = new handler.CsvHandler(';', 'Artikelnummer');

const fileA = fileHandler.createFileHandler(testConstants.dataPath('a.csv'));

testHandlerObj.consume(fileA)
    .then(() => {
            const fileB = fileHandler.createFileHandler(testConstants.dataPath('b.csv'));
            return testHandlerObj.compare(fileB).then((diff) => {
                console.log(diff);
            })
        }
    );
