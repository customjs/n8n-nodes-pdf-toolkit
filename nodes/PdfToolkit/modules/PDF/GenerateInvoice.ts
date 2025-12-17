import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { ApiHelper } from '../ApiHelper';

export async function executeGenerateInvoice(
    executeFunctions: IExecuteFunctions,
    apiHelper: ApiHelper,
    itemIndex: number
): Promise<INodeExecutionData> {
    const item = executeFunctions.getInputData()[itemIndex];
    const issuer = executeFunctions.getNodeParameter('issuer.issuerValues', itemIndex) as IDataObject;
    const recipient = executeFunctions.getNodeParameter('recipient.recipientValues', itemIndex) as IDataObject;
    const itemsJson = executeFunctions.getNodeParameter('itemsJson', itemIndex);
    const invoiceItems = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;

    const data = { issuer, recipient, items: invoiceItems };
    const body = {
        input: data,
        code: `
			const { HTML2PDF } = require('./utils');
			const nunjucks = require('nunjucks');
			const fetch = require('node-fetch');
			const tpl = 'https://www.customjs.space/pdf-templates/Invoice1.html';
			const templateString = await fetch(tpl).then(r => r.text());
			const renderedHtml = await nunjucks.renderString(templateString, { invoiceData: JSON.stringify(input) });
			return HTML2PDF(renderedHtml);
		`,
        returnBinary: 'true',
    };

    const response = await apiHelper.makeRequest('n8n/invoice-generator', body, true, itemIndex);
    const outputFilename = executeFunctions.getNodeParameter('outputFilenamePdf', itemIndex, 'Invoice.pdf') as string;

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
