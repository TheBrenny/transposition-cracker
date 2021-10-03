const globalAlphabet = "abcdefghijklmnopqrstuvwxyz";

// This list helps us determine how many
//     alphabets are likely to be used
//     based on the IC value.
// Source: ZEIT3102 - Cryptography
let alphabetICs = [
    0.0660, 0.0520, 0.0473, 0.0450, 0.0436,
    0.0427, 0.0420, 0.0415, 0.0411, 0.0408,
    0.0405, 0.0403, 0.0402, 0.0400, 0.0399
];

// Determines the alphabet count based on the IC.
function approxAlphabetCount(ic) {
    let idx = 0;
    for(idx = 0; idx < alphabetICs.length; idx++) {
        if(ic > alphabetICs[idx]) break;
    }
    return idx + 1; // plus 1 bc js indexes are zero based.
}

// Calculate the IC from the data using 1 alphabet, so it can help
// give us an indicator as to how many alphabets are likely being used.
function calculateIC(data, alphabet) {
    data = data.toLowerCase().replace(/[^a-z]/gi, ""); // strip any fakers (non-alpha chars)

    if(!alphabet) alphabet = globalAlphabet; // backup alphabet is global alphabet

    // The IC is calculated by:
    //   1. counting each character,
    //   2. summing the (almost) squared counts (count * count-1)
    //   3. divide by the (almost) squared length of the data (length * length-1)

    let frequencies = Array.from(alphabet).map(l => (data.match(new RegExp(l, "gi")) || []).length);
    let sum = 0;

    for(let i = 0; i < alphabet.length; i++) {
        sum += (frequencies[i] * (frequencies[i] - 1));
    }

    sum = sum / (data.length * (data.length - 1));
    return sum;
}

// export!
module.exports = {
    calculateIC,
    approxAlphabetCount,
};