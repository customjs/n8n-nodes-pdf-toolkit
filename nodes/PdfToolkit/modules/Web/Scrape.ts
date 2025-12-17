import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ApiHelper } from '../ApiHelper';

export async function executeScrape(
    executeFunctions: IExecuteFunctions,
    itemIndex: number
): Promise<INodeExecutionData> {
    const apiHelper = new ApiHelper(executeFunctions);
    const item = executeFunctions.getInputData()[itemIndex];
    const url = executeFunctions.getNodeParameter('url', itemIndex) as string;
    const returnValueType = executeFunctions.getNodeParameter('returnValueType', itemIndex) as string;
    const debug = executeFunctions.getNodeParameter('debug', itemIndex) as boolean;
    const returnBinary = returnValueType === 'binary';

    const body: any = {
        input: JSON.stringify({ url }),
        code: `const { SCRAPER } = require('./utils'); const payload = input; return SCRAPER(payload.url, [], "${returnValueType === 'binary' ? 'image' : 'html'}", ${debug});`,
        returnBinary: returnBinary ? 'true' : 'false',
    };

    const response = await apiHelper.makeRequest('n8n/scraper', body, returnBinary, itemIndex);

    if (returnBinary) {
        const outputFilename = executeFunctions.getNodeParameter('outputFilenamePng', itemIndex, 'screenshot.png') as string;
        if (!response || (Buffer.isBuffer(response) && response.length === 0)) {
            return { json: item.json, pairedItem: { item: itemIndex } };
        }
        const binaryData = await executeFunctions.helpers.prepareBinaryData(response, outputFilename);
        return {
            json: item.json,
            binary: { data: binaryData },
            pairedItem: { item: itemIndex }
        };
    } else {
        return { json: { output: response.toString() }, pairedItem: { item: itemIndex } };
    }
}
