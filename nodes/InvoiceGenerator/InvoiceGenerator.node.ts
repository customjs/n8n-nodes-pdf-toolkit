import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	IBinaryData,
} from 'n8n-workflow';

export class InvoiceGenerator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Invoice Generator (CustomJS)',
		name: 'invoiceGenerator',
		icon: "file:customJs.svg",
		group: ['transform'],
		version: 1,
		description: 'Create PDF invoices from data and templates',
		defaults: {
			name: 'Invoice Generator',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'customJsApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'PDF Template',
				name: 'pdfTemplate',
				type: 'options',
				required: true,
				default: '1-en',
				options: [
					{
						name: 'Template 1 (EN)',
						value: '1-en',
					},
				],
			},
			{
				displayName: 'Issuer (Sender Information)',
				name: 'issuer',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {},
				placeholder: 'Add Issuer',
				options: [
					{
						name: 'issuerValues',
						displayName: 'Issuer',
						values: [
							{ displayName: 'Company Name', name: 'companyName', type: 'string', default: '' },
							{ displayName: 'Address (Multiline)', name: 'address', type: 'string', typeOptions: { multiLine: true }, default: '' },
							{ displayName: 'Email (optional)', name: 'email', type: 'string', default: '' },
							{ displayName: 'Phone (optional)', name: 'phone', type: 'string', default: '' },
							{ displayName: 'Tax ID (optional)', name: 'taxId', type: 'string', default: '' },
							{ displayName: 'Logo URL (optional)', name: 'logoUrl', type: 'string', default: '' },
						]
					}
				],
			},
			{
				displayName: 'Payment Information',
				name: 'payment',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {},
				placeholder: 'Add Payment Information',
				options: [
					{
						name: 'paymentValues',
						displayName: 'Payment',
						values: [
							{ displayName: 'Account Number (IBAN / US Account / SWIFT depending on country)', name: 'accountNumber', type: 'string', default: '' },
							{ displayName: 'BIC / SWIFT Code (optional)', name: 'BIC', type: 'string', default: '' },
							{ displayName: 'Bank Name', name: 'bankName', type: 'string', default: '' },
							{ displayName: 'Reference Prefix', name: 'referencePrefix', type: 'string', default: '' },
						]
					}
				],
			},
			{
				displayName: 'Recipient (Customer Information)',
				name: 'recipient',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {},
				placeholder: 'Add Recipient',
				options: [
					{
						name: 'recipientValues',
						displayName: 'Recipient',
						values: [
							{ displayName: 'Customer Name', name: 'name', type: 'string', default: '' },
							{ displayName: 'Address (Multiline)', name: 'address', type: 'string', typeOptions: { multiLine: true }, default: '' },
							{ displayName: 'Tax ID (optional)', name: 'taxId', type: 'string', default: '' },
						]
					}
				],
			},
			{
				displayName: 'Billing Information',
				name: 'billing',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {},
				placeholder: 'Add Billing Information',
				options: [
					{
						name: 'billingValues',
						displayName: 'Billing',
						values: [
							{ displayName: 'Invoice Number', name: 'invoiceNumber', type: 'string', default: '' },
							{ displayName: 'Invoice Date', name: 'invoiceDate', type: 'string', default: '' },
							{ displayName: 'Due Date (optional)', name: 'dueDate', type: 'string', default: '' },
							{ displayName: 'Currency (e.g. EUR, USD)', name: 'currency', type: 'string', default: '' },
							{ displayName: 'Tax Rate (%)', name: 'taxRate', type: 'number', default: 0 },
							{ displayName: 'Notes (optional)', name: 'notes', type: 'string', typeOptions: { multiLine: true }, default: '' },
						]
					}
				],
			},
			{
				displayName: 'Items',
				name: 'items',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: 'Add Item',
				options: [
					{
						name: 'itemsValues',
						displayName: 'Items',
						values: [
							{ displayName: 'Description', name: 'description', type: 'string', default: '' },
							{ displayName: 'Quantity', name: 'quantity', type: 'number', default: 1 },
							{ displayName: 'Unit Price', name: 'unitPrice', type: 'number', default: 0 },
						]
					}
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const credentials = await this.getCredentials('customJsApi');
			const pdfTemplate = this.getNodeParameter('pdfTemplate', i) as string;
			const issuer = this.getNodeParameter('issuer.issuerValues', i) as IDataObject;
			const payment = this.getNodeParameter('payment.paymentValues', i) as IDataObject;
			const recipient = this.getNodeParameter('recipient.recipientValues', i) as IDataObject;
			const billing = this.getNodeParameter('billing.billingValues', i) as IDataObject;
			const invoiceItems = this.getNodeParameter('items.itemsValues', i) as IDataObject[];

			const invoiceData = {
				issuer,
				payment,
				recipient,
				billing,
				items: invoiceItems,
			};

			const code = `
				const { HTML2PDF } = require('./utils');
				const nunjucks = require('nunjucks');
				const fetch = require('node-fetch');
				const tpl = 'https://www.customjs.space/pdf-templates/Invoice1.html';
				const templateString = await fetch(tpl).then(r => r.text());
				const renderedHtml = await nunjucks.renderString(
					templateString, 
					{ invoiceData: JSON.stringify(input).replace(/\\\\/g, '\\\\\\\\').replace(/'/g, \"\\\\'\").replace(/\\n/g, '\\\\n')
					 
					}
				);
				console.log('renderedHtml', renderedHtml);
				return HTML2PDF(renderedHtml);
			`;

			const options = {
				url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
				method: 'POST',
				headers: {
					'customjs-origin': 'n8n/invoice-generator',
					'x-api-key': credentials.apiKey,
				},
				body: {
					input: invoiceData,
					code: code,
					returnBinary: 'true',
				},
				encoding: 'binary',
				json: true,
			};

			const response = await this.helpers.request(options);
			if (!response || (Buffer.isBuffer(response) && response.length === 0)) {
				// No binary data returned; emit only JSON without a binary property
				returnData.push({
					json: items[i].json,
				});
				continue;
			}

			const binaryData = await this.helpers.prepareBinaryData(
				response,
				"Invoice.pdf"
			);

			returnData.push({
				json: items[i].json,
				binary: {
					data: binaryData,
				},
			});
		}

		return [returnData];
	}
}
