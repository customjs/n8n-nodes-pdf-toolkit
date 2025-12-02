import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";

export class Html2Pdf implements INodeType {
  description: INodeTypeDescription = {
    displayName: "PDF Generator (from HTML) (CustomJS)",
    name: "html2Pdf",
    icon: "file:customJs.svg",
    group: ["transform"],
    version: 1,
    description: "Generate professional PDFs directly from HTML content. Perfect for reports, invoices, and templates in n8n.",
    defaults: {
      name: "HTML to PDF",
    },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "customJsApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "HTML Input",
        name: "htmlInput",
        type: "string",
        typeOptions: {
          rows: 10,
        },
        default: "",
        description: "The HTML content to convert to PDF",
        required: true,
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const credentials = await this.getCredentials("customJsApi");
      const htmlInput = this.getNodeParameter("htmlInput", i) as string;

      const options = {
        url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
        method: 'POST' as const,
        headers: {
          "customjs-origin": "n8n/generatePDF",
          "x-api-key": credentials.apiKey,
        },
        body: {
          input: htmlInput,
          code: "const { HTML2PDF } = require('./utils'); return HTML2PDF(input)",
          returnBinary: "true",
        },
        encoding: 'arraybuffer' as const,
        json: true,
      };

      const response = await this.helpers.httpRequest(options);
      if (!response || (Buffer.isBuffer(response) && response.length === 0)) {
        // No binary data returned; emit only JSON without a binary property
        returnData.push({
          json: items[i].json,
          pairedItem: {
            item: i,
          },
        });
        continue;
      }

      const binaryData = await this.helpers.prepareBinaryData(
        response,
        "output.pdf"
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
    }

    return [returnData];
  }
}
