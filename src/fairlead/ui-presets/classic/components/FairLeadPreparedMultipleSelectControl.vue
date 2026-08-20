<!--@update:modelValue="onUpdated"-->

<template>
    <v-select
        density="compact"
        variant="outlined"
        v-model="value"
        :readonly="data.readonly"
        @pointerdown.stop=""
        @update:menu="menuStateChangeHandler"
        @click:clear="clearHandler"
        :clearable="true"
        :hide-details="true"
        :items="items"
        :return-object="true"
        :multiple="true"
        :chips="true"
        :label="data.label"
    ></v-select>
</template>
<script setup lang="ts" generic="T">
import { ExtendedSelectionOption, FairLeadPreparedMultipleSelectControl, ValueType } from '@/fairlead/logic-presets/classic/controls';
import { onMounted, ref, toValue, unref, toRaw,  } from 'vue';

const items = ref<ExtendedSelectionOption<T>[]>([])

const props = defineProps<{
    data: FairLeadPreparedMultipleSelectControl<T>
}>()

const value = ref<ExtendedSelectionOption<T>[]>(props.data.value || []);

onMounted(async () => {
    items.value = await props.data.dataAvailablePromise
})

function menuStateChangeHandler(state: boolean) {
    console.log('menuStateChangeHandler', state)
    if (!state) propagateChange(value.value.map(x => toRaw(x)))
}

function propagateChange(state: ExtendedSelectionOption<T>[]) {
    console.log('propagateChange', state)
    props.data.setValue(state)
}

function clearHandler(event: MouseEvent) {
    propagateChange([])
}

function onUpdated(state: ExtendedSelectionOption<T>[]) {
    let c = value;
    //let raw = toRaw(c);
    //let _value = toValue(c);
    //let unreffed = unref(c);
    let raws = c.value.map(x => toRaw(x));
    //let _values = c.value.map(x => toValue(x));
    //let unreffeds = c.value.map(x => unref(x));

    props.data.setValue(state.map(x => toRaw(x)))
    // if (Array.isArray(state)) {
    //     props.data.setValue(state.map(x => unref(x)) as ValueType<Multiple, ExtendedSelectionOption<T>>)
    // } else {
    //     props.data.setValue(unref(state))
    // }
}


</script>