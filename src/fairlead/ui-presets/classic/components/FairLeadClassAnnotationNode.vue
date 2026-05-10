<template>
    <FairLeadNode v-bind="props">
        <template #output-actions="{ item }">
            <v-btn density="compact" icon="mdi-pencil" size="small" @click="editOutput(item)" @pointerdown.stop=""></v-btn>
            <!--<v-dialog max-width="500">
                <template v-slot:activator="{ props: activatorProps }">
                    <v-btn density="compact" icon="mdi-pencil" size="small" v-bind="activatorProps" @pointerdown.stop=""></v-btn>
                </template>
                <template v-slot:default="{ isActive }">
                    <v-card title="Annotation">
                        <v-card-text>
                            <TerminologyLookup></TerminologyLookup>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn>Save</v-btn>
                            <v-btn @click="isActive.value = false">Close</v-btn>
                        </v-card-actions>
                    </v-card>
                </template>
            </v-dialog>-->
        </template>
        <template #output-markers="{ item }">
            <v-tooltip interactive location="bottom" v-if="showAnnotationMarker(item)">
                <template #activator="{ props }">
                    <v-btn  density="compact" icon="mdi-tag-text-outline" size="small" v-bind="props" class="ml-1"></v-btn>
                </template>
                <terminology-display v-for="annotation in item.ref?.[1].annotations" :iri="annotation.iri"></terminology-display>
                <!--<a v-for="annotation in item.ref?.[1].annotations" :href="annotation.iri" target="_blank" class="text-primary font-weight-medium mx-1">{{ annotation.label || "Term" }}</a>-->
            </v-tooltip>
            <v-tooltip interactive location="bottom" v-if="showUnitMarker(item)">
                <template #activator="{ props }">
                    <v-btn  density="compact" icon="mdi-ruler" size="small" v-bind="props" class="ml-1"></v-btn>
                </template>
                <a :href="item.ref?.[1].unit?.id" target="_blank" class="text-primary font-weight-medium">{{ item.ref?.[1].unit?.description }}</a>
            </v-tooltip>
        </template>
    </FairLeadNode>
</template>
<script setup lang="ts">
import TerminologyDisplay from "@/components/TerminologyDisplay.vue";
import FairLeadNode from "./FairLeadNode.vue";
import { attributeUnderAnnotation, classUnderAnnotation } from "@/providers/component_under_annotation";
import { FairleadOutput } from "@/fairlead/logic-presets/classic/outputs";
const props = defineProps(['data', 'emit', 'seed', 'customEmit']);

function showUnitMarker(item: FairleadOutput): boolean {
    return Boolean(item.ref?.[1].unit)
}

function showAnnotationMarker(item: FairleadOutput): boolean {
    if (item.ref?.[1].annotations === undefined) return false
    const show = item.ref?.[1].annotations.length > 0;
    // if (show) {
    //     console.log(item.ref?.[1].annotations)
    // }
    return show
}

function editOutput(item: FairleadOutput) {
    if (item == null) return;
    attributeUnderAnnotation.value = item.ref?.[1];
    classUnderAnnotation.value = item.ref?.[0];
}

</script>
<style lang="scss" scoped>

</style>
