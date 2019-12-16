const DATAFOLDER = `${__dirname}/data/`;

module.exports = {
    DATAFOLDER,
    dataPath: (file) => `${DATAFOLDER}${file}`
}