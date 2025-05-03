import axios from 'axios';
import { FormalityResponse } from '../models/formality';

export async function analyzeFormality(text: string): Promise<FormalityResponse> {
    try {
        const response = await axios.post<FormalityResponse>(
            'https://cheesecz-formality-classifier-arkav.hf.space/predict',
            { text },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        return response.data;
    } catch (error: any) {
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
