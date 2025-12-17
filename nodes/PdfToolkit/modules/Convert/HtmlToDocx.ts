import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ApiHelper } from '../ApiHelper';

export async function executeHtmlToDocx(
    executeFunctions: IExecuteFunctions,
    apiHelper: ApiHelper,
    itemIndex: number
): Promise<INodeExecutionData> {
    const item = executeFunctions.getInputData()[itemIndex];
    const html = executeFunctions.getNodeParameter('html', itemIndex) as string;
    const body: any = {
        input: html,
        code: "const { HTML2DOCX } = require('./utils'); return HTML2DOCX(input)",
        returnBinary: 'true',
    };

    const response = await apiHelper.makeRequest('n8n/html2Docx', body, true, itemIndex);
    const outputFilename = executeFunctions.getNodeParameter('outputFilenameDocx', itemIndex, 'output.docx') as string;

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
