import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";

export class ExtractPages implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Extract Pages From PDF (CustomJs)",
    name: "ExtractPages",
    icon: "file:customJs.svg",
    group: ["transform"],
    version: 1,
    description: "Extract Pages From PDF",
    defaults: {
      name: "Extract Pages From PDF",
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
      {
        displayName: "Page Range",
        name: "pageRange",
        type: "string",
        default: "1",
        description:
          "The range of pages to extract. Default is first page. (ex: 1-3, or 4)",
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
        method: "POST",
        headers: {
          "customjs-origin": "n8n/extractPages",
          "x-api-key": credentials.apiKey,
        },
        body: {
          input: isBinary
            ? { file: file, pageRange }
            : { urls: field_name, pageRange },
          code: `
            const { EXTRACT_PAGES_FROM_PDF } = require('./utils'); 
            const file = input.file || input.urls; 
            const pdfBuffer = file.data ? Buffer.from(Object.values(file.data)).toString('base64'): file; 
            return EXTRACT_PAGES_FROM_PDF(pdfBuffer, input.pageRange);`,
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

      console.log(response);

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
