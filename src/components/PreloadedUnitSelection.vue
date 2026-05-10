<template>
    <v-autocomplete
        :items="selectableUnits"
        v-model:search="searchString"
        placeholder="Start typing..."
        item-title="description"
        item-value="id"
        :return-object="true"
    ></v-autocomplete>
</template>
<script setup lang="ts">
// autocomplete="off"

import { SemanticsApi, Unit } from 'schema_api';
import { computed, ref } from 'vue';



const api = new SemanticsApi();
const allSelectableUnits = await api.getUnits();


const searchString = ref<string>("");
const selectableUnits = computed(() => {
    const searchLower = searchString.value.toLowerCase();

    if (!searchLower) return allSelectableUnits;
    return allSelectableUnits.filter((unit) => unit.description?.toLowerCase().includes(searchLower)).sort((a, b) => {
        const aText = a.description?.toLowerCase();
        const bText = b.description?.toLowerCase();

        if (!aText && !bText) return 0;
        if (!aText) return -1;
        if (!bText) return 1;

        const aIndex = aText.indexOf(searchLower);
        const bIndex = bText.indexOf(searchLower);

        if (aIndex !== bIndex) return aIndex - bIndex;
        return aText.length - bText.length;
    })
})



</script>
<style lang="scss" scoped>
</style>
