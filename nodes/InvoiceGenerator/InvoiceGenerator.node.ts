import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	IBinaryData,
	NodeOperationError,
	NodeConnectionType,
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
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'customJsApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Generate Invoice',
						value: 'invoiceGenerator',
						action: 'Generate Invoice',
					},
				],
				default: 'invoiceGenerator',
			},
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
				displayName: 'Items Input Mode',
				name: 'itemsMode',
				type: 'options',
				options: [
					{
						name: 'Define Manually',
						value: 'define',
					},
					{
						name: 'Use JSON Input',
						value: 'json',
					},
				],
				default: 'define',
			},
			{
				displayName: 'Items',
				name: 'items',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						itemsMode: ['define'],
					},
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
			{
				displayName: 'Items JSON',
				name: 'itemsJson',
				type: 'json',
				default: '[{"description":"Item 1","quantity":2,"unitPrice":50}]',
				displayOptions: {
					show: {
						itemsMode: ['json'],
					},
				},
				description: 'A JSON array of invoice items. E.g., [{"description":"Item 1","quantity":2,"unitPrice":50}]',
			},
			{
				displayName: 'Output Filename',
				name: 'outputFilename',
				type: 'string',
				default: 'Invoice.pdf',
				description: 'Name for the generated PDF file (include .pdf extension)',
				required: false,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try { // Added try block
				const credentials = await this.getCredentials('customJsApi');
				const pdfTemplate = this.getNodeParameter('pdfTemplate', i) as string;
				const issuer = this.getNodeParameter('issuer.issuerValues', i) as IDataObject;
				const payment = this.getNodeParameter('payment.paymentValues', i) as IDataObject;
				const recipient = this.getNodeParameter('recipient.recipientValues', i) as IDataObject;
				const billing = this.getNodeParameter('billing.billingValues', i) as IDataObject;
				const itemsMode = this.getNodeParameter('itemsMode', i) as string;
				let invoiceItems: IDataObject[];

				if (itemsMode === 'json') {
					const itemsJson = this.getNodeParameter('itemsJson', i);

					if (typeof itemsJson === 'string') {
						try {
							invoiceItems = JSON.parse(itemsJson);
						} catch (error) {
							if (error instanceof Error) {
								throw new Error(`Invalid JSON in 'Items JSON' field: ${error.message}`);
							}
							throw new Error(`Invalid JSON in 'Items JSON' field: ${String(error)}`);
						}
					} else if (Array.isArray(itemsJson)) {
						invoiceItems = itemsJson as IDataObject[];
					} else {
						invoiceItems = [];
					}
				} else {
					const itemsData = this.getNodeParameter('items', i) as { itemsValues: IDataObject[] };
					invoiceItems = itemsData.itemsValues;
				}

				invoiceItems = invoiceItems.map(item => {
					return {
						description: item.description,
						quantity: Number(item.quantity),
						unitPrice: Number(item.unitPrice),
					};
				});

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

			return HTML2PDF(renderedHtml);
		`;
				const options = {
					url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
					method: 'POST' as const,
					headers: {
						'customjs-origin': 'n8n/invoice-generator',
					},
					body: {
						input: invoiceData,
						code: code,
						returnBinary: 'true',
					},
					encoding: 'arraybuffer' as const,
					json: true,
				};

				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'customJsApi', options);
				if (!response || (Buffer.isBuffer(response) && response.length === 0)) {
					returnData.push({
						json: items[i].json,
						pairedItem: {
							item: i,
						},
					});
					continue;
				}

				const outputFilename = this.getNodeParameter('outputFilename', i, 'Invoice.pdf') as string;
				const binaryData = await this.helpers.prepareBinaryData(
					response,
					outputFilename
				);
				returnData.push({
					json: items[i].json,
					binary: {
						data: binaryData,
					},
					pairedItem: {
						item: i,
					},
				});
			} catch (error) { // Added catch block
				const errorMessage = error instanceof Error ? error.message : String(error);
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: errorMessage,
						},
						pairedItem: {
							item: i,
						},
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
