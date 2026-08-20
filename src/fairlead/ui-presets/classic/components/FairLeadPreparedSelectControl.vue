<!---->

<template>
    <v-select
        density="compact"
        variant="outlined"
        v-model="value"
        :readonly="data.readonly"
        @pointerdown.stop=""
        :clearable="true"
        :hide-details="true"
        :items="items"
        :return-object="true"
        :label="data.label"
        @update:modelValue="onUpdated"
    ></v-select>
</template>
<script setup lang="ts" generic="T">
import { ExtendedSelectionOption, FairLeadPreparedSelectControl, ValueType } from '@/fairlead/logic-presets/classic/controls';
import { onMounted, ref, toValue, unref, toRaw } from 'vue';

const items = ref<ExtendedSelectionOption<T>[]>([])

const props = defineProps<{
    data: FairLeadPreparedSelectControl<T>
}>()

const value = ref<ExtendedSelectionOption<T> | undefined>(props.data.value);

onMounted(async () => {
    items.value = await props.data.dataAvailablePromise
})

function onUpdated(state: ExtendedSelectionOption<T>) {
    props.data.setValue(toRaw(state))
    // if (Array.isArray(state)) {
    //     props.data.setValue(state.map(x => unref(x)) as ValueType<Multiple, ExtendedSelectionOption<T>>)
    // } else {
    //     props.data.setValue(unref(state))
    // }
}


</script>