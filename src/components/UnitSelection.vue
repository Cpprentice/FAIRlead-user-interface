<template>
    <v-autocomplete
        
        v-model:search="searchString"
        :items="selectableUnits"
        placeholder="Start typing..."
        autocomplete="off"
        item-title="description"
        item-value="id"
        :return-object="true"
    ></v-autocomplete>
</template>
<script setup lang="ts">

// v-model="selectedUnit"

import { useDebounceFn } from '@/providers/util';
import { SemanticsApi, Unit } from 'schema_api';
import { ref, watch } from 'vue';


// const props = defineProps<{
//     defaultUnit: Unit | undefined
// }>();

const api = new SemanticsApi();

const searchString = ref<string>('');
const selectableUnits = ref<Unit[]>([]);
// const selectedUnit = ref<Unit | undefined>(props.defaultUnit);

const updateSelectOptions = useDebounceFn(async () => {
    if (searchString.value.length == 0) {
        selectableUnits.value = [];
    } else {
        selectableUnits.value = await api.searchUnits([searchString.value], 250);
    }
}, 500, {maxWait: 3000, rejectOnCancel: false});

watch(searchString, (value) => {
    updateSelectOptions();
});

</script>
<style lang="scss" scoped>
</style>
