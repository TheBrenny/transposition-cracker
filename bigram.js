const csv = require("csv-parse");
const fs = require('fs');
const path = require("path");
const {EventEmitter} = require("stream");

const emitter = new EventEmitter();
const bigramFreqs = {};
let bigramsRead = false;

function readCSV() {
    return new Promise((resolve, _reject) => {
        fs.createReadStream(path.join(__dirname, `bigram_frequencies.csv`))
            .pipe(csv())
            .on('data', function (row) {
                bigramFreqs[row[0]] = parseInt(row[1]);
            })
            .on('end', function () {
                bigramsRead = true;
                emitter.emit("ready");
                resolve();
            });
    });
}

function estimateKeyLength(d, bounds) {
    if(bounds === undefined) bounds = [3, 10];
    if(!Array.isArray(bounds)) bounds = [bounds];
    if(bounds.length < 2) bounds = [3, bounds[0]];
    if(bounds.length > 2) bounds = [bounds[0], bounds[1]];

    let best = {
        length: 0,
        score: 0
    };
    let h = 0;
    for(let i = bounds[0]; i < bounds[1]; i++) {
        h = getScoreHue(bigramScore(d.replace(new RegExp(`(.{${i}})`, "gi"), "$1\n")));
        if(h > best.score) {
            best.score = h;
            best.length = i;
        }
    }

    return best.length;
}

function bigramScore(d) {
    if(!bigramsRead) {
        console.error("Bigrams not ready");
        return;
    }

    if(!Array.isArray(d) && typeof d === 'string') d = d.split("\n");

    let scores = [];
    for(let a = 0; a < d[0].length; a++) {
        // console.log("Key " + a);
        for(let b = 0; b < d[0].length; b++) {
            if(a == b) continue;

            scores[a] = scores[a] || [];
            scores[a][b] = 0;
            for(let row = 0; row < d.length; row++) {
                if(d[row].length <= a || d[row].length <= b) break;

                let aa = d[row].charAt(a).toUpperCase();
                let bb = d[row].charAt(b).toUpperCase();
                scores[a][b] += (bigramFreqs[aa + bb] || 0);
            }
        }
    }
    return scores;
}

function getBestMatches(scores) {
    let theBestScores = {};
    for(let a = 0; a < scores.length; a++) {
        let max = 0;
        for(let b = 0; b < scores[a].length; b++) {
            if(scores[a][b] > max) {
                max = scores[a][b];
                theBestScores[a + 1] = b + 1;
            }
        }
    }
    return theBestScores;
}

function getReverseKey(scores) {
    if(Array.isArray(scores)) scores = getBestMatches(scores);
    let len = Object.keys(scores).length;
    let start = Object.keys(scores).find(key => scores[key] === 1);
    if(start === undefined) return null;
    let key = [start];
    let lastKey = () => key[key.length - 1];
    for(let i = 1; i < len; i++) {
        key.push(scores[lastKey()]);
    }
    return key;
}

function getRealKey(key) {
    let outKey = [];
    for(let i = 0; i < key.length; i++) {
        outKey[key[i] - 1] = i + 1;
    }
    return outKey;
}

function getScoreHue(score) {
    let total = 0;
    for(let k = 0; k < score.length; k++) {
        for(let s = 0; s < score[k].length; s++) {
            if(!score[k][s]) continue;

            total += score[k][s];
        }
    }
    return total / (Math.pow(score.length, 1.1)); // We need to skew the results - idk why scoreLength ^ 1.1 works best...
}

readCSV();

module.exports = {
    listener: emitter,
    onReady: (() => new Promise(resolve => emitter.once("ready", resolve)))(),
    ready: () => bigramsRead,
    freqs: bigramFreqs,
    score: bigramScore,
    best: getBestMatches,
    reverseKey: getReverseKey,
    key: getRealKey,
    hue: getScoreHue,
    estimate: estimateKeyLength,
    ic: require("./ic")
};