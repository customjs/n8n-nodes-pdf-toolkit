import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";

export class GetFormFieldNames implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Get PDF Form Fields (CustomJS)",
    name: "GetFormFieldNames",
    icon: "file:customJs.svg",
    group: ["transform"],
    version: 1,
    description: "Extract all form field names and types from a fillable PDF. Use it to identify which fields can be filled in your n8n workflows.",
    defaults: {
      name: "Get PDF Form Fields",
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
        ],
        default: "binary",
      },
      {
        displayName: "Data field name",
        name: "field_name",
        type: "string",
        default: "data",
        description:
          "The field name for binary PDF file. Please make sure the size of PDf file doesn't exceed 6mb.",
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
      const field_name = this.getNodeParameter("field_name", i) as string;
      const isBinary =
        (this.getNodeParameter("resource", i) as string) === "binary";
      const file = isBinary ? getFile(field_name, i) : "";

      if (
        !isBinary
      ) {
        throw new Error(`Invalid binary data`);
      }

      const options = {
        url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
        method: 'POST' as const,
        headers: {
          "customjs-origin": "n8n/getFormFieldNames",
          "x-api-key": credentials.apiKey,
        },
        body: {
          input: { file: file },
          code: `
              const { PDF_GET_FORM_FIELD_NAMES } = requir` + `e('./utils'); 
              const pdfInput = input.file;
              return PDF_GET_FORM_FIELD_NAMES(pdfInput);`,
          returnBinary: "false",
        },
        json: true,
      };

      const response = await this.helpers.httpRequest(options);
      
      returnData.push({
        json: {
          output: JSON.parse(response.toString()),
        },
      });
    }

    return [returnData];
  }
}
