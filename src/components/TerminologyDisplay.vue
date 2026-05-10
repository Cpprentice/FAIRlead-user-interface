<template>
    <div ref="metadata-container" class="metadata"></div>
</template>
<script setup lang="ts">
import { onMounted, useTemplateRef, watch } from 'vue';
import { createMetadata } from '@ts4nfdi/terminology-service-suite-js';

const container = useTemplateRef('metadata-container');

const props = defineProps<{
    iri: string
}>();

function buildTerminologyDisplay() {

    createMetadata(
        {
            // api: "https://semanticlookup.zbmed.de/api/",
            api: "https://api.terminology.tib.eu/api/",
            iri: props.iri,
            parameter: "collection=NFDI4Energy",
            useLegacy:true,
            termLink: "",
            altNamesTab: true,
            hierarchyTab: false,
            crossRefTab: false,
            terminologyInfoTab: false,
            graphViewTab: false,
            termDepictionTab: false,
            hierarchyPreferredRoots:false,
            hierarchyKeepExpansionStates:false,
            hierarchyShowSiblingsOnInit:false,
            hierarchyWrap:true
        },
        container.value
    );
}

onMounted(() => {
    buildTerminologyDisplay();
})

</script>
<style lang="css" scoped>
.metadata {
    max-width:450px;
}
</style>