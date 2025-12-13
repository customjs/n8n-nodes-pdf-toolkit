import {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodePropertyTypes,
  NodeOperationError,
  NodeConnectionType,
} from "n8n-workflow";

export class MergePdfs implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Merge PDFs (CustomJS)",
    name: "mergePdfs",
    icon: "file:customJs.svg",
    group: ["transform"],
    version: 1,
    description: "Combine multiple PDF files into a single PDF. Perfect for reports, contracts, and document automation in n8n.",
    defaults: {
      name: "Merge PDF",
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [
      {
        name: "customJsApi",
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
            name: 'Merge PDFs',
            value: 'mergePdfs',
            action: 'Merge PDFs',
          },
        ],
        default: 'mergePdfs',
      },
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
        displayName: "Data field name or URL array (seperate by comma)",
        name: "field_name",
        type: "string",
        default: "data",
        description:
          "The field names for binary PDF file or urls that indicate PDF files. Please make sure the size of PDf file doesn't exceed 6mb. If it's bigger, pass an array of URLs rather than binary file.",
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

    try {
      const credentials = await this.getCredentials("customJsApi");
      const isBinary =
        (this.getNodeParameter("resource", 0) as string) === "binary";
      const field_name = this.getNodeParameter("field_name", 0) as string[] | string;

      const files = isBinary ? items.map((item, i) => {
        if (item.binary?.data) {
          return Buffer.from(item.binary.data.data, "base64");
        }
      }) : [];

      const urls = !isBinary ? field_name : [];

      const options = {
        url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
        method: 'POST' as const,
        headers: {
          "customjs-origin": "n8n/mergePDFs",
        },
        body: {
          input: isBinary ? { files } : { urls },
          code: `
              const { PDF_MERGE } = require('./utils'); 
              input = [...input.files || [],...input.urls || []].filter(i => i); 
              return PDF_MERGE(input);`,
          returnBinary: "true",
        },
        encoding: 'arraybuffer' as const,
        json: true,
      };

      const response = await this.helpers.httpRequestWithAuthentication.call(this, 'customJsApi', options);
      if (!response || (Buffer.isBuffer(response) && response.length === 0)) {
        // No binary data returned; emit only JSON without a binary property
        returnData.push({
          json: {} as IDataObject,
          pairedItem: items.map((_, i) => ({
            item: i,
          })),
        });
        return [returnData];
      }

      const outputFilename = this.getNodeParameter("outputFilename", 0, "output.pdf") as string;
      const binaryData = await this.helpers.prepareBinaryData(
        response,
        outputFilename
      );

      returnData.push({
        json: {} as IDataObject,
        binary: {
          data: binaryData,
        },
        pairedItem: items.map((_, i) => ({
          item: i,
        })),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (this.continueOnFail()) {
        returnData.push({
          json: {
            error: errorMessage,
          } as IDataObject,
          pairedItem: items.map((_, i) => ({
            item: i,
          })),
        });
        return [returnData];
      }
      throw new NodeOperationError(this.getNode(), error as Error);
    }

    return [returnData];
  }
}
