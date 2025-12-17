import {
    IExecuteFunctions,
    IDataObject,
} from 'n8n-workflow';

export class ApiHelper {
    constructor(private executeFunctions: IExecuteFunctions) { }

    async makeRequest(
        origin: string,
        body: IDataObject,
        returnBinary: boolean = false,
        itemIndex: number = 0
    ): Promise<any> {
        const credentials = await this.executeFunctions.getCredentials('customJsApi');

        const options: any = {
            url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
            method: 'POST',
            headers: {
                'customjs-origin': origin,
            },
            body: {
                ...body,
                returnBinary: returnBinary ? 'true' : 'false',
            },
            json: true,
        };

        if (returnBinary) {
            options.encoding = 'arraybuffer';
        }

        return this.executeFunctions.helpers.httpRequestWithAuthentication.call(
            this.executeFunctions,
            'customJsApi',
            options
        );
    }
}
