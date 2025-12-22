import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  NodeConnectionType,
} from "n8n-workflow";

export class PdfFormFill implements INodeType {
  description: INodeTypeDescription = {
    displayName: "PDF Form Fill (Fill PDF Fields) (CustomJS)",
    name: "PdfFormFill",
    icon: "file:customJs.svg",
    group: ["transform"],
    version: 1,
    description: "Automatically fill out PDF form fields with dynamic data. Generate ready-to-send PDFs from your n8n workflows.",
    defaults: {
      name: "PDF Form Fill (Fill PDF Fields)",
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
            name: 'Fill PDF Form',
            value: 'pdfFormFill',
            action: 'Fill PDF Form',
          },
        ],
        default: 'pdfFormFill',
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
      }, {
        displayName: "Form Fields",
        name: "fields",
        type: "fixedCollection",
        typeOptions: {
          multipleValues: true,
        },
        description: "Form fields to fill out. User Get PDF Form Field Names node to get the form field names.",
        default: {},
        options: [
          {
            name: "field",
            displayName: "Field",
            values: [
              {
                displayName: "Name",
                name: "name",
                type: "string",
                default: "",
                description: "Name of the form field",
                required: true,
              },
              {
                displayName: "Value",
                name: "value",
                type: "string",
                default: "",
                description: "Value of the form field",
              },
            ],
          },
        ],
      },
      {
        displayName: "Output Filename",
        name: "outputFilename",
        type: "string",
        default: "document.pdf",
        description: "Name for the generated PDF file (include .pdf extension)",
        required: false,
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const getFile = async (field_name: string, i: number) => {
      if (!items[i].binary?.[field_name]) {
        throw new Error(
          `No binary data found in field "${field_name}" for item ${i}`
        );
      }
      return await this.helpers.getBinaryDataBuffer(i, field_name);
    };

    for (let i = 0; i < items.length; i++) {
      try {
        const credentials = await this.getCredentials("customJsApi");
        const field_name = this.getNodeParameter("field_name", i) as string;
        const isBinary =
          (this.getNodeParameter("resource", i) as string) === "binary";

        const file = isBinary ? await getFile(field_name, i) : "";

        if (
          !isBinary
        ) {
          throw new Error(`Invalid binary data`);
        }

        const options = {
          url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
          method: 'POST' as const,
          headers: {
            "customjs-origin": "n8n/pdfFormFill",
          },
          body: {
            input: {
              file: file,
              // n8n fixedCollection with multipleValues returns an object like { field: [{ name, value }, ...] }
              fields: (this.getNodeParameter("fields", i) as any)?.field || []
            },
            code: `
              const { PDF_FILL_FORM } = require('./utils'); 
              const pdfInput = input.file;
              const fieldValues = Object.fromEntries((input.fields || []).map(x => [x.name, x.value]));
              return PDF_FILL_FORM(pdfInput, fieldValues);`,
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

        const outputFilename = this.getNodeParameter("outputFilename", i, "document.pdf") as string;
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
