import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ApiHelper } from '../ApiHelper';

export async function executeJsonSelect(
    executeFunctions: IExecuteFunctions,
    itemIndex: number
): Promise<INodeExecutionData> {
    const apiHelper = new ApiHelper(executeFunctions);
    const item = executeFunctions.getInputData()[itemIndex];
    const json = executeFunctions.getNodeParameter('json', itemIndex);
    const path = executeFunctions.getNodeParameter('path', itemIndex) as string;
    const body = {
        input: { json, path },
        code: "const { JSONPath } = require('jsonpath-plus'); return JSONPath({ path: input.path, json: JSON.parse(input.json) });",
        returnBinary: 'false',
    };

    const response = await apiHelper.makeRequest('make/jsonSelector', body, false, itemIndex);
    return { json: { result: response }, pairedItem: { item: itemIndex } };
}
