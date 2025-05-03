export interface ServiceConfig {
    url: string;
    headers: Record<string, string>;
}

export interface ServiceResponse {
    url: string;
    result?: any;
    error?: Error;
} 