const NodeCache = require("node-cache");

const subjectCache = new NodeCache({ stdTTL: 60 * 60 });

module.exports = {
    subjectCache
}