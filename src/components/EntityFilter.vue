<template>
    <v-autocomplete 
        v-if="entityChoices && entityChoices.length"
        density="compact"
        variant="solo"
        hide-selected
        hide-details
        multiple
        chips
        clearable
        closable-chips
        :disabled="disabled"
        v-model="selectedEntities"
        :items="entityChoices"
        item-title="label"
        @update:model-value="entitySelectionUpdate"
        ><!-- dense v-model="partitionSelection"
        filled -->
    </v-autocomplete>
</template>

<script setup lang="ts">
import { loadingState } from '@/providers/loading_state_provider';
import { cachedEntityProvider, SchemaEntityProvider } from '@/providers/schema_api';
import { FetchError, SchemaApi } from 'schema_api';
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';


const entityChoices = ref([]);
const selectedEntities = ref([]);
const disabled = ref(false);

const route = useRoute();

async function entitySelectionUpdate(selection) {
    loadingState.value = true
    disabled.value = true
    try {
        await cachedEntityProvider.fetchFilteredEntities(route.params.schemaId, selection)
    } finally {
        disabled.value = false
    }
}

async function setupEntityChoices() {
    disabled.value = true
    if (route.name == 'filtered-schema') {
        const provider = new SchemaEntityProvider(route.params.schemaId)
        entityChoices.value = await provider.fetchSelectionLabels()
    } else {
        entityChoices.value = []
    }
    disabled.value = false
}

watch(() => route.fullPath, async (newPath, oldPath) => {
    await setupEntityChoices()
})

onMounted(async () => {
    await setupEntityChoices()
})
</script>

<style scoped>
</style>
