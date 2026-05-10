<template>
    <div v-show="showDownloadButtons">
        <v-btn icon size="48px" @click="downloadLinkML">
            <img src="/linkml-icon-white.png" width="24px" height="24px"/>
            <v-tooltip interactive location="bottom" activator="parent">
                Download as <a href="https://linkml.io" class="text-primary font-weight-medium">LinkML</a>
            </v-tooltip>
        </v-btn>
        <v-tooltip interactive location="bottom">
            <template v-slot:activator="{ props: tooltipProps }">
                <v-menu>
                    <template v-slot:activator="{ props: menuProps }">
                        <v-btn icon size="48px" v-bind="mergeProps(tooltipProps, menuProps)"><!--@click="downloadOEMetadata"-->
                            <img src="/oemetadata.svg" width="24px" height="24px"/>
                        </v-btn>
                    </template>
                    
                    <v-list>
                        <v-list-item @click="downloadOEMetadata(false)">
                            <v-list-item-title>With Structure Enhancement</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="downloadOEMetadata(true)">
                            <v-list-item-title>No Structure Enhancement</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </template>
            Download as <a href="https://openenergyplatform.org/about/" class="text-primary font-weight-medium">OEMetadata</a>
        </v-tooltip>
        <v-btn icon @click.stop="performExport()"><v-icon>mdi-export-variant</v-icon></v-btn>
    </div>
</template>

<script setup lang="ts">
import { SchemaApi } from 'schema_api';
import { useRoute } from 'vue-router';
import { importExportProvider } from '@/providers/import_export_provider';
import { computed, mergeProps } from 'vue';

const route = useRoute();
const showDownloadButtons = computed(() => {
    return route.params.schemaId !== undefined
});

function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

async function performExport() {
    let jsonString = await importExportProvider.performExport();
    const blob = new Blob([jsonString], { type: "application/json" });
    downloadBlob(blob, 'model_export.json');
}

async function downloadLinkML() {
    const api = new SchemaApi();
    const response = await api.getClassesBySchemaRaw({schemaId: route.params.schemaId as string}, {headers: {
        "Accept": "application/x.linkml+yaml"
    }});
    const blob = await response.raw.blob();
    downloadBlob(blob, `${route.params.schemaId}-linkml.yaml`);
}

async function downloadOEMetadata(preventStructuralEnhancement: boolean = false) {
    const api = new SchemaApi();
    const response = await api.getClassesBySchemaRaw({schemaId: route.params.schemaId as string, preventStructuralEnhancement: preventStructuralEnhancement}, {headers: {
        "Accept": "application/x.oemeta+json"
    }});
    const blob = await response.raw.blob();
    downloadBlob(blob, `${route.params.schemaId}-oemetadata.json`);
}

</script>

<style lang="scss" scoped>

</style>
