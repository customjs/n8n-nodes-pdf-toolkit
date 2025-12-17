import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ApiHelper } from '../ApiHelper';

export async function executePdfToPng(
    executeFunctions: IExecuteFunctions,
    itemIndex: number
): Promise<INodeExecutionData> {
    const apiHelper = new ApiHelper(executeFunctions);
    const item = executeFunctions.getInputData()[itemIndex];
    const inputType = executeFunctions.getNodeParameter('inputType', itemIndex) as string;
    const body: any = {
        code: `
			const { PDF2PNG } = require('./utils'); 
			input = input.file || input.urls; 
			return PDF2PNG(input);`,
        returnBinary: 'true',
    };

    if (inputType === 'binary') {
        const binaryPropertyName = executeFunctions.getNodeParameter('binaryPropertyName', itemIndex) as string;
        const binaryData = item.binary?.[binaryPropertyName];
        if (!binaryData) throw new Error(`Binary property ${binaryPropertyName} not found`);
        body.input = { file: Buffer.from(binaryData.data, 'base64') };
    } else {
        const url = executeFunctions.getNodeParameter('url', itemIndex) as string;
        body.input = { urls: url };
    }

    const response = await apiHelper.makeRequest('n8n/pdfToPng', body, true, itemIndex);
    const outputFilename = executeFunctions.getNodeParameter('outputFilenamePng', itemIndex, 'output.png') as string;

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
