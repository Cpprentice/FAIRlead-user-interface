<template>
    <v-autocomplete 
        v-if="choices && choices.length"
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
        :items="choices"
        item-title="label"
        @update:model-value="entitySelectionUpdate"
        ><!-- dense v-model="partitionSelection"
        filled -->
    </v-autocomplete>
</template>

<script setup lang="ts">
import { SelectionProvider } from '@/fairlead/logic-presets/classic/controls';
import { loadingState } from '@/providers/loading_state_provider';
import { cachedEntityProvider, classNameList, routeSensitiveClassNameList, SchemaEntityProvider } from '@/providers/schema_api';
import { FetchError, SchemaApi } from 'schema_api';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps<{
    optionProvider: SelectionProvider<unknown> | undefined | null,
    externallyDisabled: boolean
}>();

const emit = defineEmits<{
    update: [selection: string[]]
}>();


let choices = ref<string[]>([]);
const selectedEntities = ref<string[]>([]);
const internallyDisabled = ref(false);

const disabled = computed(() => {
    return props.externallyDisabled || internallyDisabled.value
});

// const route = useRoute();

async function entitySelectionUpdate(selection: string[]) {
    // loadingState.value = true
    emit("update", selection)
}

async function setupEntityChoices() {
    internallyDisabled.value = true
    if (props.optionProvider) {
        choices.value = await props.optionProvider.fetchSelectionLabels()
    } else {
        choices.value = []
    }
    internallyDisabled.value = false
}

// watch(() => route.fullPath, async (newPath, oldPath) => {
//     await setupEntityChoices()
// })

watch(() => props.optionProvider, async (newProvider) => {
    await setupEntityChoices()
})

onMounted(async () => {
    await setupEntityChoices()
})
</script>

<style scoped>
</style>
