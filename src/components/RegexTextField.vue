<template>
    <v-text-field label="Regular Expression" v-model="regularExpressionModel" :rules="[regexRule]">
        <template #append-inner>
            <slot name="append" />
        </template>
    </v-text-field>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
    modelValue: RegExp | undefined
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: RegExp | undefined): void
}>();

const regexRule = (v: string) => {
  if (!v) return true // allow empty, handle required separately
  try {
    new RegExp(v)
    return true
  } catch (e) {
    return 'Invalid regular expression'
  }
}

const regularExpressionRaw = ref<string>(props.modelValue?.source || "");
const regularExpression = ref<RegExp|undefined>();
const regularExpressionModel = computed({
    get: () => regularExpressionRaw.value,
    set: (v: string) => {
        try {
            regularExpression.value = new RegExp(v)
            regularExpressionRaw.value = v
            emit('update:modelValue', regularExpression.value)
        } catch {
            // ignore this
            emit('update:modelValue', undefined)
        }
    }
})

</script>
<style lang="scss" scoped></style>
