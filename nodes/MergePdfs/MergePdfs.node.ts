import {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodePropertyTypes,
} from "n8n-workflow";

export class MergePdfs implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Merge PDFs (customJs)",
    name: "mergePdfs",
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
        displayName: "Data field name or URL array (seperate by comma)",
        name: "field_name",
        type: "string",
        default: "data",
        description:
          "The field names for binary PDF file or urls that indicate PDF files. Please make sure the size of PDf file doesn't exceed 6mb. If it's bigger, pass an array of URLs rather than binary file.",
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
      const credentials = await this.getCredentials("customJsApi");
      const isBinary =
        (this.getNodeParameter("resource", i) as string) === "binary";
      const field_name = this.getNodeParameter("field_name", i) as string;

      const files = isBinary
        ? field_name.split(",").map((name) => getFile(name, i))
        : [];
      const urls = !isBinary ? field_name.split(",") : [];

      const options = {
        url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
        method: "POST",
        headers: {
          "customjs-origin": "n8n/mergePDFs",
          "x-api-key": credentials.apiKey,
        },
        body: {
          input: isBinary ? { files } : { urls },
          code: `
              const { PDF_MERGE } = require('./utils'); 
              input = [...input.files || [],...input.urls || []].filter(i => i); 
              return PDF_MERGE(input);`,
          returnBinary: "true",
        },
        encoding: null,
        json: true,
      };

      const response = await this.helpers.request(options);
      const binaryData = await this.helpers.prepareBinaryData(
        response,
        "output.pdf"
      );

      returnData.push({
        json: {} as IDataObject,
        binary: {
          data: binaryData,
        },
      });
    }

    return [returnData];
  }
}
