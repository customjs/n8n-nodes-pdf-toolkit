import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";

export class Markdown2Html implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Markdown to HTML (customJs)",
    name: "Markdown2Html",
    icon: "file:customJs.svg",
    group: ["transform"],
    version: 1,
    description: "Convert Markdown to HTML",
    defaults: {
      name: "Markdown to HTML",
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
        displayName: "Markdown Input",
        name: "markdownInput",
        type: "string",
        typeOptions: {
          rows: 10,
        },
        default: "",
        description: "The Markdown content to convert to HTML",
        required: true,
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const credentials = await this.getCredentials("customJsApi");
      const markdownInput = this.getNodeParameter("markdownInput", i) as string;

      const options = {
        url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
        method: "POST",
        headers: {
          "customjs-origin": "n8n/markdown2html",
          "x-api-key": credentials.apiKey,
        },
        body: {
          input: markdownInput,
          code: "const { MD2HTML } = require('./utils'); return MD2HTML(input)",
          returnBinary: "false",
        },
        encoding: null,
        json: true,
      };

      const response = await this.helpers.request(options);

      returnData.push({
        json: {
          output: response.toString(),
        },
      });
    }

    return [returnData];
  }
}
