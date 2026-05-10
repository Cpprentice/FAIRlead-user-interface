<template>
    <v-form>
        <regex-text-field label="Class Name Filter Regex" v-model="classNameFilterRegex" :disabled="regexFixed"></regex-text-field>
        <!--<v-number-input :min="0" v-model="captureGroup" label="Regex capture group index" :disabled="regexFixed"></v-number-input>-->
        <v-row>
            <v-col>
                <regex-text-field label="On Group Rename Source" v-model="onGroupRenameSourceRegex" :disabled="regexFixed"></regex-text-field>
            </v-col>
            <v-col>
                <regex-text-field label="On Group Rename Replacement" v-model="onGroupRenameReplaceRegex" :disabled="regexFixed"></regex-text-field>
            </v-col>
        </v-row>
        <v-switch color="teal-darken-4" label="Test Expression" v-model="regexFixed" :disabled="testDisabled"></v-switch>
        <v-select chips readonly v-model="matchedSegments" :disabled="!regexFixed" label="Matched Segments"></v-select>
    </v-form>
</template>
<script setup lang="ts">
import { cachedClassProvider } from '@/providers/schema_api';
import { computed, ref, watch } from 'vue';

import RegexTextField from '../RegexTextField.vue';


const classNameFilterRegex = ref<RegExp | undefined>(new RegExp(""));
const onGroupRenameSourceRegex = ref<RegExp | undefined>(new RegExp("(.*)"));
const onGroupRenameReplaceRegex = ref<RegExp | undefined>(new RegExp("\\1"));
const matchedSegmentSet = ref<Set<string>>(new Set<string>());
const matchedSegments = computed(() => {
    return Array.from(matchedSegmentSet.value).sort();
});
const regexFixed = ref<boolean>(false);

const testDisabled = computed(() => {
    if (classNameFilterRegex.value === undefined) return true
    if (onGroupRenameSourceRegex.value === undefined && onGroupRenameReplaceRegex.value !== undefined) return true
    if (onGroupRenameSourceRegex.value !== undefined && onGroupRenameReplaceRegex.value === undefined) return true
    return false
})

function analyzeModel() {
    const attributeSetClassLookup = new Map<string, string[]>();
    matchedSegmentSet.value.clear();

    for (const cls of cachedClassProvider.value.classes) {
        const matches = classNameFilterRegex.value?.test(cls.name);
        if (matches) {
            // Create a stable, order-independent key (like frozenset)
            const attributeNamesKey = [...Object.values(cls.attributes).map(x => x.name)].sort().join("|");
            if (!attributeSetClassLookup.has(attributeNamesKey)) {
                attributeSetClassLookup.set(attributeNamesKey, []);
            }
            attributeSetClassLookup.get(attributeNamesKey)!.push(cls.name);
        }
    }

    for (const [attributeKey, classNames] of attributeSetClassLookup) {
        if (classNames.length > 1) {
            const first = classNames[0];
            let renamed = ""
            if (onGroupRenameSourceRegex.value === undefined || onGroupRenameReplaceRegex === undefined) {
                renamed = first;
            } else {
                renamed = first.replace(onGroupRenameSourceRegex.value, onGroupRenameReplaceRegex.value?.source.replace("\\", "$") || "$0");
            }

            matchedSegmentSet.value.add(`${renamed} (${classNames.length})`)
        }
    }
}

watch(regexFixed, (state) => {
    if (state) {
        analyzeModel();
    } else {
        matchedSegmentSet.value.clear();
    }
})


function createProducerObjectAttributes(): any {
    return {
        class_name_filter_regex: classNameFilterRegex.value?.source,
        on_group_rename_source_regex: onGroupRenameSourceRegex.value?.source,
        on_group_rename_replace_regex: onGroupRenameReplaceRegex.value?.source
    }
}


defineExpose<{
  createProducerObjectAttributes: () => any
}>({
  createProducerObjectAttributes
})

</script>
<style lang="scss" scoped></style>
