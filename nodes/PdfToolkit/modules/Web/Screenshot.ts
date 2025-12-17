import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ApiHelper } from '../ApiHelper';

export async function executeScreenshot(
    executeFunctions: IExecuteFunctions,
    itemIndex: number
): Promise<INodeExecutionData> {
    const apiHelper = new ApiHelper(executeFunctions);
    const item = executeFunctions.getInputData()[itemIndex];
    const url = executeFunctions.getNodeParameter('url', itemIndex) as string;
    const body = {
        input: url,
        code: "const { SCREENSHOT } = require('./utils'); return SCREENSHOT(input);",
        returnBinary: 'true',
    };

    const response = await apiHelper.makeRequest('n8n/screenshot', body, true, itemIndex);
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
}
