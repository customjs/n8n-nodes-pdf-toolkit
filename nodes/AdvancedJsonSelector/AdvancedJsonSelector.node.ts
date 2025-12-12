import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
} from "n8n-workflow";

export class AdvancedJsonSelector implements INodeType {
    description: INodeTypeDescription = {
        displayName: "Advanced JSON Selector",
        name: "advancedJsonSelector",
        icon: "file:customJs.svg",
        group: ["transform"],
        version: 1,
        description: "Selects, extracts, and flattens specific values from complex, nested JSON structures using JSON Path or simple selectors, making data usable for APIs.",
        defaults: {
            name: "Advanced JSON Selector",
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
                displayName: "JSON",
                name: "json",
                type: "json",
                default: "{}",
                description: "The JSON object to query",
                required: true,
            },
            {
                displayName: "Selector Path",
                name: "path",
                type: "string",
                default: "",
                description: "JSON-PATH Example: $[0].obj[*].item",
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
                const jsonInput = this.getNodeParameter("json", i) as object;
                const path = this.getNodeParameter("path", i) as string;

                const options = {
                    url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
                    method: 'POST' as const,
                    headers: {
                        "customjs-origin": "make/jsonSelector",
                    },
                    body: {
                        input: {
                            json: jsonInput,
                            path: path,
                        },
                        code: "const { JSONPath } = require('jsonpath-plus'); return JSONPath({ path: input.path, json: JSON.parse(input.json) });",
                        returnBinary: "false",
                    },
                };

                const response = await this.helpers.requestWithAuthentication.call(this, 'customJsApi', options);

                returnData.push({
                    json: {
                        result: JSON.parse(response),
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
