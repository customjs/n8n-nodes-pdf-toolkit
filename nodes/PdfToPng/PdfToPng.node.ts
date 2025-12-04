import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from "n8n-workflow";

export class PdfToPng implements INodeType {
  description: INodeTypeDescription = {
    displayName: "PDF To PNG (CustomJS)",
    name: "PdfToPng",
    icon: "file:customJs.svg",
    group: ["transform"],
    version: 1,
    description: "Convert PDF pages into high-quality PNG images. Perfect for previews, thumbnails, or image-based workflows in n8n.",
    defaults: {
      name: "Convert PDF into PNG",
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
            "customjs-origin": "n8n/pdfToPng",
          },
          body: {
            input: isBinary ? { file: file } : { urls: field_name },
            code: `
            const { PDF2PNG } = require('./utils'); 
            input = input.file || input.urls; 
            return PDF2PNG(input);`,
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

        const binaryData = await this.helpers.prepareBinaryData(
          response,
          "output.png"
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
