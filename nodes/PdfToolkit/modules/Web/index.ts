import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ApiHelper } from '../ApiHelper';
import { executeScrape } from './Scrape';
import { executeScreenshot } from './Screenshot';
import { executeSslCheck } from './SslCheck';

export async function executeWeb(
    executeFunctions: IExecuteFunctions,
    apiHelper: ApiHelper,
    itemIndex: number,
    operation: string
): Promise<INodeExecutionData> {
    switch (operation) {
        case 'scrape':
            return executeScrape(executeFunctions, apiHelper, itemIndex);
        case 'screenshot':
            return executeScreenshot(executeFunctions, apiHelper, itemIndex);
        case 'sslCheck':
            return executeSslCheck(executeFunctions, apiHelper, itemIndex);
        default:
            throw new Error(`Unknown operation: ${operation}`);
    }
}
