import { reactive } from "vue";

export interface ImportExportInterface {
    performImport(data: string): void;
    performExport(): Promise<string>;
}


class ImportExportProvider implements ImportExportInterface {
    private activeHandler: ImportExportInterface | null;
    
    constructor() {
        this.activeHandler = null;
    }

    async performImport(data: string): Promise<void> {
        await this.activeHandler?.performImport(data);
    }

    async performExport(): Promise<string> {
        if (this.activeHandler == null) {
            return '';
        } 
        return await this.activeHandler?.performExport();
    }

    setHandler(handler: ImportExportInterface) {
        this.activeHandler = handler;
    }

}

const importExportProvider = reactive(new ImportExportProvider())

export {importExportProvider}
