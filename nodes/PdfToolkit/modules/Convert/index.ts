import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executePdfToPng } from './PdfToPng';
import { executePdfToText } from './PdfToText';
import { executeHtmlToDocx } from './HtmlToDocx';
import { executeHtmlToPdf } from './HtmlToPdf';
import { executeJsonToToon } from './JsonToToon';
import { executeToonToJson } from './ToonToJson';
import { executeMarkdownToHtml } from './MarkdownToHtml';

export async function executeConvert(
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
    operation: string
): Promise<INodeExecutionData> {
    switch (operation) {
        case 'pdfToPng':
            return executePdfToPng(executeFunctions, itemIndex);
        case 'pdfToText':
            return executePdfToText(executeFunctions, itemIndex);
        case 'htmlToDocx':
            return executeHtmlToDocx(executeFunctions, itemIndex);
        case 'htmlToPdf':
            return executeHtmlToPdf(executeFunctions, itemIndex);
        case 'jsonToToon':
            return executeJsonToToon(executeFunctions, itemIndex);
        case 'toonToJson':
            return executeToonToJson(executeFunctions, itemIndex);
        case 'markdownToHtml':
            return executeMarkdownToHtml(executeFunctions, itemIndex);
        default:
            throw new Error(`Unknown operation: ${operation}`);
    }
}
