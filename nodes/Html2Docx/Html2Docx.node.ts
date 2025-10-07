import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";

export class Html2Docx implements INodeType {
  description: INodeTypeDescription = {
    displayName: "HTML to Docx (Word) (customJs)",
    name: "Html2Docx",
    icon: "file:customJs.svg",
    group: ["transform"],
    version: 1,
    description: "Convert HTML to Docx (Word)",
    defaults: {
      name: "HTML to Docx",
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
        description: "The HTML content to convert to Docx",
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
        method: "POST",
        headers: {
          "customjs-origin": "n8n/html2Docx",
          "x-api-key": credentials.apiKey,
        },
        body: {
          input: htmlInput,
          code: "const { HTML2DOCX } = require('./utils'); return HTML2DOCX(input)",
          returnBinary: "true",
        },
        encoding: null,
        json: true,
      };

      const response = await this.helpers.request(options);
      const binaryData = await this.helpers.prepareBinaryData(
        response,
        "output.docx"
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
