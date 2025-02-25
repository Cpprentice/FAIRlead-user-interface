import { reactive } from "vue";

interface EntityGenerationSettings
{
    preventOptimization?: boolean;
    preventAutomaticOptimization?: boolean;
    preventUserOptimization?: boolean;
    generateInverseRelations?: boolean;
}

const entityGenerationSettings = reactive({
    preventOptimization: false,
    preventAutomaticOptimization: false,
    preventUserOptimization: false,
    generateInverseRelations: false
} as EntityGenerationSettings);

export {entityGenerationSettings}
