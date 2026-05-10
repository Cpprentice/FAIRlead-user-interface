<template>
    <v-dialog max-width="500">
        <template v-slot:activator="{ props: activatorProps }">
            <v-btn density="compact" icon="mdi-pencil" size="small" v-bind="activatorProps" @pointerdown.stop=""></v-btn>
        </template>
        <template v-slot:default="{ isActive }">
            <v-card title="Annotation">
                <v-card-text>
                    <v-select :items="values"></v-select>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn>Save</v-btn>
                    <v-btn @click="isActive.value = false">Close</v-btn>
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
</template>
<script setup lang="ts">

const values = ["ABC", "DEF", "GHI"];

</script>
<style lang="scss" scoped>
</style>
