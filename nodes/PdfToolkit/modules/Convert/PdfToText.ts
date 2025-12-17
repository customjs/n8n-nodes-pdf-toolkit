import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ApiHelper } from '../ApiHelper';

export async function executePdfToText(
    executeFunctions: IExecuteFunctions,
    itemIndex: number
): Promise<INodeExecutionData> {
    const apiHelper = new ApiHelper(executeFunctions);
    const item = executeFunctions.getInputData()[itemIndex];
    const inputType = executeFunctions.getNodeParameter('inputType', itemIndex) as string;
    const body: any = {
        code: `
			const { PDFTOTEXT } = require('./utils'); 
			input = input.file || input.urls; 
			return PDFTOTEXT(input);`,
        returnBinary: 'false',
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

    const response = await apiHelper.makeRequest('n8n/pdfToText', body, false, itemIndex);
    return { json: response, pairedItem: { item: itemIndex } };
}
