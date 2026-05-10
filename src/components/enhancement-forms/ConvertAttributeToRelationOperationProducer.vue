<template>
    <v-form>
        <regex-text-field v-for="(_, index) in regularExpressions" :key="index" label="Attribute Regex" v-model="regularExpressions[index]" :disabled="regexFixed">
            <template v-slot:append>
                <v-btn icon="mdi-delete" color="teal-darken-4" size="small" :disabled="index == 0 && regularExpressions.length == 1" @click="removeRegex(index)"></v-btn>
            </template>
        </regex-text-field>
        <v-btn icon="mdi-plus" @click="addRegex" :disabled="regexFixed" color="teal-darken-4" size="small" class="mb-3"></v-btn>
        <v-number-input :min="0" v-model="captureGroup" label="Regex capture group index" :disabled="regexFixed"></v-number-input>
        <v-switch color="teal-darken-4" label="Test Expressions" v-model="regexFixed" :disabled="!allRegexesValid"></v-switch>
        <v-select chips readonly v-model="matchedRelations" :disabled="!regexFixed" label="Matched Relations"></v-select>
    </v-form>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import RegexTextField from '../RegexTextField.vue'
import { cachedClassProvider } from '@/providers/schema_api';

const regularExpressions = ref<(RegExp | undefined)[]>([
    new RegExp("")
]);

const allRegexesValid = computed( () => {
    return !regularExpressions.value.includes(undefined);
});

function addRegex() {
    regularExpressions.value.push(new RegExp(""));
}

function removeRegex(index: number) {
    regularExpressions.value.splice(index, 1);
}

const captureGroup = ref<number>(0);
const regexFixed = ref<boolean>(false);
const matchedRelationSet = ref<Set<string>>(new Set<string>());
const matchedRelations = computed(() => {
    return Array.from(matchedRelationSet.value).sort();
});

function analyzeModel() {
    const classNames = new Set<string>();
    matchedRelationSet.value.clear();
    const foundClassRelationNames = [];
    for (const class_ of cachedClassProvider.value.classes) {
        classNames.add(class_.name);
    }
    for (const class_ of cachedClassProvider.value.classes) {
        for (const attribute of Object.values(class_.attributes)) {
            for (const regularExpression of regularExpressions.value) {
                const result = regularExpression?.exec(attribute.name);
                if (result != null) {
                    const matchedString = result[captureGroup.value];
                    if (matchedString != undefined) {
                        if (classNames.has(matchedString) && class_.name != matchedString) {
                            // matchedRelationSet.value.add(`${matchedString} (${})`);
                            foundClassRelationNames.push(matchedString);
                        }
                    }
                    const x = 42;
                }
            }
            
        }
    }

    
    const frequencies = foundClassRelationNames.reduce<Record<string, number>>((acc, item) => {
        acc[item] = (acc[item] ?? 0) + 1;
        return acc;
    }, {});
    for (const [value, count] of Object.entries(frequencies)) {
        matchedRelationSet.value.add(`${value} (${count})`);
    }
}

watch(regexFixed, (state) => {
    if (state) {
        analyzeModel();
    } else {
        matchedRelationSet.value.clear();
    }
})


function createProducerObjectAttributes(): any {
    return {
        regular_expressions: regularExpressions.value,
        group_index: captureGroup.value
    }
}


defineExpose<{
  createProducerObjectAttributes: () => any
}>({
  createProducerObjectAttributes
})

</script>

<style lang="scss" scoped></style>
