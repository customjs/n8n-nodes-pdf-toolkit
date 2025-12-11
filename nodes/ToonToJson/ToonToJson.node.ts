import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
} from "n8n-workflow";

export class ToonToJson implements INodeType {
    description: INodeTypeDescription = {
        displayName: "TOON to JSON Reverter (CustomJS)",
        name: "toonToJson",
        icon: "file:customJs.svg",
        group: ["transform"],
        version: 1,
        description: "Decodes the LLM Output String and transforms the contained TOON block back into a JSON Object, using the provided schema.",
        defaults: {
            name: "TOON to JSON",
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
                displayName: "TOON Data",
                name: "toonData",
                type: "string",
                typeOptions: {
                    rows: 10,
                },
                default: "",
                description: "The TOON content to convert back to JSON",
                required: true,
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            try {
                const credentials = await this.getCredentials("customJsApi");
                const toonData = this.getNodeParameter("toonData", i) as string;

                const options = {
                    url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
                    method: 'POST' as const,
                    headers: {
                        "customjs-origin": "make/toonToJson",
                    },
                    body: {
                        input: {
                            toonData: toonData
                        },
                        code: "const toon = require('./utils/toon-cjs'); const decoded = await toon.decode(input.toonData); return decoded;",
                        returnBinary: "false",
                    },
                    json: true,
                };

                const response = await this.helpers.requestWithAuthentication.call(this, 'customJsApi', options);

                returnData.push({
                    json: {
                        json: response,
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
