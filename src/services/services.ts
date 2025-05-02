import { sendToService } from '../controllers/sendToService';

interface ServiceConfig {
    url: string;
    headers: Record<string, string>;
}

export async function processMultipleServices(
    filePath: string,
    services: ServiceConfig[]
): Promise<Array<{ url: string; result: any; error?: Error }>> {
    if (!filePath) {
        throw new Error('File path is required');
    }

    if (!services || services.length === 0) {
        throw new Error('At least one service configuration is required');
    }

    // Create an array of promises for each service
    const servicePromises = services.map(async (service) => {
        try {
            const result = await sendToService(
                filePath,
                15, // maxRetries
                20000, // retryDelay
                service.url,
                service.headers
            );
            return {
                url: service.url,
                result,
                error: undefined
            };
        } catch (error) {
            return {
                url: service.url,
                result: undefined,
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    });

    // Execute all promises concurrently using Promise.allSettled
    const results = await Promise.allSettled(servicePromises);

    // Process the results
    return results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return {url: services[index].url, result: result.value, };
        } else {
            return {
                url: services[index].url,
                result: undefined,
                error: result.reason instanceof Error ? result.reason : new Error(String(result.reason))
            };
        }
    });
}

export async function sendToAI (filePath: string, services: ServiceConfig[]) {
    const results = await processMultipleServices(filePath, services);

    // Or create a map if you need to look up by URL
    const urlToResultMap = new Map(results.map(({ url, result, error }) => [url, { result, error }]));

    // Then you can access specific results by URL
    const specificResult = urlToResultMap.get('https://example.com/api');
}




