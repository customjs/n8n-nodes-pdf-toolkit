import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  NodeConnectionType,
} from "n8n-workflow";

export class Html2Docx implements INodeType {
  description: INodeTypeDescription = {
    displayName: "HTML to Docx (Word) (CustomJS)",
    name: "Html2Docx",
    icon: "file:customJs.svg",
    group: ["transform"],
    version: 1,
    description: "Convert any HTML content into a fully formatted Word (.docx) document. Ideal for generating reports, contracts, or templates directly from your Make.com scenarios.",
    defaults: {
      name: "HTML to Docx",
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
            name: 'Convert HTML to DOCX',
            value: 'html2Docx',
            action: 'Convert HTML to DOCX',
          },
        ],
        default: 'html2Docx',
      },
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
      {
        displayName: "Output Filename",
        name: "outputFilename",
        type: "string",
        default: "output.docx",
        description: "Name for the generated DOCX file (include .docx extension)",
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
            "customjs-origin": "n8n/html2Docx",
          },
          body: {
            input: htmlInput,
            code: "const { HTML2DOCX } = require('./utils'); return HTML2DOCX(input)",
            returnBinary: "true",
          },
          encoding: 'arraybuffer' as const,
          json: true,
        };

        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'customJsApi', options);
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

        const outputFilename = this.getNodeParameter("outputFilename", i, "output.docx") as string;
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
