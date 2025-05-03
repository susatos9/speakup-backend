"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeFormality = analyzeFormality;
const axios_1 = __importDefault(require("axios"));
async function analyzeFormality(text) {
    try {
        const response = await axios_1.default.post('https://cheesecz-formality-classifier-arkav.hf.space/predict', { text }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    }
    catch (error) {
        console.error('Formality analysis error:', error.message);
        throw new Error(`Failed to analyze formality: ${error.message}`);
    }
}
// Example usage:
/*
const result = await analyzeFormality("Yo bro, how is life?");
console.log(result);
// Output:
// {
//     classification: "Your speech is 18% formal and 82% informal.",
//     formal_percent: 18,
//     formality_score: 0.176,
//     informal_percent: 82,
//     text: "Yo bro, how is life?"
// }
*/
//# sourceMappingURL=formality.js.map