<template>
    <v-list-item title="Annotation Statistics" subtitle="section"></v-list-item>
    <v-list-item>
        <template v-slot:prepend>
            <v-icon>mdi-chart-bar</v-icon>
        </template>
        <template v-slot:default>
            <v-list-item-title>Class Count</v-list-item-title>
        </template>
        <template v-slot:append>
            <span class="stat">{{ stats.classCount }}</span>
        </template>
    </v-list-item>
    <v-list-item>
        <template v-slot:prepend>
            <v-icon>mdi-chart-bar</v-icon>
        </template>
        <template v-slot:default>
            <v-list-item-title>Attribute Count</v-list-item-title>
        </template>
        <template v-slot:append>
            <span class="stat">{{ stats.attributeCount }}</span>
        </template>
    </v-list-item>
    <v-list-item>
        <template v-slot:prepend>
            <v-icon>mdi-chart-bar</v-icon>
        </template>
        <template v-slot:default>
            <v-list-item-title>Relation Count</v-list-item-title>
        </template>
        <template v-slot:append>
            <span class="stat">{{ stats.relationCount }}</span>
        </template>
    </v-list-item>
    <v-list-item>
        <template v-slot:prepend>
            <v-icon>mdi-ruler</v-icon>
        </template>
        <template v-slot:default>
            <v-list-item-title>Unit Count</v-list-item-title>
        </template>
        <template v-slot:append>
            <span class="stat">{{ stats.unitCount }}</span>
        </template>
    </v-list-item>
    <v-list-item>
        <template v-slot:prepend>
            <v-icon>mdi-ruler</v-icon>
        </template>
        <template v-slot:default>
            <v-list-item-title>Distinct Unit Count</v-list-item-title>
        </template>
        <template v-slot:append>
            <span class="stat">{{ stats.distinctUnitCount }}</span>
        </template>
    </v-list-item>
    <v-list-item>
        <template v-slot:prepend>
            <v-icon>mdi-tag-text-outline</v-icon>
        </template>
        <template v-slot:default>
            <v-list-item-title>Annotation Count</v-list-item-title>
        </template>
        <template v-slot:append>
            <span class="stat">{{ stats.annotationCount }}</span>
        </template>
    </v-list-item>
    <v-list-item>
        <template v-slot:prepend>
            <v-icon>mdi-tag-text-outline</v-icon>
        </template>
        <template v-slot:default>
            <v-list-item-title>Distinct Annotation Count</v-list-item-title>
        </template>
        <template v-slot:append>
            <span class="stat">{{ stats.distinctAnnotationCount }}</span>
        </template>
    </v-list-item>
</template>
<script setup lang="ts">
import { cachedClassProvider } from '@/providers/schema_api';
import { OntologicalAnnotation, Unit } from 'schema_api';
import { computed } from 'vue';


const stats = computed(() => {
    const attributeList = cachedClassProvider.value.classes.flatMap((x) => Object.values(x.attributes));
    const relationList = cachedClassProvider.value.classes.flatMap((cls) => Object.values(cls.relations));
    const annotationList = attributeList.flatMap((attr) => attr.annotations);
    const annotationIriSet = new Set<string>(annotationList.map((x) => x?.iri));
    const unitList = cachedClassProvider.value.classes.flatMap((x) => Object.values(x.attributes).map((y) => y.unit)).filter((x) => x !== null);
    const unitIdSet = new Set<string>(unitList.map((x) => x?.id));
    return {
        classCount: cachedClassProvider.value.classes.length,
        attributeCount: attributeList.length,
        relationCount: relationList.length,
        annotationCount: annotationList.length,
        distinctAnnotationCount: annotationIriSet.size,
        unitCount: unitList.length,
        distinctUnitCount: unitIdSet.size
        // annotationCount: cachedClassProvider.value.classes.reduce( (acc, cls) => acc + cls.attributes.length, 0),
    };
});


</script>

<style lang="scss" scoped>
span.stat {
    padding-right: 170px;
}
</style>
