import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executeJsonSelect } from './JsonSelect';
import { executeRegex } from './Regex';

export async function executeData(
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
    operation: string
): Promise<INodeExecutionData> {
    switch (operation) {
        case 'jsonSelect':
            return executeJsonSelect(executeFunctions, itemIndex);
        case 'regex':
            return executeRegex(executeFunctions, itemIndex);
        default:
            throw new Error(`Unknown operation: ${operation}`);
    }
}
