<template>
    <v-container>
        <v-switch
            v-model="reteSettings.showAttributes"
            color="teal"
        >
            <template v-slot:label>
                Show Attributes
            </template>
        </v-switch>
        <v-switch
            v-model="entityGenerationSettings.preventOptimization"
            color="teal"
        >
            <template v-slot:label>
                Prevent Optimization
            </template>
        </v-switch>
        <v-switch
            v-model="entityGenerationSettings.preventUserOptimization"
            :disabled="entityGenerationSettings.preventOptimization"
            color="teal"
        >
            <template v-slot:label>
                Prevent User Optimization
            </template>
        </v-switch>
        <v-switch
            v-model="entityGenerationSettings.preventAutomaticOptimization"
            :disabled="entityGenerationSettings.preventOptimization"
            color="teal"
        >
            <template v-slot:label>
                Prevent Automatic Optimization
            </template>
        </v-switch>
        <v-btn
            color="teal"
            @click.stop="reload()"
        >
            Reload
        </v-btn>
    </v-container>
</template>

<script setup lang="ts">
import {entityGenerationSettings} from '@/providers/entity_generation_settings_provider'
import { reteSettings } from '@/providers/rete_settings_provider';
import { cachedEntityProvider } from '@/providers/schema_api';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter()
const route = useRoute()

async function reload() {
    router.push('')
    router.push({path: route.path, force: true})
    // if (route.name ?? '' in ['schema', 'filtered-schema']) {
    //     await cachedEntityProvider.fetchEntities(route.params.schemaId);
    // }
}
</script>

<style scoped>
</style>
