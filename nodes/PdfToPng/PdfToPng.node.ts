import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";

export class PdfToPng implements INodeType {
  description: INodeTypeDescription = {
    displayName: "PDF To PNG (CustomJs)",
    name: "PdfToPng",
    icon: "file:customJs.svg",
    group: ["transform"],
    version: 1,
    description: "Convert PDF into PNG",
    defaults: {
      name: "Convert PDF into PNG",
    },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "CustomJsApi",
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
      const credentials = await this.getCredentials("CustomJsApi");
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
        method: "POST",
        headers: {
          "customjs-origin": "n8n/pdfToPng",
          "x-api-key": credentials.apiKey,
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

      const response = await this.helpers.request(options);
      const binaryData = await this.helpers.prepareBinaryData(
        response,
        "output.png"
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
