import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executeCompress } from './Compress';
import { executeMerge } from './Merge';
import { executeExtractPages } from './ExtractPages';
import { executeGetFormFields } from './GetFormFields';
import { executeFillForm } from './FillForm';
import { executeGenerateInvoice } from './GenerateInvoice';

export async function executePDF(
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
    operation: string
): Promise<INodeExecutionData> {
    switch (operation) {
        case 'compress':
            return executeCompress(executeFunctions, itemIndex);
        case 'merge':
            return executeMerge(executeFunctions, itemIndex);
        case 'extractPages':
            return executeExtractPages(executeFunctions, itemIndex);
        case 'getFormFields':
            return executeGetFormFields(executeFunctions, itemIndex);
        case 'fillForm':
            return executeFillForm(executeFunctions, itemIndex);
        case 'generateInvoice':
            return executeGenerateInvoice(executeFunctions, itemIndex);
        default:
            throw new Error(`Unknown operation: ${operation}`);
    }
}
