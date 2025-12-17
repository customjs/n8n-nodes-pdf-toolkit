import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ApiHelper } from '../ApiHelper';

export async function executeGetFormFields(
    executeFunctions: IExecuteFunctions,
    apiHelper: ApiHelper,
    itemIndex: number
): Promise<INodeExecutionData> {
    const item = executeFunctions.getInputData()[itemIndex];
    const binaryPropertyName = executeFunctions.getNodeParameter('binaryPropertyName', itemIndex) as string;
    const binaryData = item.binary?.[binaryPropertyName];
    if (!binaryData) throw new Error(`Binary property ${binaryPropertyName} not found`);

    const body = {
        input: { file: Buffer.from(binaryData.data, 'base64') },
        code: `
			const { PDF_GET_FORM_FIELD_NAMES } = require('./utils'); 
			const pdfInput = input.file;
			return PDF_GET_FORM_FIELD_NAMES(pdfInput);`,
        returnBinary: 'false',
    };

    const response = await apiHelper.makeRequest('n8n/getFormFieldNames', body, false, itemIndex);
    return { json: response, pairedItem: { item: itemIndex } };
}
