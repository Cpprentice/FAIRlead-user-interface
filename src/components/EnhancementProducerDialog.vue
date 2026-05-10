<template>
    <v-dialog>
        <template #activator="{ props }">
            <slot name="activator" :props="props"></slot>
        </template>
        <template v-slot:default="{ isActive }">
                <v-card title="Add automated tuning">
                <v-card-text>
                    <v-select :items="producerList" v-model="producerType" clearable>
                    </v-select>
                    <component v-if="activeComponent" :is="activeComponent" ref="activeComponentRef"></component>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="persistProducer" :disabled="!Boolean(activeComponent)">Save</v-btn>
                    <v-btn @click="isActive.value = false">Close</v-btn>
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';

import SimpleUnitAnnotationProducer from './enhancement-forms/SimpleUnitAnnotationProducer.vue';
import ConvertAttributeToRelationOperationProducer from './enhancement-forms/ConvertAttributeToRelationOperationProducer.vue';
import ResolveSegmentationOfClassesProducer from './enhancement-forms/ResolveSegmentationOfClassesProducer.vue';

import { GenericEnhancementHandlerFromJSON, SemanticsApi } from 'schema_api';
import { enhancementApi } from '@/providers/schema_api';
import { useRoute } from 'vue-router';


const route = useRoute();

// Use the | operator to chain other components that are added in the future
type Component = typeof SimpleUnitAnnotationProducer | typeof ConvertAttributeToRelationOperationProducer | typeof ResolveSegmentationOfClassesProducer;
type ComponentKey = "SimpleUnitAnnotationProducer" | "ConvertAttributeToRelationOperationProducer" | "ResolveSegmentationOfClassesProducer";

const componentMap: Record<ComponentKey, Component> = {
    SimpleUnitAnnotationProducer: SimpleUnitAnnotationProducer,
    ConvertAttributeToRelationOperationProducer: ConvertAttributeToRelationOperationProducer,
    ResolveSegmentationOfClassesProducer: ResolveSegmentationOfClassesProducer
}

const producerList = [
    "SimpleUnitAnnotationProducer",
    "ConvertAttributeToRelationOperationProducer",
    "ResolveSegmentationOfClassesProducer"
];
const producerType = ref<ComponentKey | undefined>();
const activeComponent = computed(() => producerType.value ? componentMap[producerType.value] : undefined);


const activeComponentRef = ref<undefined | {
  createProducerObjectAttributes: () => any
}>()


const saveDisabled = computed(() => {
    if (!activeComponent.value) return true;

    const attributes = activeComponent.value.createProducerObjectAttributes();
    const x = 42;
});

async function persistProducer() {
    if (!activeComponentRef.value) return;

    const attributes = activeComponentRef.value.createProducerObjectAttributes();
    const producer = GenericEnhancementHandlerFromJSON({
        producer_type: producerType.value,
        attributes: attributes
    });
    await enhancementApi.insertEnhancementHandler(route.params.schemaId, producer);
    const x = 42;
}

</script>
<style lang="scss" scoped></style>
