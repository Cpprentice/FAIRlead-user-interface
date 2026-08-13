<template>
    <div ref="autocomplete-container"></div>
</template>
<script setup lang="ts">
import { onMounted, useTemplateRef, watch } from 'vue';
// import { createAutocomplete } from '@ts4nfdi/terminology-service-suite-js';
import { OntologicalAnnotation, OntologicalAnnotationFromJSON } from 'schema_api';
import { attributeUnderAnnotation } from '@/providers/component_under_annotation';

// interface Props {
//     terms: OntologicalAnnotation[] | undefined
// }

// const props = withDefaults(defineProps<Props>(), {
//     terms: () => []
// });

const container = useTemplateRef('autocomplete-container');
let stopEvent;

const emit = defineEmits<{
    (e: 'terminologyUpdated', value: OntologicalAnnotation[]): void
}>();

async function buildTerminologyLookup() {
    const { createAutocomplete } = await import('@ts4nfdi/terminology-service-suite-js')

    let preselected = [] as {label?: string, iri: string}[];
    if (attributeUnderAnnotation.value?.annotations != undefined) {
        preselected = attributeUnderAnnotation.value?.annotations.map((x) => {
            return {
                label: x.label,
                iri: x.iri
            }
        })
    }

    // container.value?.replaceChildren()  // clearing is needed because preselection does not change
    let clearButton = container.value?.querySelector<HTMLButtonElement>('button.euiFormControlLayoutClearButton');
    if (clearButton != null) {
        clearButton.click();
    }

    createAutocomplete(
        {
            // api: "https://semanticlookup.zbmed.de/api/",
            api: "https://api.terminology.tib.eu/api/",
            selectionChangedEvent: (props: any) => {
                emit('terminologyUpdated', props.map( (x: any) => OntologicalAnnotationFromJSON({iri: x.iri, operator: 'exact_mapping', label: x.label})))
            },
            parameter: "collection=NFDI4Energy",
            placeholder: "Type to search...",
            preselected: preselected
        },
        container.value
    );
}

watch(attributeUnderAnnotation, async (newAttribute) => {
    if (newAttribute == undefined || newAttribute == null) return;
    await buildTerminologyLookup();
})

onMounted(async () => {
    await buildTerminologyLookup();

    
    stopEvent = (e: Event) => {
        e.stopPropagation();
    };

    const el = container.value;

    if (!el) return;

    // Pointer events used by Rete
    // el.addEventListener('pointerdown', stopEvent, { capture: true });
    // el.addEventListener('mousedown', stopEvent, { capture: true });
    // el.addEventListener('touchstart', stopEvent, { capture: true });

})

</script>
<style lang="css" scoped>

</style>