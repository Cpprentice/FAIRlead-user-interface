<template>
    <filter-autocomplete 
        :option-provider="provider"
        @update="selectionUpdate"
        :externally-disabled="disabled"
        ><!-- dense v-model="partitionSelection"
        filled -->
    </filter-autocomplete>
</template>

<script setup lang="ts">
import { loadingState } from '@/providers/loading_state_provider';
import { cachedEntityProvider, classNameList, routeSensitiveClassNameList, SchemaEntityProvider, ClassSelectionProvider, cachedClassProvider } from '@/providers/schema_api';
import { ClassDefinitionView, FetchError, SchemaApi } from 'schema_api';
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import FilterAutocomplete from './FilterAutocomplete.vue';
import { SelectionProvider } from '@/fairlead/logic-presets/classic/controls';


// let choices = ref<string[]>([]);
// const choices = routeSensitiveClassNameList;
// const selectedEntities = ref<string[]>([]);
const disabled = ref(false);
const route = useRoute();

const provider = ref<SelectionProvider<ClassDefinitionView> | null>(null);

watch(() => route.fullPath, async (newPath, oldPath) => {
    if (route.name == "filtered-linkml-schema" && route.params.schemaId) {
        provider.value = new ClassSelectionProvider(route.params.schemaId);
    } else {
        provider.value = null;
    }
})

async function selectionUpdate(selection: string[]) {
    loadingState.value = true
    disabled.value = true
    try {
        await cachedClassProvider.value.fetchFilteredClasses(route.params.schemaId, selection)
    } finally {
        disabled.value = false
    }
}

// async function setupEntityChoices() {
//     disabled.value = true
//     provider.value = new ClassSelectionProvider(route.params.schemaId)
//     choices.value = await provider.fetchSelectionLabels()
    
//     disabled.value = false
// }

// watch(() => route.fullPath, async (newPath, oldPath) => {
//     await setupEntityChoices()
// })

// onMounted(async () => {
//     await setupEntityChoices()
// })
</script>

<style scoped>
</style>
