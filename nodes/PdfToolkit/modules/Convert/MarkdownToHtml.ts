import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ApiHelper } from '../ApiHelper';

export async function executeMarkdownToHtml(
    executeFunctions: IExecuteFunctions,
    itemIndex: number
): Promise<INodeExecutionData> {
    const apiHelper = new ApiHelper(executeFunctions);
    const item = executeFunctions.getInputData()[itemIndex];
    const markdown = executeFunctions.getNodeParameter('markdown', itemIndex) as string;
    const body = {
        input: markdown,
        code: "const { MD2HTML } = require('./utils'); return MD2HTML(input)",
        returnBinary: 'false',
    };

    const response = await apiHelper.makeRequest('n8n/markdown2html', body, false, itemIndex);
    return { json: { output: response.toString() }, pairedItem: { item: itemIndex } };
}
