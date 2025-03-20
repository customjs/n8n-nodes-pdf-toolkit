import {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodePropertyTypes,
} from "n8n-workflow";

export class MergePdf implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Merge PDF",
    name: "mergePdf",
    icon: "file:customJs.svg",
    group: ["transform"],
    version: 1,
    description: "Merge PDF",
    defaults: {
      name: "Merge PDF",
    },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "customJsApi",
        required: true,
      },
    ],
    properties: [],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const files = items.map((item, i) => {
      if (!item.binary?.data) {
        throw new Error(`No binary data found in "data" field for item ${i}`);
      }
      return Buffer.from(item.binary.data.data, "base64");
    });

    const credentials = await this.getCredentials("customJsApi");

    const options = {
      url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
      method: "POST",
      headers: {
        "customjs-origin": "n8n/mergePDFs",
        "x-api-key": credentials.apiKey,
      },
      body: {
        input: files,
        code: "const { PDF_MERGE } = require('./utils'); const pdfBuffers = input.map(obj => Buffer.from(obj).toString('base64')); return PDF_MERGE(pdfBuffers)",
        returnBinary: "true",
      },
      encoding: null,
      json: true,
    };

    const response = await this.helpers.request(options);

    returnData.push({
      json: {} as IDataObject,
      binary: {
        data: {
          data: response,
          mimeType: "application/pdf",
        },
      },
    });

    return [returnData];
  }
}
