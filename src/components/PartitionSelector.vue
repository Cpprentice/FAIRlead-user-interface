<template>
    <v-select 
        v-if="partitionChoices && partitionChoices.length"
        density="compact"
        variant="solo"
        hide-selected
        hide-details
        v-model="partitionSelection"
        :items="partitionChoices"
        @update:model-value="selected"
        >
    </v-select>
</template>

<script setup lang="ts">
import { cachedEntityProvider } from '@/providers/schema_api';
import { FetchError } from 'schema_api';
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const partitionSelection = ref('');
const partitionChoices = ref([]);

const route = useRoute();

function selected(value) {
    cachedEntityProvider.switchPartition(value)
}

async function performApiFetch() {

    if (route.name == 'partitioned-schema') {
        try {
            await cachedEntityProvider.fetchPartitions(route.params.schemaId);
            partitionChoices.value = cachedEntityProvider.partitions.map(x => x.title);
            partitionSelection.value = partitionChoices.value[0]
        } catch (ex) {
            if (ex instanceof FetchError) {
                console.log('Could not fetch partitions')
            } else {
                throw ex;
            }
        }
    } else {
        partitionSelection.value = ''
        partitionChoices.value = []
    }
}

watch(() => route.fullPath, async (newPath, oldPath) => {
    await performApiFetch()
})

onMounted(async () => {
   await performApiFetch()
})
</script>

<style scoped>
</style>
