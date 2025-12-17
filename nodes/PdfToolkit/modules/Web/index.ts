import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executeScrape } from './Scrape';
import { executeScreenshot } from './Screenshot';
import { executeSslCheck } from './SslCheck';

export async function executeWeb(
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
    operation: string
): Promise<INodeExecutionData> {
    switch (operation) {
        case 'scrape':
            return executeScrape(executeFunctions, itemIndex);
        case 'screenshot':
            return executeScreenshot(executeFunctions, itemIndex);
        case 'sslCheck':
            return executeSslCheck(executeFunctions, itemIndex);
        default:
            throw new Error(`Unknown operation: ${operation}`);
    }
}
