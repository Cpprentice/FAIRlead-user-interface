<template>
    <v-form>
        <v-text-field label="Unit From Attribute Regex" v-model="regularExpressionModel" :rules="[regexRule]" :disabled="regexFixed"></v-text-field>
        <v-number-input :min="0" v-model="captureGroup" label="Regex capture group index" :disabled="regexFixed"></v-number-input>
        <!--<v-btn @click="analyzeModel" :disabled="!Boolean(regularExpression)">Analyze Model with Regex</v-btn>-->
        <v-switch color="teal-darken-4" label="Analyze model with regex" v-model="regexFixed" :disabled="!Boolean(regularExpression)"></v-switch>
        <v-select chips :items="fragments" v-model="selectedFragments" multiple :disabled="!regexFixed" label="Selected unit fragments from model"></v-select>
        <suspense>
            <template #default>
                <preloaded-unit-selection chips multiple v-model="selectedUnits" :disabled="!regexFixed" clearable label="Selected units"></preloaded-unit-selection>
            </template>
            <template #fallback>
                <v-select :disabled="true" placeholder="Loading values" label="Selected units"></v-select>
            </template>
        </suspense>
        <v-row>
            <v-col>
                <v-select chips readonly v-model="resolvedPairs" :disabled="!regexFixed" label="Resolved Combinations"></v-select>
            </v-col>
            <v-col>
                <v-select chips readonly v-model="unresolvedFragments" :disabled="!regexFixed" label="Unresolved Unit Fragments"></v-select>
            </v-col>
        </v-row>
        
        
    </v-form>
</template>
<script setup lang="ts">
import { GenericEnhancementHandler, GenericEnhancementHandlerFromJSON, SemanticsApi, Unit } from 'schema_api';
import { computed, ref, watch } from 'vue';
import UnitSelection from '../UnitSelection.vue';
import PreloadedUnitSelection from '../PreloadedUnitSelection.vue';
import { cachedClassProvider } from '@/providers/schema_api';
import { useDebounceFn } from '@/providers/util';

const semanticsApi = new SemanticsApi();

const regexRule = (v: string) => {
  if (!v) return true // allow empty, handle required separately
  try {
    new RegExp(v)
    return true
  } catch (e) {
    return 'Invalid regular expression'
  }
}

const regularExpressionRaw = ref<string>("");
const regularExpression = ref<RegExp|undefined>();
const regularExpressionModel = computed({
    get: () => regularExpressionRaw.value,
    set: (v: string) => {
        try {
            regularExpression.value = new RegExp(v)
            regularExpressionRaw.value = v
        } catch {
            // ignore this
        }
    }
})

const captureGroup = ref<number>(0);

const regexFixed = ref<boolean>(false);

watch(regexFixed, (state) => {
    if (state) {
        analyzeModel();
    } else {
        fragmentSet.value.clear();
    }
})

const fragmentSet = ref<Set<string>>(new Set<string>());
const fragments = computed(() => {
    return Array.from(fragmentSet.value).sort();
})
const selectedFragments = ref<string[]>([]);

const selectedUnits = ref<Unit[]>([]);
const unresolvedFragments = ref<string[]>([]);

const resolvedPairs = ref<string[]>([]);

const debouncedResolvedPairUpdater = useDebounceFn(async () => {
    const matchingInfo = await semanticsApi.matchUnits(selectedUnits.value.map(x => x.id), selectedFragments.value);
    resolvedPairs.value = Object.entries(matchingInfo).filter(([key, unit]) => unit.length > 0).map(([key, unit]) => `${key} -> ${unit}`);
    unresolvedFragments.value = Object.entries(matchingInfo).filter(([key, unit]) => unit.length == 0).map(([key, unit]) => key)
}, 500, {maxWait: 3000, rejectOnCancel: false});

watch([selectedUnits, selectedFragments], async () => {
    debouncedResolvedPairUpdater();
})

// watch(cachedClassProvider.value.classes, (classList) => {

// });

function analyzeModel() {
    fragmentSet.value = new Set<string>();
    selectedFragments.value = [];
    for (const class_ of cachedClassProvider.value.classes) {
        for (const attribute of Object.values(class_.attributes)) {
            const result = regularExpression.value?.exec(attribute.name);
            if (result != null) {
                const matchedString = result[captureGroup.value];
                if (matchedString != undefined) {
                    fragmentSet.value.add(matchedString);
                }
                const x = 42;
            }
        }
    }
}

function createProducerObjectAttributes(): any {
    return {
        regular_expression: regularExpressionRaw.value,
        unit_group_index: captureGroup.value,
        unit_iris: selectedUnits.value.map((unit) => unit.id),
        fragment_whitelist: selectedFragments.value
    }
}


defineExpose<{
  createProducerObjectAttributes: () => any
}>({
  createProducerObjectAttributes
})


</script>
<style lang="scss" scoped>
</style>
