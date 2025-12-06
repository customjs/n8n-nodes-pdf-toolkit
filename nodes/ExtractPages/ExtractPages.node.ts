import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from "n8n-workflow";

export class ExtractPages implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Extract Pages From PDF (CustomJS)",
    name: "ExtractPages",
    icon: "file:customJs.svg",
    group: ["transform"],
    version: 1,
    description: "Extract specific pages from a PDF and create a new PDF. Ideal for document automation and custom PDF workflows in n8n.",
    defaults: {
      name: "Extract Pages From PDF",
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: "customJsApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "Resource",
        name: "resource",
        type: "options",
        options: [
          {
            name: "Binary PDF",
            value: "binary",
          },
          {
            name: "URL",
            value: "url",
          },
        ],
        default: "binary",
      },
      {
        displayName: "Data field name or URL",
        name: "field_name",
        type: "string",
        default: "data",
        description:
          "The field name for binary PDF file or url that indicates PDF file. Please make sure the size of PDf file doesn't exceed 6mb. If it's bigger, pass URL rather than binary file.",
        required: true,
      },
      {
        displayName: "Page Range",
        name: "pageRange",
        type: "string",
        default: "1",
        description:
          "The range of pages to extract. Default is first page. (ex: 1-3, or 4)",
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

    const getFile = (field_name: string, i: number) => {
      const file = items[i].binary?.[field_name];
      if (!file) {
        throw new Error(
          `No binary data found in field "${field_name}" for item ${i}`
        );
      }
      return Buffer.from(file.data, "base64");
    };

    for (let i = 0; i < items.length; i++) {
      try {
        const credentials = await this.getCredentials("customJsApi");
        const field_name = this.getNodeParameter("field_name", i) as string;
        const pageRange = this.getNodeParameter("pageRange", i) as string;
        const isBinary =
          (this.getNodeParameter("resource", i) as string) === "binary";
        const file = isBinary ? getFile(field_name, i) : "";

        if (
          !isBinary &&
          !field_name.startsWith("http://") &&
          !field_name.startsWith("https://")
        ) {
          throw new Error(`Invalid URL: ${field_name}`);
        }

        const options = {
          url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
          method: 'POST' as const,
          headers: {
            "customjs-origin": "n8n/extractPages",
          },
          body: {
            input: isBinary
              ? { file: file, pageRange }
              : { urls: field_name, pageRange },
            code: `
            const { EXTRACT_PAGES_FROM_PDF } = require('./utils'); 
            const pdfBuffer = input.file ? Buffer.from(input.file, 'base64') : input.urls; 
            return EXTRACT_PAGES_FROM_PDF(pdfBuffer, input.pageRange);`,
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
