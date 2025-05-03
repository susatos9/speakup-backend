export interface DummyDataEntry {
    transcript: string;
    filler: {
        chunks: Array<{
            text: string;
            timestamp: number[];
        }>;
    };
    grammar: {
        sentence_pairs: Array<{
            corrected: string;
            distance: number;
            original: string;
        }>;
        stats: {
            average_distance: number;
            sentences_corrected: number;
            total_sentences: number;
        };
    };
    pitchResult: {
        pitchAnalysis: {
            fluctuation_score: number;
            is_monotone: boolean;
            pitch_range: number;
        };
        pitchFluctuation: Array<{
            pitch: number;
            timestamp: number;
        }>;
        silentRatio: number;
    };
    formality: {
        formality_score: number;
        formal_percent: number;
        informal_percent: number;
        classification: string;
    };
}

export interface DummyData {
    [key: string]: DummyDataEntry;
}

export interface AudioAnalysisResult {
    success: boolean;
    transcript: string;
    timestamp: string;
    excerciseID: string;
    filler: any; // Keeping as any since the actual type might vary
    grammar: any; // Keeping as any since the actual type might vary
    pitch: any; // Keeping as any since the actual type might vary
    formality: any; // Keeping as any since the actual type might vary
} 