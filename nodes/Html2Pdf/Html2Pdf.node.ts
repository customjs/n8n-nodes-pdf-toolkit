import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
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
      {
        displayName: "Output Filename",
        name: "outputFilename",
        type: "string",
        default: "output.pdf",
        description: "Name for the generated PDF file (include .pdf extension)",
        required: false,
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const credentials = await this.getCredentials("customJsApi");
        const htmlInput = this.getNodeParameter("htmlInput", i) as string;

        const options = {
          url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
          method: 'POST' as const,
          headers: {
            "customjs-origin": "n8n/generatePDF",
          },
          body: {
            input: htmlInput,
            code: "const { HTML2PDF } = require('./utils'); return HTML2PDF(input)",
            returnBinary: "true",
          },
          encoding: null,
          json: true,
        };

        const response = await this.helpers.requestWithAuthentication.call(this, 'customJsApi', options);
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

        const outputFilename = this.getNodeParameter("outputFilename", i, "output.pdf") as string;
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
      } catch (error) {
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
